FROM node:22-alpine AS frontend

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build

FROM nginx:stable-alpine

COPY --from=frontend /app/dist/ /usr/share/nginx/html/
COPY container/nginx/nginx.conf /etc/nginx/nginx.conf

RUN rm -f /etc/nginx/conf.d/default.conf

COPY container/nginx/conf.d/app.conf /etc/nginx/conf.d/app.conf