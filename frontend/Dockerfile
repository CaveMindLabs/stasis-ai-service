# Stage 1: Build the application
# Use a specific version tag for reproducible builds. 'alpine' is a lightweight Linux.
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package management files
COPY package.json pnpm-lock.yaml ./

# Install pnpm and then install dependencies
# This layer is cached and only re-runs if dependencies change
RUN npm install -g pnpm
RUN pnpm install

# Copy the rest of the application source code
COPY . .

# Copy the download script and make it executable
COPY ./scripts/download_models.sh /usr/local/bin/download_models.sh
RUN chmod +x /usr/local/bin/download_models.sh

# Run the script to download the models into the public directory at build time
RUN download_models.sh ./public/models

# Build the Next.js application for production
RUN pnpm run build

# Stage 2: Production image
# Start from the same clean base image
FROM node:20-alpine

WORKDIR /app

# Install pnpm in the production stage as well, so we can run the start command
RUN npm install -g pnpm

# Copy the built application from the builder stage
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# This is the key optimization. Because NODE_ENV=production is set by default
# in the node:alpine image, this command installs ONLY production dependencies.
RUN pnpm install

# Expose the port the app runs on
EXPOSE 3000

# The command to run the production server
CMD ["pnpm", "start"]
