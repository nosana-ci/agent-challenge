# syntax=docker/dockerfile:1

FROM node:23-slim AS base

ENV PYTHONUNBUFFERED=1 \
    ELIZAOS_TELEMETRY_DISABLED=true \
    DO_NOT_TRACK=1 \
    NODE_ENV=production \
    SERVER_PORT=3000 \
    VIRTUAL_ENV=/opt/venv \
    PATH="/opt/venv/bin:$PATH"

# Install system dependencies needed for native modules (e.g. better-sqlite3)
RUN apt-get update && apt-get install -y \
  python3 \
  python3-pip \
  python3-venv \
  make \
  g++ \
  git \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package manifests and Python requirements first for better layer caching
COPY package.json bun.lock tsconfig.json requirements.txt ./
RUN pnpm install
RUN python3 -m venv "$VIRTUAL_ENV" && pip install -r requirements.txt

# Copy all source files
COPY . .

# Create data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["pnpm", "start"]
