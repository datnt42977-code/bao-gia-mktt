FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice \
    libreoffice-writer \
    fonts-dejavu \
    fonts-liberation \
    fonts-noto \
    fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY templates ./templates

ENV PORT=3000
ENV SOFFICE_BIN=soffice
EXPOSE 3000

CMD ["node", "src/server.js"]
