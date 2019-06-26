FROM ubuntu:18.04 as builder

LABEL maintainer="Sparkswap <dev@sparkswap.com>"

ARG BITCOIND_VERSION='0.17.1'

# Install all deps needed for bitcoind verification
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

ENV FILENAME bitcoin-${BITCOIND_VERSION}-x86_64-linux-gnu.tar.gz
ENV CHECKSUM_FILENAME SHA256SUMS.asc

# Verify bitcoin installation files and install bitcoind
RUN wget -q https://bitcoin.org/bin/bitcoin-core-${BITCOIND_VERSION}/${FILENAME}
RUN wget -q https://bitcoin.org/bin/bitcoin-core-${BITCOIND_VERSION}/${CHECKSUM_FILENAME}

# We iterate through multiple keyservers to prevent docker failures in the case a
# single gpg server fails
RUN for KEYSERVER_NAME in ha.pool.sks-keyservers.net \
      hkp://p80.pool.sks-keyservers.net:80 \
      keyserver.ubuntu.com \
      hkp://keyserver.ubuntu.com:80 \
      pgp.mit.edu; \
    do \
      gpg2 --keyserver $KEYSERVER_NAME --recv-keys 0x90C8019E36C2E964 && \
      break || echo "$KEYSERVER_NAME failed: Trying another gpg server"; \
    done

RUN gpg2 --verify ./${CHECKSUM_FILENAME}
RUN tar xfz /${FILENAME}
RUN mv bitcoin-${BITCOIND_VERSION}/bin/* /usr/local/bin/
RUN rm -rf bitcoin-* /root/.gnupg/

# Mainnet ports (rpc, http)
EXPOSE 8332 8333

# Testnet Ports (rpc, http)
EXPOSE 18332 18333

# RegTest (rpc, http)
EXPOSE 18443 18444

# zmq interfaces (block, tx)
EXPOSE 28333 28334

WORKDIR /home/bitcoind

ADD "start-bitcoind.sh" ./start-bitcoind.sh
RUN chmod +x ./start-bitcoind.sh

CMD ["bash", "./start-bitcoind.sh"]
