FROM node:22 AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .

ARG API_INVENTORY=http://localhost:5001
ARG API_SALES=http://localhost:5002
ARG API_AUTH=http://localhost:5003

RUN sed -i "s|http://localhost:5001|${API_INVENTORY}|g" src/environments/environment.ts \
 && sed -i "s|http://localhost:5002|${API_SALES}|g" src/environments/environment.ts \
 && sed -i "s|http://localhost:5003|${API_AUTH}|g" src/environments/environment.ts

RUN npm run build

FROM nginx:1.27
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
COPY --from=build /app/dist/frontend/browser/assets /usr/share/nginx/html/assets
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
