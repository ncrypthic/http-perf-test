FROM node:20

COPY . /usr/src/app/

WORKDIR /usr/src/app

ENV NODE_EXTRA_CA_CERTS=/usr/src/app/ssl/ca.pem

EXPOSE 8080
EXPOSE 8081

CMD node server/index.js
