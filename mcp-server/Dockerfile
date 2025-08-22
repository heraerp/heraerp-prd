# HERA MCP Server Docker Image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy server files
COPY . .

# Make start script executable
RUN chmod +x start.sh

# Create health check endpoint
RUN echo '{"status":"healthy","service":"hera-mcp-server"}' > health.json

# Expose port for health checks and API
EXPOSE 3000

# Start the MCP server
CMD ["./start.sh"]