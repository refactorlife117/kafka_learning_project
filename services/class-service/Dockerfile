# Build from the repository root:  docker build -f services/class-service/Dockerfile .
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
RUN npm ci --omit=dev --workspace class-service

COPY packages/common packages/common
COPY services/class-service services/class-service

USER node
WORKDIR /app/services/class-service
EXPOSE 3002
CMD ["node", "src/server.js"]
