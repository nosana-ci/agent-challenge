// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { InferBcsType } from '@mysten/bcs';
import { bcs } from '@mysten/bcs';
import { SuiClient } from '@mysten/sui/client';
import type { Signer } from '@mysten/sui/cryptography';
import type { ClientCache, ClientWithExtensions } from '@mysten/sui/experimental';
import type { TransactionObjectArgument, TransactionResult } from '@mysten/sui/transactions';
import { coinWithBalance, Transaction } from '@mysten/sui/transactions';
import { normalizeStructTag, parseStructTag } from '@mysten/sui/utils';

import {
	MAINNET_WALRUS_PACKAGE_CONFIG,
	statusLifecycleRank,
	TESTNET_WALRUS_PACKAGE_CONFIG,
} from './constants.js';
import {
	addMetadata,
	Blob,
	insertOrUpdateMetadataPair,
	removeMetadataPair,
} from './contracts/walrus/blob.js';
import type { Committee } from './contracts/walrus/committee.js';
import * as metadata from './contracts/walrus/metadata.js';
import { StakingInnerV1 } from './contracts/walrus/staking_inner.js';
import { StakingPool } from './contracts/walrus/staking_pool.js';
import { Staking } from './contracts/walrus/staking.js';
import { Storage } from './contracts/walrus/storage_resource.js';
import * as subsidies from './contracts/subsidies/subsidies.js';
import { SystemStateInnerV1 } from './contracts/walrus/system_state_inner.js';
import {
	certifyBlob,
	deleteBlob,
	extendBlob,
	registerBlob,
	reserveSpace,
	System,
} from './contracts/walrus/system.js';
import {
	BehindCurrentEpochError,
	BlobBlockedError,
	BlobNotCertifiedError,
	InconsistentBlobError,
	NoBlobMetadataReceivedError,
	NoBlobStatusReceivedError,
	NotEnoughBlobConfirmationsError,
	NotEnoughSliversReceivedError,
	NoVerifiedBlobStatusReceivedError,
	RetryableWalrusClientError,
	WalrusClientError,
} from './error.js';
import { StorageNodeClient } from './storage-node/client.js';
import { LegallyUnavailableError, NotFoundError, UserAbortError } from './storage-node/error.js';
import type { BlobMetadataWithId, BlobStatus, GetSliverResponse } from './storage-node/types.js';
import type {
	CertifyBlobOptions,
	CommitteeInfo,
	ComputeBlobMetadataOptions,
	DeleteBlobOptions,
	EncodingType,
	ExtendBlobOptions,
	FanOutConfig,
	GetBlobMetadataOptions,
	GetCertificationEpochOptions,
	GetSliversOptions,
	GetStorageConfirmationOptions,
	GetVerifiedBlobStatusOptions,
	ProtocolMessageCertificate,
	ReadBlobOptions,
	RegisterBlobOptions,
	SliversForNode,
	StorageNode,
	StorageWithSizeOptions,
	WalrusClientConfig,
	WalrusClientExtensionOptions,
	WalrusPackageConfig,
	WriteBlobAttributesOptions,
	WriteBlobOptions,
	WriteBlobToFanOutProxyOptions,
	WriteEncodedBlobOptions,
	WriteEncodedBlobToNodesOptions,
	WriteMetadataOptions,
	WriteSliverOptions,
	WriteSliversToNodeOptions,
} from './types.js';
import { blobIdToInt, IntentType, SliverData, StorageConfirmation } from './utils/bcs.js';
import {
	encodedBlobLength,
	getShardIndicesByNodeId,
	getSourceSymbols,
	isAboveValidity,
	isQuorum,
	signersToBitmap,
	storageUnitsFromSize,
	toPairIndex,
	toShardIndex,
	toTypeString,
} from './utils/index.js';
import { SuiObjectDataLoader } from './utils/object-loader.js';
import { shuffle, weightedShuffle } from './utils/randomness.js';
import { getWasmBindings } from './wasm.js';
import { chunk } from '@mysten/utils';
import { FanOutProxyClient } from './fan-out-proxy/client.js';

export class WalrusClient {
	#storageNodeClient: StorageNodeClient;
	#wasmUrl: string | undefined;

