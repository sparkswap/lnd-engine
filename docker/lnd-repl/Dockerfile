FROM node:8

LABEL maintainer="Danny Paz <kinesis.exchange>"

RUN mkdir /home/app

WORKDIR /home/app

COPY package.json ./package.json
COPY src ./src
COPY scripts/console.js ./scripts/console.js

RUN mkdir './tmp' './proto'
RUN curl https://raw.githubusercontent.com/lightningnetwork/lnd/master/lnrpc/rpc.proto -o ./proto/lnd-rpc.proto
RUN sed 's|^import \"google/api/annotations.proto\";||' ./proto/lnd-rpc.proto > /tmp/file.$$ && mv /tmp/file.$$ ./proto/lnd-rpc.proto
RUN rm -rf ./tmp

RUN npm i
