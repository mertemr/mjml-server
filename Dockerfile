ARG NODE_VERSION=24
ARG BUN_VERSION=1

FROM oven/bun:${BUN_VERSION}-alpine AS builder

WORKDIR /usr/src/app

COPY bun.lock package.json ./

RUN bun install --frozen-lockfile --production


FROM node:${NODE_VERSION}-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    MJML_PORT=15500

RUN apk add --no-cache \
    # For proper signal handling
    dumb-init && \
    rm -rf /var/cache/apk/*

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

COPY --from=builder --chown=nodejs:nodejs /usr/src/app/node_modules ./node_modules
COPY --chown=nodejs:nodejs package.json ./
COPY --chown=nodejs:nodejs index.js ./
COPY --chown=nodejs:nodejs lib ./lib

USER nodejs

EXPOSE ${MJML_PORT}

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=5 \
  CMD node -e "require('http').get('http://127.0.0.1:${MJML_PORT}/v1/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"
