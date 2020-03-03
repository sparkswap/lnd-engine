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

LND_VERSION='v0.8.0-beta'

# Downloads an LND proto file from the sparkswap/lnd fork
LND_PROTO_URL="https://raw.githubusercontent.com/lightningnetwork/lnd/${LND_VERSION}/lnrpc/rpc.proto"
INVOICES_PROTO_URL="https://raw.githubusercontent.com/lightningnetwork/lnd/${LND_VERSION}/lnrpc/invoicesrpc/invoices.proto"
ROUTER_PROTO_URL="https://raw.githubusercontent.com/lightningnetwork/lnd/${LND_VERSION}/lnrpc/routerrpc/router.proto"

rm -rf ./proto
mkdir -p ./proto/invoicesrpc
mkdir -p ./proto/routerrpc

echo "Downloading lnd proto files for version: ${LND_VERSION}"
curl -o ./proto/rpc.proto $LND_PROTO_URL
curl -o ./proto/invoicesrpc/invoices.proto $INVOICES_PROTO_URL
curl -o ./proto/routerrpc/router.proto $ROUTER_PROTO_URL

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
docker build -t sparkswap/lnd_btc:$ENGINE_VERSION ./docker/lnd \
  --build-arg NODE=$LND_BTC_NODE \
  --build-arg NETWORK=btc \
  --build-arg COMMIT_SHA=$COMMIT_SHA

docker build -t sparkswap/lnd_ltc:$ENGINE_VERSION ./docker/lnd \
  --build-arg NODE=$LND_LTC_NODE \
  --build-arg NETWORK=ltc \
  --build-arg COMMIT_SHA=$COMMIT_SHA

# Create bitcoind and litecoind images
docker build -t sparkswap/bitcoind:$ENGINE_VERSION ./docker/bitcoind
docker build -t sparkswap/litecoind:$ENGINE_VERSION ./docker/litecoind
