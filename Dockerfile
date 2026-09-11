# syntax=docker/dockerfile:1
#
# Teka Edu — portable production image (any OCI host, local production-like testing, CI).
# Vercel uses Dockerfile.vercel instead; keep both files in sync (see docs/DEPLOYMENT.md).
#
#   docker build -t teka-edu:local .
#   docker run --rm -p 3000:3000 teka-edu:local
#
# NEXT_PUBLIC_* values are inlined into the JavaScript at build time (Next.js behaviour), so
# they are build arguments. Server secrets are runtime-only: pass them with `docker run -e`
# or `--env-file`, never as build arguments.

ARG NODE_VERSION=22.22.2
ARG ALPINE_VERSION=3.22

FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS base
ENV NEXT_TELEMETRY_DISABLED=1

# ---- deps: install exactly what package-lock.json specifies -----------------------------
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---- builder: compile the standalone Next.js server -------------------------------------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_DEFAULT_LOCALE
ARG NEXT_PUBLIC_DEFAULT_COUNTRY
ARG NEXT_PUBLIC_APP_ENV
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_ENABLE_ENGLISH_SCAFFOLDING
ARG NEXT_PUBLIC_ENABLE_CLOUD_SYNC
ARG NEXT_PUBLIC_APP_VERSION
ARG NEXT_PUBLIC_GIT_SHA
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME \
    NEXT_PUBLIC_DEFAULT_LOCALE=$NEXT_PUBLIC_DEFAULT_LOCALE \
    NEXT_PUBLIC_DEFAULT_COUNTRY=$NEXT_PUBLIC_DEFAULT_COUNTRY \
    NEXT_PUBLIC_APP_ENV=$NEXT_PUBLIC_APP_ENV \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY \
    NEXT_PUBLIC_ENABLE_ENGLISH_SCAFFOLDING=$NEXT_PUBLIC_ENABLE_ENGLISH_SCAFFOLDING \
    NEXT_PUBLIC_ENABLE_CLOUD_SYNC=$NEXT_PUBLIC_ENABLE_CLOUD_SYNC \
    NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION \
    NEXT_PUBLIC_GIT_SHA=$NEXT_PUBLIC_GIT_SHA

RUN npm run build

# ---- runner: minimal runtime, non-root --------------------------------------------------
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# The official node image ships an unprivileged `node` user (uid 1000).
USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]

# Next.js' standalone server exits cleanly on SIGTERM (docker stop, platform scale-down).
CMD ["node", "server.js"]
