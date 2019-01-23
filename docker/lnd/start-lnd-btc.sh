#!/usr/bin/env bash

set -e

NODE=${NODE:-bitcoind}
CONFIG_FILE=/home/lnd/lnd.conf

# Simple check to make sure that the user has changed the external url of lnd_btc
# outside of regtest. This will cause unintended issues w/ routing through the relayer
if [[ "$NETWORK" != 'regtest' ]] && [[ "$EXTERNAL_ADDRESS" == *"sample.ip.address"* ]]; then
    echo "Your current external address for LND_BTC is set to an internal address. Please change this for $NETWORK"
    exit 1
fi

# Copy certs to the shared file
if [[ -e /secure/lnd-engine-tls-btc.cert ]]; then
    rm -f /shared/lnd-engine-tls-btc.cert
    cp /secure/lnd-engine-tls-btc.cert /shared/lnd-engine-tls-btc.cert
else
    echo "/secure/lnd-engine-tls-btc.cert does not exist inside of the lnd docker container."
    echo "Please check your dockerfile changes or rebuild images w/ npm run build-images"
    exit 1
fi

echo "LND BTC starting with network: $NETWORK $NODE"

PARAMS=$(echo \
    "--configfile=$CONFIG_FILE" \
    "--bitcoin.$NETWORK" \
    "--debuglevel=$DEBUG" \
    "--externalip=$EXTERNAL_ADDRESS" \
    "--extpreimage.rpchost=$EXTPREIMAGE_HOST" \
    "--$NODE.rpcuser=$RPC_USER" \
    "--$NODE.rpcpass=$RPC_PASS" \
    "--$NODE.rpchost=$RPC_HOST" \
    "--$NODE.zmqpubrawblock=$ZMQPUBRAWBLOCK" \
    "--$NODE.zmqpubrawtx=$ZMQPUBRAWTX"
)

exec lnd $PARAMS "$@"
