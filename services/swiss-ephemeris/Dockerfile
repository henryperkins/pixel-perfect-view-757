# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim@sha256:c3de60bf2f9dd0ac6370e6117950ff62d6e339527e7472301c9c78a017978392
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY ephemeris.lock.json ./
COPY scripts ./scripts
RUN node scripts/download-ephemeris.mjs
COPY . .
RUN npm test
ARG RELEASE_GIT_SHA
ENV RELEASE_GIT_SHA=$RELEASE_GIT_SHA
RUN node scripts/source-archive.mjs
ENV NODE_ENV=production PORT=8080 SE_EPHE_PATH=/app/data/ephe
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD node -e "fetch('http://127.0.0.1:8080/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "src/server.mjs"]
