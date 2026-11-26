FROM node:22-bookworm-slim AS build
WORKDIR /workspace
COPY package.json package-lock.json ./
RUN --mount=type=cache,id=portal-web-npm,target=/root/.npm,sharing=locked \
    npm ci --no-audit --no-fund
COPY index.html tsconfig*.json vite.config.ts ./
COPY src/ src/
COPY public/ public/
ENV NODE_OPTIONS=--max-old-space-size=1024
ARG BASE_PATH=/
RUN BASE_PATH="${BASE_PATH}" npm run build

FROM nginx:stable-alpine AS runtime
COPY nginx.conf /etc/nginx/nginx.conf
# Keep liveness content outside the SPA root; Nginx serves it after access checks.
COPY healthz /usr/share/nginx/healthz
COPY --from=build /workspace/dist/ /usr/share/nginx/html/
USER 101:101
EXPOSE 8080
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