	#packageConfig: WalrusPackageConfig;
	#suiClient: ClientWithExtensions<{
		jsonRpc: SuiClient;
	}>;
	#objectLoader: SuiObjectDataLoader;

	#blobMetadataConcurrencyLimit = 10;
	#readCommittee?: CommitteeInfo | Promise<CommitteeInfo> | null;

	#cache: ClientCache;

	#fanOutConfig: FanOutConfig | null = null;
	#fanOutClient: FanOutProxyClient | null = null;

	constructor(config: WalrusClientConfig) {
		if (config.network && !config.packageConfig) {
			const network = config.network;
			switch (network) {
				case 'testnet':
					this.#packageConfig = TESTNET_WALRUS_PACKAGE_CONFIG;
					break;
				case 'mainnet':
					this.#packageConfig = MAINNET_WALRUS_PACKAGE_CONFIG;
					break;
				default:
					throw new WalrusClientError(`Unsupported network: ${network}`);
			}
		} else {
			this.#packageConfig = config.packageConfig!;
		}

		this.#wasmUrl = config.wasmUrl;
		this.#fanOutConfig = config.fanOut ?? null;
		if (this.#fanOutConfig) {
			this.#fanOutClient = new FanOutProxyClient(this.#fanOutConfig);
		}

		this.#suiClient =
			config.suiClient ??
			new SuiClient({
				url: config.suiRpcUrl,
			});

		this.#storageNodeClient = new StorageNodeClient(config.storageNodeClientOptions);
		this.#objectLoader = new SuiObjectDataLoader(this.#suiClient);
		this.#cache = this.#suiClient.cache.scope('@mysten/walrus');
	}

	static experimental_asClientExtension({
		packageConfig,
		network,
		...options
	}: WalrusClientExtensionOptions = {}) {
		return {
			name: 'walrus' as const,
			register: (
				client: ClientWithExtensions<{
					jsonRpc: SuiClient;
				}>,
			) => {
				const walrusNetwork = network || client.network;

				if (walrusNetwork !== 'mainnet' && walrusNetwork !== 'testnet') {
					throw new WalrusClientError('Walrus client only supports mainnet and testnet');
				}

				return new WalrusClient(
					packageConfig
						? {
								packageConfig,
								suiClient: client,
								...options,
							}
						: {
								network: walrusNetwork as 'mainnet' | 'testnet',
								suiClient: client,
								...options,
							},
				);
			},
		};
	}
	/** The Move type for a WAL coin */
	#walType() {
		return this.#cache.read(['walType'], async () => {
			const stakedWal = await this.#suiClient.jsonRpc.getNormalizedMoveStruct({
				package: await this.#getPackageId(),
				module: 'staked_wal',
				struct: 'StakedWal',
			});

			const balanceType = stakedWal.fields.find((field) => field.name === 'principal')?.type;

			if (!balanceType) {
				throw new WalrusClientError('WAL type not found');
			}

			const parsed = parseStructTag(toTypeString(balanceType));
			const coinType = parsed.typeParams[0];

			if (!coinType) {
				throw new WalrusClientError('WAL type not found');
			}

			return normalizeStructTag(coinType);
		});
	}

	#getPackageId() {
		return this.#cache.read(['getPackageId'], async () => {
			const system = await this.#objectLoader.load(this.#packageConfig.systemObjectId);
			return parseStructTag(system.type!).address;
		});
	}

	/** The Move type for a Blob object */
	getBlobType() {
		return this.#cache.read(['getBlobType'], async () => {
			return `${await this.#getPackageId()}::blob::Blob`;
		});
	}

	#getWalrusPackageId() {
		return this.#cache.read(['getSystemPackageId'], async () => {
			const { package_id } = await this.systemObject();
			return package_id;
		});
	}

	#getSubsidiesPackageId() {
		return this.#cache.read(['getSubsidiesContract'], async () => {
			if (!this.#packageConfig.subsidiesObjectId) {
				return null;
			}

			const subsidiesObject = await this.#objectLoader.load(
				this.#packageConfig.subsidiesObjectId,
				subsidies.Subsidies(),
			);

			return subsidiesObject.package_id;
		});
	}

	#wasmBindings() {
		return this.#cache.read(['wasmBindings'], async () => {
			return getWasmBindings(this.#wasmUrl);
		});
	}

	/** The cached system object for the walrus package */
	systemObject() {
		return this.#objectLoader.load(this.#packageConfig.systemObjectId, System());
	}

	/** The cached staking pool object for the walrus package */
	stakingObject() {
		return this.#objectLoader.load(this.#packageConfig.stakingPoolId, Staking());
	}

	/** The system state for the current version of walrus contract  */
	async systemState() {
		const systemState = await this.#objectLoader.loadFieldObject(
			this.#packageConfig.systemObjectId,
			{ type: 'u64', value: (await this.systemObject()).version },
			SystemStateInnerV1(),
		);

		return systemState;
	}

	/** The staking state for the current version of walrus contract */
	async stakingState() {
		return this.#objectLoader.loadFieldObject(
			this.#packageConfig.stakingPoolId,
			{
				type: 'u64',
				value: (await this.stakingObject()).version,
			},
			StakingInnerV1(),
		);
	}

	/** Read a blob from the storage nodes */
	readBlob = this.#retryOnPossibleEpochChange(this.#internalReadBlob);

	async #internalReadBlob({ blobId, signal }: ReadBlobOptions) {
		const systemState = await this.systemState();
		const numShards = systemState.committee.n_shards;

		const blobMetadata = await this.getBlobMetadata({ blobId, signal });

		const slivers = await this.getSlivers({ blobId, signal });

		const bindings = await this.#wasmBindings();

		const blobBytes = bindings.decodePrimarySlivers(
			blobId,
			numShards,
			blobMetadata.metadata.V1.unencoded_length,
			slivers,
		);

		const reconstructedBlobMetadata = bindings.computeMetadata(
			systemState.committee.n_shards,
			blobBytes,
		);

		if (reconstructedBlobMetadata.blobId !== blobId) {
			throw new InconsistentBlobError('The specified blob was encoded incorrectly.');
		}

		return blobBytes;
	}

	async computeBlobMetadata({ bytes, numShards }: ComputeBlobMetadataOptions) {
		let shardCount: number | undefined;
		if (typeof numShards === 'number') {
			shardCount = numShards;
		} else {
			const systemState = await this.systemState();
			shardCount = systemState.committee.n_shards;
		}

		const bindings = await this.#wasmBindings();
		const { blobId, metadata, rootHash } = bindings.computeMetadata(shardCount, bytes);
		let sha256Hash: Promise<Uint8Array> | undefined;
		const nonce = crypto.getRandomValues(new Uint8Array(32));

		return {
			rootHash,
			blobId,
			metadata: {
				encodingType: metadata.V1.encoding_type,
				hashes: Array.from(metadata.V1.hashes).map((hashes) => ({
					primaryHash: hashes.primary_hash,
					secondaryHash: hashes.secondary_hash,
				})),
				unencodedLength: metadata.V1.unencoded_length,
			},
			nonce,
			blobDigest: () => {
				if (!sha256Hash) {
					sha256Hash = crypto.subtle.digest('SHA-256', bytes).then((hash) => new Uint8Array(hash));
				}

				return sha256Hash;
			},
		};
	}

	async getBlobMetadata({ blobId, signal }: GetBlobMetadataOptions) {
		const committee = await this.#getReadCommittee({ blobId, signal });
		const randomizedNodes = shuffle(committee.nodes);

		const stakingState = await this.stakingState();
		const numShards = stakingState.n_shards;

		let numNotFoundWeight = 0;
		let numBlockedWeight = 0;
		let totalErrorCount = 0;
		const controller = new AbortController();

		const metadataExecutors = randomizedNodes.map((node) => async () => {
			try {
				return await this.#storageNodeClient.getBlobMetadata(
					{ blobId },
					{
						nodeUrl: node.networkUrl,
						signal: signal ? AbortSignal.any([controller.signal, signal]) : controller.signal,
					},
				);
			} catch (error) {
				if (error instanceof NotFoundError) {
					numNotFoundWeight += node.shardIndices.length;
				} else if (error instanceof LegallyUnavailableError) {
					numBlockedWeight += node.shardIndices.length;
				}

				totalErrorCount += 1;
				throw error;
			}
		});

		try {
			const attemptGetMetadata = metadataExecutors.shift()!;
			return await attemptGetMetadata();
		} catch (error) {
			const chunkSize = Math.floor(metadataExecutors.length / this.#blobMetadataConcurrencyLimit);
			const chunkedExecutors = chunk(metadataExecutors, chunkSize);

			return await new Promise<BlobMetadataWithId>((resolve, reject) => {
				chunkedExecutors.forEach(async (executors) => {
					for (const executor of executors) {
						try {
							const result = await executor();
							controller.abort('Blob metadata successfully retrieved.');
							resolve(result);
						} catch (error) {
							if (error instanceof UserAbortError) {
								reject(error);
								return;
							} else if (isQuorum(numBlockedWeight + numNotFoundWeight, numShards)) {
								const abortError =
									numNotFoundWeight > numBlockedWeight
										? new BlobNotCertifiedError(`The specified blob ${blobId} is not certified.`)
										: new BlobBlockedError(`The specified blob ${blobId} is blocked.`);

								controller.abort(abortError);
								reject(abortError);
								return;
							}

							if (totalErrorCount === metadataExecutors.length) {
								reject(
									new NoBlobMetadataReceivedError(
										'No valid blob metadata could be retrieved from any storage node.',
									),
								);
							}
						}
					}
				});
			});
		}
	}

	async getSlivers({ blobId, signal }: GetSliversOptions) {
		const committee = await this.#getReadCommittee({ blobId, signal });
		const randomizedNodes = weightedShuffle(
			committee.nodes.map((node) => ({
				value: node,
				weight: node.shardIndices.length,
			})),
		);

		const stakingState = await this.stakingState();
		const numShards = stakingState.n_shards;
		const { primarySymbols: minSymbols } = getSourceSymbols(numShards);

		const sliverPairIndices = randomizedNodes.flatMap((node) =>
			node.shardIndices.map((shardIndex) => ({
				url: node.networkUrl,
				sliverPairIndex: toPairIndex(shardIndex, blobId, numShards),
			})),
		);

		const controller = new AbortController();
		const chunkedSliverPairIndices = chunk(sliverPairIndices, minSymbols);
		const slivers: GetSliverResponse[] = [];
		const failedNodes = new Set<string>();
		let numNotFoundWeight = 0;
		let numBlockedWeight = 0;
		let totalErrorCount = 0;

		return new Promise<GetSliverResponse[]>((resolve, reject) => {
			chunkedSliverPairIndices[0].forEach(async (_, colIndex) => {
				for (let rowIndex = 0; rowIndex < chunkedSliverPairIndices.length; rowIndex += 1) {
					const value = chunkedSliverPairIndices.at(rowIndex)?.at(colIndex);
					if (!value) break;

					const { url, sliverPairIndex } = value;

					try {
						if (failedNodes.has(url)) {
							throw new Error(`Skipping node at ${url} due to previous failure.`);
						}

						const sliver = await this.#storageNodeClient.getSliver(
							{ blobId, sliverPairIndex, sliverType: 'primary' },
							{
								nodeUrl: url,
								signal: signal ? AbortSignal.any([controller.signal, signal]) : controller.signal,
							},
						);

						if (slivers.length === minSymbols) {
							controller.abort('Enough slivers successfully retrieved.');
							resolve(slivers);
							return;
						}

						slivers.push(sliver);
					} catch (error) {
						if (error instanceof NotFoundError) {
							numNotFoundWeight += 1;
						} else if (error instanceof LegallyUnavailableError) {
							numBlockedWeight += 1;
						} else if (error instanceof UserAbortError) {
							reject(error);
							return;
						}

						if (isQuorum(numBlockedWeight + numNotFoundWeight, numShards)) {
							const abortError =
								numNotFoundWeight > numBlockedWeight
									? new BlobNotCertifiedError(`The specified blob ${blobId} is not certified.`)
									: new BlobBlockedError(`The specified blob ${blobId} is blocked.`);

							controller.abort(abortError);
							reject(abortError);
							return;
						}

						failedNodes.add(url);
						totalErrorCount += 1;

						const remainingTasks = sliverPairIndices.length - (slivers.length + totalErrorCount);
						const tooManyFailures = slivers.length + remainingTasks < minSymbols;

						if (tooManyFailures) {
							const abortError = new NotEnoughSliversReceivedError(
								`Unable to retrieve enough slivers to decode blob ${blobId}.`,
							);
							controller.abort(abortError);
							reject(abortError);
						}
					}
				}
			});
		});
	}

	/**
	 * Gets the blob status from multiple storage nodes and returns the latest status that can be verified.
	 */
	async getVerifiedBlobStatus({ blobId, signal }: GetVerifiedBlobStatusOptions) {
		// Read from the latest committee because, during epoch change, it is the committee
		// that will have the most up-to-date information on old and newly certified blobs:
		const committee = await this.#getActiveCommittee();
		const stakingState = await this.stakingState();
		const numShards = stakingState.n_shards;
		const controller = new AbortController();

		const statuses = await new Promise<{ status: BlobStatus; weight: number }[]>(
			(resolve, reject) => {
				const results: { status: BlobStatus; weight: number }[] = [];
				let successWeight = 0;
				let numNotFoundWeight = 0;
				let settledCount = 0;

				committee.nodes.forEach(async (node) => {
					const weight = node.shardIndices.length;

					try {
						const status = await this.#storageNodeClient.getBlobStatus(
							{ blobId },
							{
								nodeUrl: node.networkUrl,
								signal: signal ? AbortSignal.any([controller.signal, signal]) : controller.signal,
							},
						);

						if (isQuorum(successWeight, numShards)) {
							controller.abort('Quorum of blob statuses retrieved successfully.');
							resolve(results);
						} else {
							successWeight += weight;
							results.push({ status, weight });
						}
					} catch (error) {
						if (error instanceof NotFoundError) {
							numNotFoundWeight += weight;
						} else if (error instanceof UserAbortError) {
							reject(error);
						}

						if (isQuorum(numNotFoundWeight, numShards)) {
							const abortError = new BlobNotCertifiedError('The blob does not exist.');
							controller.abort(abortError);
							reject(abortError);
						}
					} finally {
						settledCount += 1;
						if (settledCount === committee.nodes.length) {
							reject(
								new NoBlobStatusReceivedError(
									'Not enough statuses were retrieved to achieve quorum.',
								),
							);
						}
					}
				});
			},
		);

		const aggregatedStatuses = statuses.reduce((accumulator, value) => {
			const { status, weight } = value;
			const key = JSON.stringify(status);

			const existing = accumulator.get(key);
			if (existing) {
				existing.totalWeight += weight;
			} else {
				accumulator.set(key, { status, totalWeight: weight });
			}

			return accumulator;
		}, new Map<string, { status: BlobStatus; totalWeight: number }>());

		const uniqueStatuses = [...aggregatedStatuses.values()];
		const sortedStatuses = uniqueStatuses.toSorted(
			(a, b) => statusLifecycleRank[b.status.type] - statusLifecycleRank[a.status.type],
		);

		for (const value of sortedStatuses) {
			// TODO: We can check the chain via the `event` field as a fallback here.
			if (isAboveValidity(value.totalWeight, numShards)) {
				return value.status;
			}
		}

		throw new NoVerifiedBlobStatusReceivedError(
			`The blob status could not be verified for blob ${blobId},`,
		);
	}

	async #getCertificationEpoch({ blobId, signal }: GetCertificationEpochOptions) {
		const stakingState = await this.stakingState();
		const currentEpoch = stakingState.epoch;

		if (stakingState.epoch_state.$kind === 'EpochChangeSync') {
			const status = await this.getVerifiedBlobStatus({ blobId, signal });
			if (status.type === 'nonexistent' || status.type === 'invalid') {
				throw new BlobNotCertifiedError(`The specified blob ${blobId} is ${status.type}.`);
			}

			if (typeof status.initialCertifiedEpoch !== 'number') {
				throw new BlobNotCertifiedError(`The specified blob ${blobId} is not certified.`);
			}

			if (status.initialCertifiedEpoch > currentEpoch) {
				throw new BehindCurrentEpochError(
					`The client is at epoch ${currentEpoch} while the specified blob was certified at epoch ${status.initialCertifiedEpoch}.`,
				);
			}

			return status.initialCertifiedEpoch;
		}

		return currentEpoch;
	}

	/**
	 * Retrieves the node committee responsible for serving reads.
	 *
	 * During an epoch change, reads should be served by the previous committee if the blob was
	 * certified in an earlier epoch. This ensures that we read from nodes with the most accurate
	 * information as nodes from the current committee might still be receiving transferred shards
	 * from the previous committee.
	 */
	async #getReadCommittee(options: ReadBlobOptions) {
		if (!this.#readCommittee) {
			this.#readCommittee = this.#forceGetReadCommittee(options);
		}
		return this.#readCommittee;
	}

	async #forceGetReadCommittee({ blobId, signal }: ReadBlobOptions) {
		const stakingState = await this.stakingState();
		const isTransitioning = stakingState.epoch_state.$kind === 'EpochChangeSync';
		const certificationEpoch = await this.#getCertificationEpoch({ blobId, signal });

		if (isTransitioning && certificationEpoch < stakingState.epoch) {
			return await this.#getCommittee(stakingState.previous_committee);
		}
		return await this.#getActiveCommittee();
	}

	/**
	 * Calculate the cost of storing a blob for a given a size and number of epochs.
	 */
	async storageCost(size: number, epochs: number) {
		const systemState = await this.systemState();
		const encodedSize = encodedBlobLength(size, systemState.committee.n_shards);
		const storageUnits = storageUnitsFromSize(encodedSize);
		const storageCost =
			BigInt(storageUnits) * BigInt(systemState.storage_price_per_unit_size) * BigInt(epochs);
		BigInt(epochs);

		const writeCost = BigInt(storageUnits) * BigInt(systemState.write_price_per_unit_size);

		return { storageCost, writeCost, totalCost: storageCost + writeCost };
	}

	/**
	 * A utility for creating a storage object in a transaction.
	 *
	 * @usage
	 * ```ts
	 * tx.transferObjects([client.createStorage({ size: 1000, epochs: 3 })], owner);
	 * ```
	 */
	createStorage({ size, epochs, walCoin, owner }: StorageWithSizeOptions) {
		return async (tx: Transaction) => {
			const systemObject = await this.systemObject();
			const systemState = await this.systemState();
			const encodedSize = encodedBlobLength(size, systemState.committee.n_shards);
			const { storageCost } = await this.storageCost(size, epochs);
			const [walrusPackageId, subsidiesPackageId] = await Promise.all([
				this.#getWalrusPackageId(),
				this.#getSubsidiesPackageId(),
			]);

			return tx.add(
				this.#withWal(
					storageCost,
					owner,
					walCoin ?? null,
					subsidiesPackageId !== null,
					(coin, tx) => {
						return tx.add(
							subsidiesPackageId
								? subsidies.reserveSpace({
										package: subsidiesPackageId,
										arguments: [
											this.#packageConfig.subsidiesObjectId!,
											systemObject.id.id,
											encodedSize,
											epochs,
											coin,
										],
									})
								: reserveSpace({
										package: walrusPackageId,
										arguments: [systemObject.id.id, encodedSize, epochs, coin],
									}),
						);
					},
				),
			);
		};
	}

	#withWal<T extends TransactionResult | void>(
		amount: bigint,
		owner: string,
		source: TransactionObjectArgument | null,
		withSubsidies: boolean,
		fn: (coin: TransactionObjectArgument, tx: Transaction) => T | Promise<T>,
	) {
		return async (tx: Transaction): Promise<T> => {
			const walType = await this.#walType();
			const coin = source
				? tx.splitCoins(source, [amount])[0]
				: tx.add(
						coinWithBalance({
							balance: amount,
							type: walType,
						}),
					);

			const result = await fn(coin, tx);

			if (withSubsidies) {
				if (source) {
					tx.mergeCoins(source, [coin]);
				} else {
					tx.transferObjects([coin], owner);
				}
			} else {
				tx.moveCall({
					target: '0x2::coin::destroy_zero',
					typeArguments: [walType],
					arguments: [coin],
				});
			}

			return result;
		};
	}

	/**
	 * Create a transaction that creates a storage object
	 *
	 * @usage
	 * ```ts
	 * const tx = client.createStorageTransaction({ size: 1000, epochs: 3, owner: signer.toSuiAddress() });
	 * ```
	 */
	createStorageTransaction({
		transaction = new Transaction(),
		size,
		epochs,
		owner,
	}: StorageWithSizeOptions & { transaction?: Transaction }) {
		transaction.transferObjects([this.createStorage({ size, epochs, owner })], owner);

		return transaction;
	}

	/**
	 * Execute a transaction that creates a storage object
	 *
	 * @usage
	 * ```ts
	 * const { digest, storage } = await client.executeCreateStorageTransaction({ size: 1000, epochs: 3, signer });
	 * ```
	 */
	async executeCreateStorageTransaction({
		signer,
		...options
	}: StorageWithSizeOptions & { transaction?: Transaction; signer: Signer }) {
		const transaction = this.createStorageTransaction({
			...options,
			owner: options.transaction?.getData().sender ?? signer.toSuiAddress(),
		});
		const blobType = await this.getBlobType();

		const { digest, effects } = await this.#executeTransaction(
			transaction,
			signer,
			'create storage',
		);

		const createdObjectIds = effects?.changedObjects
			.filter((object) => object.idOperation === 'Created')
			.map((object) => object.id);

		const createdObjects = await this.#suiClient.core.getObjects({
			objectIds: createdObjectIds,
		});

		const suiBlobObject = createdObjects.objects.find(
			(object) => !(object instanceof Error) && object.type === blobType,
		);

		if (suiBlobObject instanceof Error || !suiBlobObject) {
			throw new WalrusClientError(
				`Storage object not found in transaction effects for transaction (${digest})`,
			);
		}

		return {
			digest,
			storage: Storage().parse(await suiBlobObject.content),
		};
	}

	/**
	 * Register a blob in a transaction
	 *
	 * @usage
	 * ```ts
	 * tx.transferObjects([client.registerBlob({ size: 1000, epochs: 3, blobId, rootHash, deletable: true })], owner);
	 * ```
	 */
	registerBlob({
		size,
		epochs,
		blobId,
		rootHash,
		deletable,
		walCoin,
		owner,
		attributes,
	}: RegisterBlobOptions) {
		return async (tx: Transaction) => {
			const { writeCost } = await this.storageCost(size, epochs);
			const walrusPackageId = await this.#getWalrusPackageId();

			return tx.add(
				this.#withWal(writeCost, owner, walCoin ?? null, false, async (writeCoin, tx) => {
					const blob = tx.add(
						registerBlob({
							package: walrusPackageId,
							arguments: [
								tx.object(this.#packageConfig.systemObjectId),
								this.createStorage({ size, epochs, walCoin, owner }),
								blobIdToInt(blobId),
								BigInt(bcs.u256().parse(rootHash)),
								size,
								1,
								deletable,
								writeCoin,
							],
						}),
					);

					if (attributes) {
						tx.add(
							this.#writeBlobAttributesForRef({
								attributes,
								existingAttributes: null,
								blob,
							}),
						);
					}

					return blob;
				}),
			);
		};
	}

	addAuthPayload({
		size,
		blobDigest,
		nonce,
	}: {
		size: number;
		blobDigest: Uint8Array | (() => Promise<Uint8Array>);
		nonce: Uint8Array;
	}) {
		return async (transaction: Transaction) => {
			const nonceDigest = await crypto.subtle.digest('SHA-256', nonce);
			const lengthBytes = bcs.u64().serialize(size).toBytes();
			const digest = typeof blobDigest === 'function' ? await blobDigest() : blobDigest;
			const authPayload = new Uint8Array(
				nonceDigest.byteLength + digest.byteLength + lengthBytes.byteLength,
			);

			authPayload.set(digest, 0);
			authPayload.set(new Uint8Array(nonceDigest), digest.byteLength);
			authPayload.set(lengthBytes, nonceDigest.byteLength + digest.byteLength);
			transaction.pure(authPayload);
		};
	}

	#loadTipConfig() {
		return this.#cache.read(['fanout-tip-config'], async () => {
			if (!this.#fanOutConfig?.sendTip || !this.#fanOutClient) {
				return null;
			}

			if ('kind' in this.#fanOutConfig.sendTip) {
				return this.#fanOutConfig.sendTip;
			}

			const tipConfig = await this.#fanOutClient.tipConfig();

			return {
				...tipConfig,
				max: this.#fanOutConfig.sendTip.max,
			};
		});
	}

	async calculateFanOutTip(options: { size: number }) {
		const systemState = await this.systemState();
		const encodedSize = encodedBlobLength(options.size, systemState.committee.n_shards);
		const tipConfig = await this.#loadTipConfig();

		if (!tipConfig) {
			return 0n;
		}

		const { max, kind } = tipConfig;

		const amount =
			'const' in kind
				? kind.const
				: BigInt(kind.linear.base) + BigInt(kind.linear.multiplier) * BigInt(encodedSize);

		if (max != null && amount > max) {
			throw new WalrusClientError(
				`Tip amount (${amount}) exceeds the maximum allowed tip (${max})`,
			);
		}

		return amount;
	}

	sendFanOutTip({
		size,
		blobDigest,
		nonce,
	}: {
		size: number;
		blobDigest: Uint8Array | (() => Promise<Uint8Array>);
		nonce: Uint8Array;
	}) {
		return async (transaction: Transaction) => {
			const tipConfig = await this.#loadTipConfig();

			if (tipConfig) {
				transaction.add(this.addAuthPayload({ size, blobDigest, nonce }));
				const amount = await this.calculateFanOutTip({ size });
				const { address } = tipConfig;
				transaction.transferObjects(
					[
						coinWithBalance({
							balance: amount,
						}),
					],
					address,
				);
			}
		};
	}

	/**
	 * Create a transaction that registers a blob
	 *
	 * @usage
	 * ```ts
	 * const tx = client.registerBlobTransaction({ size: 1000, epochs: 3, blobId, rootHash, deletable: true });
	 * ```
	 */
	registerBlobTransaction({
		transaction = new Transaction(),
		...options
	}: RegisterBlobOptions & { transaction?: Transaction }) {
		const registration = transaction.add(this.registerBlob(options));

		transaction.transferObjects([registration], options.owner);

		return transaction;
	}

	/**
	 * Execute a transaction that registers a blob
	 *
	 * @usage
	 * ```ts
	 * const { digest, blob } = await client.executeRegisterBlobTransaction({ size: 1000, epochs: 3, signer });
	 * ```
	 */
	async executeRegisterBlobTransaction({
		signer,
		...options
	}: RegisterBlobOptions & { transaction?: Transaction; signer: Signer }): Promise<{
		blob: ReturnType<typeof Blob>['$inferType'];
		digest: string;
	}> {
		const transaction = this.registerBlobTransaction({
			...options,
			owner: options.owner ?? options.transaction?.getData().sender ?? signer.toSuiAddress(),
		});
		const blobType = await this.getBlobType();
		const { digest, effects } = await this.#executeTransaction(
			transaction,
			signer,
			'register blob',
		);

		const createdObjectIds = effects?.changedObjects
			.filter((object) => object.idOperation === 'Created')
			.map((object) => object.id);

		const createdObjects = await this.#suiClient.core.getObjects({
			objectIds: createdObjectIds,
		});

		const suiBlobObject = createdObjects.objects.find(
			(object) => !(object instanceof Error) && object.type === blobType,
		);

		if (suiBlobObject instanceof Error || !suiBlobObject) {
			throw new WalrusClientError(
				`Blob object not found in transaction effects for transaction (${digest})`,
			);
		}

		return {
			digest,
			blob: Blob().parse(await suiBlobObject.content),
		};
	}

	async certificateFromConfirmations({
		confirmations,
		blobId,
		deletable,
		blobObjectId,
	}: Extract<
		CertifyBlobOptions,
		{ confirmations: unknown[] }
	>): Promise<ProtocolMessageCertificate> {
		const systemState = await this.systemState();
		const committee = await this.#getActiveCommittee();

		if (confirmations.length !== systemState.committee.members.length) {
			throw new WalrusClientError(
				'Invalid number of confirmations. Confirmations array must contain an entry for each node',
			);
		}

		const confirmationMessage = StorageConfirmation.serialize({
			intent: IntentType.BLOB_CERT_MSG,
			epoch: systemState.committee.epoch,
			messageContents: {
				blobId,
				blobType: deletable
					? {
							Deletable: {
								objectId: blobObjectId,
							},
						}
					: {
							Permanent: null,
						},
			},
		}).toBase64();

		const bindings = await this.#wasmBindings();
		const verifySignature = bindings.getVerifySignature();

		const filteredConfirmations = confirmations
			.map((confirmation, index) => {
				const isValid =
					confirmation?.serializedMessage === confirmationMessage &&
					verifySignature(
						confirmation,
						new Uint8Array(committee.nodes[index].info.public_key.bytes),
					);

				return isValid
					? {
							index,
							...confirmation,
						}
					: null;
			})
			.filter((confirmation) => confirmation !== null);

		if (!isQuorum(filteredConfirmations.length, systemState.committee.members.length)) {
			throw new NotEnoughBlobConfirmationsError(
				`Too many invalid confirmations received for blob (${filteredConfirmations.length} of ${systemState.committee.members.length})`,
			);
		}

		return bindings.combineSignatures(
			filteredConfirmations,
			filteredConfirmations.map(({ index }) => index),
		);
	}

	/**
	 * Certify a blob in a transaction
	 *
	 * @usage
	 * ```ts
	 * tx.add(client.certifyBlob({ blobId, blobObjectId, confirmations }));
	 * ```
	 */
	certifyBlob({ blobId, blobObjectId, confirmations, certificate, deletable }: CertifyBlobOptions) {
		return async (tx: Transaction) => {
			const systemState = await this.systemState();
			const combinedSignature =
				certificate ??
				(await this.certificateFromConfirmations({
					confirmations,
					blobId,
					deletable,
					blobObjectId,
				}));

			const walrusPackageId = await this.#getWalrusPackageId();

			tx.add(
				certifyBlob({
					package: walrusPackageId,
					arguments: [
						tx.object(this.#packageConfig.systemObjectId),
						tx.object(blobObjectId),
						tx.pure.vector('u8', combinedSignature.signature),
						tx.pure.vector(
							'u8',
							signersToBitmap(combinedSignature.signers, systemState.committee.members.length),
						),
						tx.pure.vector('u8', combinedSignature.serializedMessage),
					],
				}),
			);
		};
	}

	/**
	 * Create a transaction that certifies a blob
	 *
	 * @usage
	 * ```ts
	 * const tx = client.certifyBlobTransaction({ blobId, blobObjectId, confirmations });
	 * ```
	 */
	certifyBlobTransaction({
		transaction = new Transaction(),
		...options
	}: CertifyBlobOptions & {
		transaction?: Transaction;
	}) {
		transaction.add(this.certifyBlob(options));

		return transaction;
	}

	/**
	 * Execute a transaction that certifies a blob
	 *
	 * @usage
	 * ```ts
	 * const { digest } = await client.executeCertifyBlobTransaction({ blobId, blobObjectId, confirmations, signer });
	 * ```
	 */
	async executeCertifyBlobTransaction({
		signer,
		...options
	}: CertifyBlobOptions & {
		transaction?: Transaction;
		signer: Signer;
	}) {
		const transaction = this.certifyBlobTransaction(options);

		const { digest } = await this.#executeTransaction(transaction, signer, 'certify blob');

		return { digest };
	}

	/**
	 * Delete a blob in a transaction
	 *
	 * @usage
	 * ```ts
	 * const storage = await client.deleteBlob({ blobObjectId });
	 * tx.transferObjects([storage], owner);
	 * ```
	 */
	deleteBlob({ blobObjectId }: DeleteBlobOptions) {
		return async (tx: Transaction) => {
			const walrusPackageId = await this.#getWalrusPackageId();
			const storage = tx.add(
				deleteBlob({
					package: walrusPackageId,
					arguments: [tx.object(this.#packageConfig.systemObjectId), tx.object(blobObjectId)],
				}),
			);

			return storage;
		};
	}

	/**
	 * Create a transaction that deletes a blob
	 *
	 * @usage
	 * ```ts
	 * const tx = client.deleteBlobTransaction({ blobObjectId, owner });
	 * ```
	 */
	deleteBlobTransaction({
		owner,
		blobObjectId,
		transaction = new Transaction(),
	}: DeleteBlobOptions & { transaction?: Transaction; owner: string }) {
		const storage = transaction.add(this.deleteBlob({ blobObjectId }));
		transaction.transferObjects([storage], owner);

		return transaction;
	}

	/**
	 * Execute a transaction that deletes a blob
	 *
	 * @usage
	 * ```ts
	 * const { digest } = await client.executeDeleteBlobTransaction({ blobObjectId, signer });
	 * ```
	 */
	async executeDeleteBlobTransaction({
		signer,
		transaction = new Transaction(),
		blobObjectId,
	}: DeleteBlobOptions & { signer: Signer; transaction?: Transaction }) {
		const { digest } = await this.#executeTransaction(
			this.deleteBlobTransaction({
				blobObjectId,
				transaction,
				owner: transaction.getData().sender ?? signer.toSuiAddress(),
			}),
			signer,
			'delete blob',
		);

		return { digest };
	}

	/**
	 * Extend a blob in a transaction
	 *
	 * @usage
	 * ```ts
	 * const tx = client.extendBlobTransaction({ blobObjectId, epochs });
	 * ```
	 */
	extendBlob({ blobObjectId, epochs, endEpoch, walCoin, owner }: ExtendBlobOptions) {
		return async (tx: Transaction) => {
			const blob = await this.#objectLoader.load(blobObjectId, Blob());
			const numEpochs = typeof epochs === 'number' ? epochs : endEpoch - blob.storage.end_epoch;

			if (numEpochs <= 0) {
				return;
			}

			const { storageCost } = await this.storageCost(Number(blob.storage.storage_size), numEpochs);
			const walrusPackageId = await this.#getWalrusPackageId();
			const subsidiesPackageId = this.#packageConfig.subsidiesObjectId
				? await this.#getSubsidiesPackageId()
				: null;

			return tx.add(
				this.#withWal(
					storageCost,
					owner,
					walCoin ?? null,
					subsidiesPackageId !== null,
					async (coin, tx) => {
						tx.add(
							subsidiesPackageId
								? subsidies.extendBlob({
										package: subsidiesPackageId,
										arguments: [
											this.#packageConfig.subsidiesObjectId!,
											this.#packageConfig.systemObjectId,
											blobObjectId,
											numEpochs,
											coin,
										],
									})
								: extendBlob({
										package: walrusPackageId,
										arguments: [this.#packageConfig.systemObjectId, blobObjectId, numEpochs, coin],
									}),
						);
					},
				),
			);
		};
	}

	/**
	 * Create a transaction that extends a blob
	 *
	 * @usage
	 * ```ts
	 * const tx = client.extendBlobTransaction({ blobObjectId, epochs });
	 * ```
	 */
	async extendBlobTransaction({
		transaction = new Transaction(),
		...options
	}: ExtendBlobOptions & { transaction?: Transaction }) {
		transaction.add(this.extendBlob(options));

		return transaction;
	}

	/**
	 * Execute a transaction that extends a blob
	 *
	 * @usage
	 * ```ts
	 * const { digest } = await client.executeExtendBlobTransaction({ blobObjectId, signer });
	 * ```
	 */
	async executeExtendBlobTransaction({
		signer,
		...options
	}: ExtendBlobOptions & { signer: Signer; transaction?: Transaction }) {
		const { digest } = await this.#executeTransaction(
			await this.extendBlobTransaction(options),
			signer,
			'extend blob',
		);

		return { digest };
	}

	async readBlobAttributes({
		blobObjectId,
	}: {
		blobObjectId: string;
	}): Promise<Record<string, string> | null> {
		const response = await this.#suiClient.core.getDynamicField({
			parentId: blobObjectId,
			name: {
				type: 'vector<u8>',
				bcs: bcs.string().serialize('metadata').toBytes(),
			},
		});

		const parsedMetadata = metadata.Metadata().parse(response.dynamicField.value.bcs);

		return Object.fromEntries(
			parsedMetadata.metadata.contents.map(({ key, value }) => [key, value]),
		);
	}

	#writeBlobAttributesForRef({
		attributes,
		existingAttributes,
		blob,
	}: {
		attributes: Record<string, string | null>;
		existingAttributes: Record<string, string> | null;
		blob: TransactionObjectArgument;
	}) {
		return async (tx: Transaction) => {
			const walrusPackageId = await this.#getWalrusPackageId();

			if (!existingAttributes) {
				tx.add(
					addMetadata({
						package: walrusPackageId,
						arguments: [
							blob,
							metadata._new({
								package: walrusPackageId,
								arguments: [],
							}),
						],
					}),
				);
			}

			Object.keys(attributes).forEach((key) => {
				const value = attributes[key];

				if (value === null) {
					if (existingAttributes && key in existingAttributes) {
						tx.add(
							removeMetadataPair({
								package: walrusPackageId,
								arguments: [blob, key],
							}),
						);
					}
				} else {
					tx.add(
						insertOrUpdateMetadataPair({
							package: walrusPackageId,
							arguments: [blob, key, value],
						}),
					);
				}
			});
		};
	}

	/**
	 * Write attributes to a blob
	 *
	 * If attributes already exists, their previous values will be overwritten
	 * If an attribute is set to `null`, it will be removed from the blob
	 *
	 * @usage
	 * ```ts
	 * tx.add(client.writeBlobAttributes({ blobObjectId, attributes: { key: 'value', keyToRemove: null } }));
	 * ```
	 */
	writeBlobAttributes({ blobObject, blobObjectId, attributes }: WriteBlobAttributesOptions) {
		return async (tx: Transaction) => {
			const existingAttributes = blobObjectId
				? await this.readBlobAttributes({ blobObjectId })
				: null;
			const blob = blobObject ?? tx.object(blobObjectId);

			tx.add(
				this.#writeBlobAttributesForRef({
					attributes,
					existingAttributes,
					blob,
				}),
			);
		};
	}

	/**
	 * Create a transaction that writes attributes to a blob
	 *
	 * If attributes already exists, their previous values will be overwritten
	 * If an attribute is set to `null`, it will be removed from the blob
	 *
	 * @usage
	 * ```ts
	 * const tx = client.writeBlobAttributesTransaction({ blobObjectId, attributes: { key: 'value', keyToRemove: null } });
	 * ```
	 */
	async writeBlobAttributesTransaction({
		transaction = new Transaction(),
		...options
	}: WriteBlobAttributesOptions & { transaction?: Transaction }) {
		transaction.add(await this.writeBlobAttributes(options));
		return transaction;
	}

	/**
	 * Execute a transaction that writes attributes to a blob
	 *
	 * If attributes already exists, their previous values will be overwritten
	 * If an attribute is set to `null`, it will be removed from the blob
	 *
	 * @usage
	 * ```ts
	 * const { digest } = await client.executeWriteBlobAttributesTransaction({ blobObjectId, signer });
	 * ```
	 */
	async executeWriteBlobAttributesTransaction({
		signer,
		...options
	}: WriteBlobAttributesOptions & { signer: Signer; transaction?: Transaction }) {
		const { digest } = await this.#executeTransaction(
			await this.writeBlobAttributesTransaction(options),
			signer,
			'write blob attributes',
		);
		return { digest };
	}

	/**
	 * Write a sliver to a storage node
	 *
	 * @usage
	 * ```ts
	 * const res = await client.writeSliver({ blobId, sliverPairIndex, sliverType, sliver });
	 * ```
	 */
	async writeSliver({ blobId, sliverPairIndex, sliverType, sliver, signal }: WriteSliverOptions) {
		const systemState = await this.systemState();
		const committee = await this.#getActiveCommittee();

		const shardIndex = toShardIndex(sliverPairIndex, blobId, systemState.committee.n_shards);
		const node = await this.#getNodeByShardIndex(committee, shardIndex);

		return await this.#storageNodeClient.storeSliver(
			{ blobId, sliverPairIndex, sliverType, sliver },
			{ nodeUrl: node.networkUrl, signal },
		);
	}

	/**
	 * Write metadata to a storage node
	 *
	 * @usage
	 * ```ts
	 * const res = await client.writeMetadataToNode({ nodeIndex, blobId, metadata });
	 * ```
	 */
	async writeMetadataToNode({ nodeIndex, blobId, metadata, signal }: WriteMetadataOptions) {
		const committee = await this.#getActiveCommittee();
		const node = committee.nodes[nodeIndex];

		return await this.#storageNodeClient.storeBlobMetadata(
			{ blobId, metadata },
			{ nodeUrl: node.networkUrl, signal },
		);
	}

	/**
	 * Get a storage confirmation from a storage node
	 *
	 * @usage
	 * ```ts
	 * const confirmation = await client.getStorageConfirmationFromNode({ nodeIndex, blobId, deletable, objectId });
	 * ```
	 */
	async getStorageConfirmationFromNode({
		nodeIndex,
		blobId,
		deletable,
		objectId,
		signal,
	}: GetStorageConfirmationOptions) {
		const committee = await this.#getActiveCommittee();
		const node = committee.nodes[nodeIndex];

		const result = deletable
			? await this.#storageNodeClient.getDeletableBlobConfirmation(
					{ blobId, objectId },
					{ nodeUrl: node.networkUrl, signal },
				)
			: await this.#storageNodeClient.getPermanentBlobConfirmation(
					{ blobId },
					{ nodeUrl: node.networkUrl, signal },
				);

		return result?.success?.data?.signed ?? null;
	}

	/**
	 * Encode a blob into slivers for each node
	 *
	 * @usage
	 * ```ts
	 * const { blobId, metadata, sliversByNode, rootHash } = await client.encodeBlob(blob);
	 * ```
	 */
	async encodeBlob(blob: Uint8Array) {
		const systemState = await this.systemState();
		const committee = await this.#getActiveCommittee();

		const numShards = systemState.committee.n_shards;
		const bindings = await this.#wasmBindings();
		const { blobId, metadata, sliverPairs, rootHash } = bindings.encodeBlob(numShards, blob);

		const sliversByNodeMap = new Map<number, SliversForNode>();

		while (sliverPairs.length > 0) {
			// remove from list so we don't preserve references to the original data
			const { primary, secondary } = sliverPairs.pop()!;
			const sliverPairIndex = primary.index;

			const shardIndex = toShardIndex(sliverPairIndex, blobId, numShards);
			const node = await this.#getNodeByShardIndex(committee, shardIndex);

			if (!sliversByNodeMap.has(node.nodeIndex)) {
				sliversByNodeMap.set(node.nodeIndex, { primary: [], secondary: [] });
			}

			sliversByNodeMap.get(node.nodeIndex)!.primary.push({
				sliverIndex: primary.index,
				sliverPairIndex,
				shardIndex,
				sliver: SliverData.serialize(primary).toBytes(),
			});

			sliversByNodeMap.get(node.nodeIndex)!.secondary.push({
				sliverIndex: secondary.index,
				sliverPairIndex,
				shardIndex,
				sliver: SliverData.serialize(secondary).toBytes(),
			});
		}

		const sliversByNode = new Array<SliversForNode>();

		for (let i = 0; i < systemState.committee.members.length; i++) {
			sliversByNode.push(sliversByNodeMap.get(i) ?? { primary: [], secondary: [] });
		}

		return { blobId, metadata, rootHash, sliversByNode };
	}

	/**
	 * Write slivers to a storage node
	 *
	 * @usage
	 * ```ts
	 * await client.writeSliversToNode({ blobId, slivers, signal });
	 * ```
	 */
	async writeSliversToNode({ blobId, slivers, signal }: WriteSliversToNodeOptions) {
		const controller = new AbortController();
		const combinedSignal = signal
			? AbortSignal.any([controller.signal, signal])
			: controller.signal;

		const primarySliverWrites = slivers.primary.map(({ sliverPairIndex, sliver }) => {
			return this.writeSliver({
				blobId,
				sliverPairIndex,
				sliverType: 'primary',
				sliver,
				signal: combinedSignal,
			});
		});

		const secondarySliverWrites = slivers.secondary.map(({ sliverPairIndex, sliver }) => {
			return this.writeSliver({
				blobId,
				sliverPairIndex,
				sliverType: 'secondary',
				sliver,
				signal: combinedSignal,
			});
		});

		await Promise.all([...primarySliverWrites, ...secondarySliverWrites]).catch((error) => {
			controller.abort(error);
			throw error;
		});
	}

	/**
	 * Write a blob to all storage nodes
	 *
	 * @usage
	 * ```ts
	 * await client.writeEncodedBlobToNodes({ blob, deletable, epochs, signer });
	 * ```
	 */
	async writeEncodedBlobToNodes({
		blobId,
		metadata,
		sliversByNode,
		signal,
		...options
	}: WriteEncodedBlobToNodesOptions) {
		const systemState = await this.systemState();
		const committee = await this.#getActiveCommittee();

		const controller = new AbortController();
		let failures = 0;

		const confirmations = await Promise.all(
			sliversByNode.map((slivers, nodeIndex) => {
				return this.writeEncodedBlobToNode({
					blobId,
					nodeIndex,
					metadata,
					slivers,
					signal: signal ? AbortSignal.any([controller.signal, signal]) : controller.signal,
					...options,
				}).catch(() => {
					failures += committee.nodes[nodeIndex].shardIndices.length;

					if (isAboveValidity(failures, systemState.committee.n_shards)) {
						controller.abort();

						throw new NotEnoughBlobConfirmationsError(
							`Too many failures while writing blob ${blobId} to nodes`,
						);
					}

					return null;
				});
			}),
		);

		return confirmations;
	}

	/**
	 * Writes a blob to to a fan out proxy
	 *
	 * @usage
	 * ```ts
	 * await client.writeBlobToFanOutProxy({ blob, deletable, epochs, signer });
	 * ```
	 */
	async writeBlobToFanOutProxy(options: WriteBlobToFanOutProxyOptions): Promise<{
		blobId: string;
		certificate: ProtocolMessageCertificate;
	}> {
		if (!this.#fanOutClient) {
			throw new WalrusClientError('Fan out proxy not configured');
		}

		return this.#fanOutClient.writeBlob({
			...options,
			requiresTip: !!this.#fanOutConfig?.sendTip,
		});
	}

	/**
	 * Write encoded blob to a storage node
	 *
	 * @usage
	 * ```ts
	 * const res = await client.writeEncodedBlobToNode({ nodeIndex, blobId, metadata, slivers });
	 * ```
	 */
	async writeEncodedBlobToNode({
		nodeIndex,
		blobId,
		metadata,
		slivers,
		signal,
		...options
	}: WriteEncodedBlobOptions) {
		await this.writeMetadataToNode({
			nodeIndex,
			blobId,
			metadata,
			signal,
		});

		await this.writeSliversToNode({ blobId, slivers, signal, nodeIndex });

		return this.getStorageConfirmationFromNode({
			nodeIndex,
			blobId,
			...options,
		});
	}

	/**
	 * Write a blob to all storage nodes
	 *
	 * @usage
	 * ```ts
	 * const { blobId, blobObject } = await client.writeBlob({ blob, deletable, epochs, signer });
	 * ```
	 */
	async writeBlob({
		blob,
		deletable,
		epochs,
		signer,
		signal,
		owner,
		attributes,
	}: WriteBlobOptions) {
		if (!this.#fanOutConfig) {
			const encoded = await this.encodeBlob(blob);
			const blobId = encoded.blobId;
			const { sliversByNode, metadata, rootHash } = encoded;

			const suiBlobObject = await this.executeRegisterBlobTransaction({
				signer,
				size: blob.length,
				epochs,
				blobId,
				rootHash,
				deletable,
				owner: owner ?? signer.toSuiAddress(),
				attributes,
			});

			const blobObjectId = suiBlobObject.blob.id.id;

			const confirmations = await this.writeEncodedBlobToNodes({
				blobId,
				metadata,
				sliversByNode,
				deletable,
				objectId: blobObjectId,
				signal,
			});

			await this.executeCertifyBlobTransaction({
				signer,
				blobId,
				blobObjectId,
				confirmations,
				deletable,
			});

			return {
				blobId,
				blobObject: await this.#objectLoader.load(blobObjectId, Blob()),
			};
		} else {
			const metadata = await this.computeBlobMetadata({
				bytes: blob,
			});
			const blobId = metadata.blobId;

			const transaction = new Transaction();

			transaction.add(
				this.sendFanOutTip({
					size: blob.length,
					blobDigest: metadata.blobDigest,
					nonce: metadata.nonce,
				}),
			);

			const registerResult = await this.executeRegisterBlobTransaction({
				signer,
				transaction,
				size: blob.length,
				epochs,
				blobId: metadata.blobId,
				rootHash: metadata.rootHash,
				deletable,
				owner: owner ?? signer.toSuiAddress(),
				attributes,
			});

			await this.#suiClient.core.waitForTransaction({
				digest: registerResult.digest,
			});

			const result = await this.writeBlobToFanOutProxy({
				blobId,
				blob,
				nonce: metadata.nonce,
				txDigest: registerResult.digest,
				signal,
				deletable,
				blobObjectId: registerResult.blob.id.id,
				encodingType: metadata.metadata.encodingType as EncodingType,
			});

			const certificate = result.certificate;
			const blobObjectId = registerResult.blob.id.id;

			await this.executeCertifyBlobTransaction({
				signer,
				blobId,
				blobObjectId,
				certificate,
				deletable,
			});

			return {
				blobId,
				blobObject: await this.#objectLoader.load(blobObjectId, Blob()),
			};
		}
	}

	async #executeTransaction(transaction: Transaction, signer: Signer, action: string) {
		transaction.setSenderIfNotSet(signer.toSuiAddress());

		const { digest, effects } = await signer.signAndExecuteTransaction({
			transaction,
			client: this.#suiClient,
		});

		if (effects?.status.error) {
			throw new WalrusClientError(`Failed to ${action} (${digest}): ${effects?.status.error}`);
		}

		await this.#suiClient.core.waitForTransaction({
			digest,
		});

		return { digest, effects };
	}

	async #getCommittee(committee: InferBcsType<ReturnType<typeof Committee>>) {
		const stakingPool = await this.#stakingPool(committee);
		const shardIndicesByNodeId = getShardIndicesByNodeId(committee);

		const byShardIndex = new Map<number, StorageNode>();
		const nodes = stakingPool.map(({ node_info }, nodeIndex) => {
			const shardIndices = shardIndicesByNodeId.get(node_info.node_id) ?? [];
			const node: StorageNode = {
				id: node_info.node_id,
				info: node_info,
				networkUrl: `https://${node_info.network_address}`,
				shardIndices,
				nodeIndex,
			};

			for (const shardIndex of shardIndices) {
				byShardIndex.set(shardIndex, node);
			}

			return node;
		});

		return {
			byShardIndex,
			nodes,
		};
	}

	#getActiveCommittee() {
		return this.#cache.read(['getActiveCommittee'], async () => {
			const stakingState = await this.stakingState();
			return this.#getCommittee(stakingState.committee);
		});
	}

	async #stakingPool(committee: InferBcsType<ReturnType<typeof Committee>>) {
		const nodeIds = committee[0].contents.map((node) => node.key);
		return this.#objectLoader.loadManyOrThrow(nodeIds, StakingPool());
	}

	async #getNodeByShardIndex(committeeInfo: CommitteeInfo, index: number) {
		const node = committeeInfo.byShardIndex.get(index);
		if (!node) {
			throw new WalrusClientError(`Node for shard index ${index} not found`);
		}
		return node;
	}

	/**
	 * Reset cached data in the client
	 *
	 * @usage
	 * ```ts
	 * client.reset();
	 * ```
	 */
	reset() {
		this.#objectLoader.clearAll();
		this.#cache.clear();
	}

	#retryOnPossibleEpochChange<T extends (...args: any[]) => Promise<any>>(fn: T): T {
		return (async (...args: Parameters<T>) => {
			try {
				return await fn.apply(this, args);
			} catch (error) {
				if (error instanceof RetryableWalrusClientError) {
					this.reset();
					return await fn.apply(this, args);
				}
				throw error;
			}
		}) as T;
	}
}