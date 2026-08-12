FROM node:22-bookworm

RUN apt-get update \
    && apt-get install -y ffmpeg python3 python3-pip \
    && pip3 install --break-system-packages yt-dlp \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable

WORKDIR /app

COPY pnpm-workspace.yaml ./
COPY server/package.json ./server/package.json

RUN corepack enable
RUN pnpm install --filter ./server...

COPY server/ ./server/

RUN pnpm --filter ./server build

WORKDIR /app/server
CMD ["pnpm", "start"]