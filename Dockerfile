# Use a lighter base image
FROM node:22-alpine

# Set working directory
WORKDIR /usr/src/app

# Install curl for healthcheck
RUN apk --no-cache add curl

# Set NODE_ENV to production (reduces npm install size)
ENV NODE_ENV=production

# Copy package files for better layer caching
COPY package*.json ./

# Copy .env file
COPY .env ./

# Install dependencies with ci for more reliable builds
RUN npm ci --only=production

# Create a non-root user and set permissions
RUN addgroup -g 1001 appuser && \
    adduser -S -u 1001 -G appuser appuser && \
    chown -R appuser:appuser /usr/src/app

# Copy application code
COPY --chown=appuser:appuser . .

# Switch to non-root user for security
USER appuser

# Note: Port matches what's in docker-compose.yml (host mode)
EXPOSE 3080

# Updated healthcheck with longer intervals
HEALTHCHECK --interval=60s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3080/api/v1/healthcheck || exit 1

# Start the application with --env-file
CMD ["node", "--env-file=.env", "index.js"]
