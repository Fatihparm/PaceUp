FROM node:18

WORKDIR /app

COPY package.json .

RUN npm install --verbose && ls -la /app && ls -la /app/node_modules

COPY . .

CMD ["node", "server.js"]
