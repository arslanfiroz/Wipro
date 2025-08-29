FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend ./
RUN npm run build

FROM nginx:alpine
RUN rm -f /etc/nginx/conf.d/default.conf && rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/templates/default.conf.template
ENV API_INVENTORY=http://inventory:5001
ENV API_SALES=http://sales:5002
ENV API_AUTH=http://auth:5003
EXPOSE 80
CMD ["nginx","-g","daemon off;"]

