FROM oven/bun:1 AS builder

WORKDIR /usr/src/app

COPY bun.lock package.json ./

RUN bun install --frozen-lockfile

FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

EXPOSE 15500

COPY --from=builder /usr/src/app/node_modules ./node_modules

COPY . .

CMD ["npm", "start"]
