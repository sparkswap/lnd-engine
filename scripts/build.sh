#!/usr/bin/env bash

################################################
# Build script for LND-engine
#
# Params:
# - LND_PROTO_URL (optional)
# - INCLUDE_DOCKER (optional, defaults to false)
################################################

set -e -u

ARG=${1:-false}

echo ""
echo "    ▄▄██████▄▄                              ▄▄                                "
echo "  ▄██████████▀█▄                            ██                                "
echo " ████████▀▀ ▄████    ▄███▄ ████▄  ████▄ ███ ██  ██ ▄███▄ ██ ██ ██ ████▄ ████▄ "
echo "█████▀    ▄███████   ██    ██  ██     █ ██▀ ████▀  ██    ██▄██▄██     █ ██  ██"
echo "██████▄    ▀██████   ▀███▄ ██  ██ ▄████ ██  ████   ▀███▄  ██████  ▄████ ██  ██"
echo "███████▀    ▄█████      ██ ██  ██ ██  █ ██  ██ ██     ██  ▀██ █▀  ██  █ ██  ██"
echo " ████▀ ▄▄████████    ▀███▀ ████▀  █████ ██  ██  ██ ▀███▀   ██ █   █████ ████▀ "
echo "  ▀█▄██████████▀           ██                                           ██    "
echo "    ▀▀██████▀▀             ▀▀                                           ▀▀    "
echo "                                                         https://sparkswap.com"
echo ""
echo "LND Engine Build starting..."
echo ""
echo ""

if [ "$LATEST" == "true" ]; then
  # Set as the current master commit from June 9th. We peg this to a commit
  # to have a semi-stable version of lnd (one that we have tested)
  LND_VERSION='880279b266e982e419044e04e7a7157e0c2b7074'
  LND_ORG_NAME='lightningnetwork'
else
  LND_VERSION='v0.5.4-sparkswap-beta'
  LND_ORG_NAME='sparkswap'
fi

# Downloads an LND proto file from the sparkswap/lnd fork
LND_PROTO_URL="https://raw.githubusercontent.com/${LND_ORG_NAME}/lnd/${LND_VERSION}/lnrpc/rpc.proto"

rm -rf ./proto
mkdir -p ./proto

echo "Downloading lnd proto file for version: ${LND_VERSION}"
curl -o ./proto/lnd-rpc.proto $LND_PROTO_URL

# Prepares the downloaded lnd-rpc proto file (installation steps tell you to remove this line)
# (this is POSIX compliant as the versions of sed differ between OSes)
sed 's|^import \"google/api/annotations.proto\";||' ./proto/lnd-rpc.proto > /tmp/file.$$ && mv /tmp/file.$$ ./proto/lnd-rpc.proto

echo "Building images for lnd-engine"

# We add a COMMIT_SHA argument to the lnd dockerfile to trigger cache-invalidation
# when get git clone the sparkswap/lnd repo. Without it, docker would continue
# to cache old code and we would never receive updates from the fork.
# COMMIT_SHA=`git ls-remote git://github.com/sparkswap/lnd | grep "refs/heads/$LND_VERSION$" | cut -f 1`

# If our LND_VERSION is a tag or a commit, we can use it directly
COMMIT_SHA=${LND_VERSION}

LND_BTC_NODE=bitcoind
LND_LTC_NODE=litecoind

ENGINE_VERSION=$(node -pe "require('./package.json').version")

# NOTE: The names specified with `-t` directly map to the our service names in
# on sparkswap dockerhub
docker build -t sparkswap/lnd_btc:$ENGINE_VERSION ./docker/lnd --build-arg NODE=$LND_BTC_NODE --build-arg NETWORK=btc --build-arg COMMIT_SHA=$COMMIT_SHA --build-arg LND_ORG_NAME=$LND_ORG_NAME
docker build -t sparkswap/lnd_ltc:$ENGINE_VERSION ./docker/lnd --build-arg NODE=$LND_LTC_NODE --build-arg NETWORK=ltc --build-arg COMMIT_SHA=$COMMIT_SHA --build-arg LND_ORG_NAME=$LND_ORG_NAME

# Create bitcoind and litecoind images
BITCOIND_VERSION='0.17.1'
docker build -t sparkswap/bitcoind:$ENGINE_VERSION ./docker/bitcoind --build-arg VERSION=$BITCOIND_VERSION
LITECOIND_VERSION='0.16.3'
docker build -t sparkswap/litecoind:$ENGINE_VERSION ./docker/litecoind --build-arg VERSION=$LITECOIND_VERSION
