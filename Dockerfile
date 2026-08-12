FROM node:22-bookworm

RUN apt-get update \
    && apt-get install -y ffmpeg python3 python3-pip \
    && pip3 install --break-system-packages yt-dlp \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable

WORKDIR /app/server

COPY server/package.json ./
COPY server/pnpm-lock.yaml* ./

RUN pnpm config set minimumReleaseAge 0
RUN pnpm install --frozen-lockfile

COPY server/ ./

RUN pnpm build

CMD ["pnpm", "start"]