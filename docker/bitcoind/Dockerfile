FROM ubuntu:18.04 as builder

LABEL maintainer="Sparkswap <dev@sparkswap.com>"

# We set the version externally so we are not required to edit the Dockerfile in the
# case of updating for security patches
ARG VERSION
RUN : "${VERSION:?VERSION Build argument needs to be set.}"

RUN apt-get update
RUN apt-get install -y software-properties-common
RUN apt-add-repository ppa:bitcoin/bitcoin && \
  apt-get update
RUN apt-get install -y bitcoind=${VERSION}-bionic1

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
