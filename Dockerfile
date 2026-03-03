# ─── Stage 1: Build Frontend ──────────────────────────────────
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./

# Set empty API URL so frontend uses relative paths (same origin)
ENV VITE_API_URL=""
RUN npm run build

# ─── Stage 2: Build Backend ───────────────────────────────────
FROM node:20-slim AS backend-builder

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

COPY backend/package*.json ./
COPY backend/prisma ./prisma/

RUN npm ci
RUN npx prisma generate

COPY backend/tsconfig.json ./
COPY backend/src ./src/

RUN npx tsc

# ─── Stage 3: Production ──────────────────────────────────────
FROM node:20-slim

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/prisma ./prisma/
RUN npx prisma generate

# Copy compiled backend
COPY --from=backend-builder /app/backend/dist ./dist

# Copy built frontend into public/ (served by Fastify static)
COPY --from=frontend-builder /app/frontend/dist ./public

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/server.js"]