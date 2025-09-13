FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm rebuild

EXPOSE 8080
CMD ["node", "index.js"]
