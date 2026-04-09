# Stage 1: builder
FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package manifests
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDeps for build)
RUN pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Generate Prisma client (reads schema only, no DB connection needed)
RUN pnpm exec prisma generate

# Build Nuxt app
RUN pnpm run build

# Stage 2: runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy the full built output (Nuxt bundles server deps into .output)
COPY --from=builder /app/.output ./.output

# Copy Prisma schema for potential runtime use (e.g. migrations)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Copy the generated Prisma client from builder's node_modules
# Nuxt/Nitro bundles most deps, but @prisma/client native binaries need to be available
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
