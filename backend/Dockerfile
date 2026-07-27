# Build Stage
FROM node:22-slim AS builder

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /usr/src/app

# Install all dependencies (including dev tools needed for build)
COPY package*.json ./
RUN npm install

# Copy all source code
COPY . .

# Generate Prisma Client & Build NestJS app
RUN npx prisma generate
RUN npx tsc prisma/seed.ts
RUN npm run build

# Production Stage
FROM node:22-slim

# Install OpenSSL for Prisma in production
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /usr/src/app

# Install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev && npm install -g prisma

# Copy built artifacts from the builder stage
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/dist ./dist

# Copy generated Prisma Client from builder
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
