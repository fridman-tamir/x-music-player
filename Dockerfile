FROM node:22-bookworm

RUN apt-get update \
    && apt-get install -y ffmpeg python3 python3-pip \
    && pip3 install --break-system-packages yt-dlp \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm -C client build
RUN pnpm -C server build

WORKDIR /app/server

CMD ["pnpm", "start"]