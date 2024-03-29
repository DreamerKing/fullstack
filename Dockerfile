FROM node:latest
WORKDIR /usr/src/app
COPY package.json ./
COPY yarn.lock ./
RUN yarn
RUN yarn build
COPY . .
COPY .env.production .env 
ENV NODE_ENV production

EXPOSE 8080

CMD ["node", "dist/index.js"]

USER node
