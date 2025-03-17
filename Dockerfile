# Use a lighter base image
FROM node:22-alpine

# Set working directory
WORKDIR /usr/src/app

# Set NODE_ENV to production (reduces npm install size)
ENV NODE_ENV=production

# Copy package files for better layer caching
COPY package*.json ./

# Copy .env file if needed (uncomment if required)
# COPY .env ./

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

# Updated to use curl instead of wget for healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3080/api/v1/healthcheck || exit 1

# Start the application
CMD ["node", "index.js"]
