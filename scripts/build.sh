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
echo "It's time to BUILD! All resistance is futile."
echo ""

npm i

# Downloads an LND proto file from the sparkswap/lnd fork
LND_PROTO_URL=${LND_PROTO_URL:-https://raw.githubusercontent.com/sparkswap/lnd/k%23epic/cross-chain-preimage/lnrpc/rpc.proto}

rm -rf ./proto
mkdir -p ./proto

curl -o ./proto/lnd-rpc.proto $LND_PROTO_URL

# Prepares the downloaded lnd-rpc proto file (installation steps tell you to remove this line)
# (this is POSIX compliant as the versions of sed differ between OSes)
sed 's|^import \"google/api/annotations.proto\";||' ./proto/lnd-rpc.proto > /tmp/file.$$ && mv /tmp/file.$$ ./proto/lnd-rpc.proto

# If we want to build images with the command then we can use
if [ "$ARG" != "no-docker" ]; then
  echo "Building broker docker images"
  npm run build-images
fi
