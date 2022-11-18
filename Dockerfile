FROM node:16-alpine

WORKDIR /app
ADD . /app

RUN yarn install

EXPOSE 8080 8081

CMD [ "node", "/app/index.js" ]