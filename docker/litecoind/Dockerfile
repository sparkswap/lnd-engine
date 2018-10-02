FROM ubuntu:18.04 as builder

LABEL maintainer "sparkswap <dev@sparkswap.com>"

# We set the version externally so we are not required to edit the Dockerfile in the
# case of updating for security patches
ARG VERSION
RUN : "${VERSION:?VERSION Build argument needs to be set.}"

RUN apt-get update
RUN apt-get install -y software-properties-common
RUN apt-get install -y --no-install-recommends \
  ca-certificates \
  wget \
  gpg \
  gpg-agent \
  dirmngr

# Install Litecoin and check GPG key to verify the package
RUN wget https://download.litecoin.org/litecoin-${VERSION}/linux/litecoin-${VERSION}-x86_64-linux-gnu.tar.gz && \
  wget https://download.litecoin.org/litecoin-${VERSION}/linux/litecoin-${VERSION}-x86_64-linux-gnu.tar.gz.asc && \
  gpg --keyserver pgp.mit.edu --recv-key FE3348877809386C && \
  gpg --verify litecoin-${VERSION}-x86_64-linux-gnu.tar.gz.asc && \
  tar xfz /litecoin-${VERSION}-x86_64-linux-gnu.tar.gz && \
  mv litecoin-${VERSION}/bin/* /usr/local/bin/ && \
  rm -rf litecoin-* /root/.gnupg/

WORKDIR /home/litecoind

# Mainnet (rpc, http)
EXPOSE 9332 9333

# Testnet (rpc, http)
EXPOSE 19332 19333

# Regtest? (rpc. http)
EXPOSE 19443 19444

ADD "start-litecoind.sh" ./start-litecoind.sh
RUN chmod +x ./start-litecoind.sh

CMD ["bash", "./start-litecoind.sh"]
