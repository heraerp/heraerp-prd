# HERA ERP Production Dockerfile
# Node 20.12.2 LTS with proper dev dependencies for build
# Updated: 2025-11-05 to fix build failures

# ---- Build Stage ----
FROM node:20.12.2-bullseye AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for TypeScript build)
# Use --legacy-peer-deps to handle puppeteer version conflict
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Skip browser downloads (critical for build performance)
ENV PUPPETEER_SKIP_DOWNLOAD=1
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_BROWSERS_PATH=0

# Build Next.js application
RUN npm run build

# Prune to production dependencies only (after build)
RUN npm prune --omit=dev --legacy-peer-deps

# ---- Runtime Stage ----
FROM node:20.12.2-bullseye AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy package files and production node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copy built Next.js application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Copy any other necessary files
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tailwind.config.ts ./tailwind.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
