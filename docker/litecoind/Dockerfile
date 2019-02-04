FROM alpine as builder

LABEL maintainer "Sparkswap <dev@sparkswap.com>"

# We set the version externally so we are not required to edit the Dockerfile in the
# case of updating for security patches
ARG VERSION
RUN : "${VERSION:?VERSION Build argument needs to be set.}"

# Install all deps needed for litecoind verification
RUN apk update
RUN apk --no-cache add bash ca-certificates gnupg wget

ENV FILENAME litecoin-${VERSION}-x86_64-linux-gnu.tar.gz
ENV CHECKSUM_FILENAME litecoin-${VERSION}-x86_64-linux-gnu.tar.gz.asc

# Verify litecoin installation files and install litecoind
RUN wget -q https://download.litecoin.org/litecoin-${VERSION}/linux/${FILENAME}
RUN wget -q https://download.litecoin.org/litecoin-${VERSION}/linux/${CHECKSUM_FILENAME}

# We iterate through multiple keyservers to prevent docker failures in the case a
# single gpg server fails
RUN for KEYSERVER_NAME in ha.pool.sks-keyservers.net \
      hkp://p80.pool.sks-keyservers.net:80 \
      keyserver.ubuntu.com \
      hkp://keyserver.ubuntu.com:80 \
      pgp.mit.edu; \
    do \
      gpg2 --keyserver $KEYSERVER_NAME --recv-keys FE3348877809386C && \
      break || echo "$KEYSERVER_NAME failed: Trying another gpg server"; \
    done

RUN gpg2 --verify ./${CHECKSUM_FILENAME}
RUN tar xfz ./litecoin-${VERSION}-x86_64-linux-gnu.tar.gz
RUN mv ./litecoin-${VERSION}/bin/* /usr/local/bin/
RUN rm -rf ./litecoin-* /root/.gnupg/

# Final alpine
FROM alpine as final

RUN apk update
RUN apk --no-cache add bash g++ gcc libgcc wget && \
    wget -q -O /etc/apk/keys/sgerrand.rsa.pub https://alpine-pkgs.sgerrand.com/sgerrand.rsa.pub && \
    wget -q https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.28-r0/glibc-2.28-r0.apk && \
    apk add glibc-2.28-r0.apk

WORKDIR /home/litecoind

COPY --from=builder /usr/local/bin/* /usr/local/bin/

# Mainnet (rpc, http)
EXPOSE 9332 9333

# Testnet (rpc, http)
EXPOSE 19332 19333

# Regtest (rpc, http)
EXPOSE 19443 19444

ADD "start-litecoind.sh" ./start-litecoind.sh
RUN chmod +x ./start-litecoind.sh

CMD ["bash", "./start-litecoind.sh"]
