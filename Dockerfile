# Stage 1: Build the extension
FROM node:20-alpine AS builder
WORKDIR /build
COPY directus-extensions/cantine-dashboard/package*.json ./
RUN npm ci
COPY directus-extensions/cantine-dashboard/src ./src
RUN npm run build

# Stage 2: Directus image with bundled extension
FROM directus/directus:latest
COPY --from=builder /build/dist /directus/extensions/cantine-dashboard/dist
COPY directus-extensions/cantine-dashboard/package.json /directus/extensions/cantine-dashboard/package.json
