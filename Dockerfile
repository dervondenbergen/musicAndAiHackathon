# Multi-stage build for combined backend + AI service
FROM node:22.13.0-slim AS node-builder

# Install Node.js dependencies
WORKDIR /app/backend
COPY backend/package.json backend/pnpm-lock.yaml ./
RUN npm install -g pnpm@10.12.1
RUN pnpm install --frozen-lockfile

FROM python:3.13.2 AS python-builder

# Install Python dependencies
WORKDIR /app/ai
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
RUN python -m venv .venv
COPY ai/requirements.txt ./
RUN .venv/bin/pip install -r requirements.txt

# Final combined image
FROM python:3.13.2-slim

# Install Node.js in the Python image
RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    tar \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g pnpm@10.12.1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Python environment
COPY --from=python-builder /app/ai/.venv ai/.venv/

# Copy Node.js dependencies
COPY --from=node-builder /app/backend/node_modules backend/node_modules/

# Copy source code
COPY backend/ backend/
COPY ai/ ai/

# Copy startup scripts
COPY ai/download-model.sh ai/
COPY start-combined.sh ./
RUN chmod +x ai/download-model.sh start-combined.sh

EXPOSE 3000

CMD ["./start-combined.sh"]