# Build from the repository root:  docker build -f services/member-service/Dockerfile .
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
RUN npm ci --omit=dev --workspace member-service

COPY packages/common packages/common
COPY services/member-service services/member-service

USER node
WORKDIR /app/services/member-service
EXPOSE 3001
CMD ["node", "src/server.js"]
