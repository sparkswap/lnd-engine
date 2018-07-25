#!/usr/bin/env bash

set -e -u

echo ""
echo "It's time to BUILD! All resistance is futile."
echo ""

npm i

# Downloads an LND proto file from the sparkswap/lnd fork
LND_PROTO_URL=${LND_PROTO_URL:-https://raw.githubusercontent.com/sparkswap/lnd/k%23epic/cross-chain-preimage/lnrpc/rpc.proto}
curl -o ./proto/lnd-rpc.proto $LND_PROTO_URL

# Prepares the downloaded lnd-rpc proto file (installation steps tell you to remove this line)
# (this is POSIX compliant as the versions of sed differ between OSes)
sed 's|^import \"google/api/annotations.proto\";||' ./proto/lnd-rpc.proto > /tmp/file.$$ && mv /tmp/file.$$ ./proto/lnd-rpc.proto
