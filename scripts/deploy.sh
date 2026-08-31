#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Raya agent - deploy script for Nosana Builders Challenge
# ============================================================
# Prerequisites:
#   1. Docker Hub account (free, at hub.docker.com)
#   2. Nosana CLI installed (npm install -g @nosana/cli)
#   3. Nosana builders credits claimed (nosana.com/builders-credits)
# ============================================================

DOCKER_USER="${1:-42318010020Biyan}"
IMAGE_NAME="raya-eliza-agent"
TAG="latest"
FULL_IMAGE="${DOCKER_USER}/${IMAGE_NAME}:${TAG}"

echo "=== Step 1: Build Docker image ==="
docker build -t "${FULL_IMAGE}" -f Dockerfile .

echo "=== Step 2: Test locally (optional, Ctrl+C to skip) ==="
echo "docker run -p 3000:3000 --env-file .env ${FULL_IMAGE}"
echo "Open http://localhost:3000 to verify"

echo "=== Step 3: Push to Docker Hub ==="
echo "Make sure you're logged in: docker login"
echo "Then run: docker push ${FULL_IMAGE}"

echo "=== Step 4: Deploy to Nosana ==="
echo "nosana job deploy nos_job_def/nosana_eliza_job_definition.json"
echo "This will output a public URL for your agent."

echo "=== Step 5: Submit ==="
echo "Repo link: https://github.com/42318010020-Biyan/agent-challenge"
echo "Form: superteam.fun/earn/listing/nosana-builders-elizaos-challenge/"

echo ""
echo "Full image tag: ${FULL_IMAGE}"
echo "Make sure the image tag in nos_job_def/ matches this."