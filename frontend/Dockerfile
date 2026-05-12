FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM alpine:3.20

COPY --from=builder /app/dist /build

CMD ["sh", "-c", "cp -r /build/* /app/dist/ && echo 'Frontend files copied' && tail -f /dev/null"]
