###############################################################################
# 1️⃣  Build stage – uses Yarn to install deps & run the Vite build
###############################################################################
FROM node:20-alpine AS build
WORKDIR /app

# Yarn is available via Corepack in Node ≥16.10
RUN corepack enable

# Copy dependency manifests
COPY package.json yarn.lock ./

# Install dependencies deterministically
RUN yarn install --frozen-lockfile --non-interactive

# Copy source and build the static assets
COPY . .
RUN yarn build

###############################################################################
# 2️⃣  Serve stage – a tiny container that only hosts the static files
###############################################################################
FROM node:20-alpine AS serve
WORKDIR /app
RUN corepack enable \
  && yarn global add serve@14.1.2

# Bring the compiled assets from the previous stage
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
