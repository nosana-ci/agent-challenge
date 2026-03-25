# syntax=docker/dockerfile:1

FROM node:23-slim AS base

# Install system dependencies needed for native modules (e.g. better-sqlite3)
RUN apt-get update && apt-get install -y \
  python3 \
  python3-pip \
  make \
  g++ \
  git \
  && rm -rf /var/lib/apt/lists/*

# Disable telemetry
ENV ELIZAOS_TELEMETRY_DISABLED=true
ENV DO_NOT_TRACK=1

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package manifests and Python requirements first for better layer caching
COPY package.json bun.lock tsconfig.json requirements.txt ./
RUN pnpm install
RUN pip3 install -r requirements.txt

# Copy all source files
COPY . .

# Create data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 3000

ENV NODE_ENV=production
ENV SERVER_PORT=3000

CMD ["pnpm", "start"]
