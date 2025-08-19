# Stage 1: Base with pnpm installed
FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"

RUN apk add --no-cache curl git \
    && corepack enable \
    && corepack prepare pnpm@latest --activate

# Stage 2: Dependencies install and build
FROM base AS builder

WORKDIR /

# Copy environment and dependency files
COPY .env package.json pnpm-lock.yaml next.config.ts ./

# Install dependencies with pnpm
RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm install --frozen-lockfile

# Copy rest of the source code
COPY . .

# Build the app
RUN pnpm build

# Stage 3: Final production image
FROM base AS runner

WORKDIR /

# Copy built app and necessary files
COPY --from=builder / ./

EXPOSE 3000
ENV NODE_ENV=production

CMD ["pnpm", "start"]
