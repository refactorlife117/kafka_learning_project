# Build from the repository root:  docker build -f api-gateway/Dockerfile .
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

# Copy manifests first so `npm ci` is cached until dependencies change
COPY package.json package-lock.json ./
COPY packages/common/package.json packages/common/
COPY api-gateway/package.json api-gateway/
COPY services/member-service/package.json services/member-service/
COPY services/class-service/package.json services/class-service/
COPY services/booking-service/package.json services/booking-service/
RUN npm ci --omit=dev --workspace api-gateway

COPY packages/common packages/common
COPY api-gateway api-gateway

USER node
WORKDIR /app/api-gateway
EXPOSE 3000
CMD ["node", "src/server.js"]
