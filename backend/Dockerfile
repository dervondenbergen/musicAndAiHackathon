# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=22.13.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

# Node.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"

# Install pnpm
ARG PNPM_VERSION=10.12.1
RUN npm install -g pnpm@$PNPM_VERSION


# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Install node modules
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy application code
COPY . .


# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app /app

# Install curl and unzip for downloading sounds
RUN apt-get update && apt-get install -y curl unzip && rm -rf /var/lib/apt/lists/*

# Copy download script
COPY download-sounds.sh /app/download-sounds.sh
RUN chmod +x /app/download-sounds.sh

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD ["/bin/sh", "-c", "./download-sounds.sh && pnpm run start"]
