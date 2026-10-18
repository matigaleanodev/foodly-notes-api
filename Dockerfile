FROM node:26-alpine3.23 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY nest-cli.json tsconfig*.json ./
COPY src ./src
RUN npm run build

FROM node:26-alpine3.23 AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

FROM node:26-alpine3.23 AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package*.json ./
COPY --chown=node:node scripts/ensure-cache-indexes.js ./scripts/ensure-cache-indexes.js
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT || 3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["sh", "-c", "node scripts/ensure-cache-indexes.js --apply && exec node dist/main.js"]
