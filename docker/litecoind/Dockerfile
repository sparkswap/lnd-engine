FROM ubuntu:18.04 as builder

LABEL maintainer "sparkswap <dev@sparkswap.com>"

# We set the version externally so we are not required to edit the Dockerfile in the
# case of updating for security patches
ARG VERSION
RUN : "${VERSION:?VERSION Build argument needs to be set.}"

# Install all deps needed for litecoind verification
RUN apt-get update && \
  # We want to install recommended packages for software-props
  apt-get install -y software-properties-common && \
  # We do not want to install recommended packages for the rest of these utils
  apt-get install -y --no-install-recommends \
  ca-certificates \
  wget \
  gnupg2 \
  gpg-agent \
  dirmngr \
  at \
  iproute2

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
RUN tar xfz /litecoin-${VERSION}-x86_64-linux-gnu.tar.gz
RUN mv litecoin-${VERSION}/bin/* /usr/local/bin/
RUN rm -rf litecoin-* /root/.gnupg/

WORKDIR /home/litecoind

# Mainnet (rpc, http)
EXPOSE 9332 9333

# Testnet (rpc, http)
EXPOSE 19332 19333

# Regtest (rpc, http)
EXPOSE 19443 19444

ADD "start-litecoind.sh" ./start-litecoind.sh
RUN chmod +x ./start-litecoind.sh

CMD ["bash", "./start-litecoind.sh"]
