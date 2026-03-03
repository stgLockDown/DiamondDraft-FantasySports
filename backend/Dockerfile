FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src/

RUN npx tsc

# ─── Production Stage ────────────────────────────────────────
FROM node:20-slim

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma/
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/server.js"]