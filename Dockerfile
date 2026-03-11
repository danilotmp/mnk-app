# mnk-app - Expo web (puerto interno 9081)
FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# No interactivo y escuchar en todas las interfaces
ENV CI=1
ENV HOST=0.0.0.0
ENV WEB_PORT=9081
EXPOSE 9081

CMD ["npx", "expo", "start", "--web", "--port", "9081"]
