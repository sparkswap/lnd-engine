#!/usr/bin/env bash

set -e

NODE=${NODE:-ltcd}
CONFIG_FILE=/home/lnd/lnd.conf

# Simple check to make sure that the user has changed the external url of lnd_btc
# outside of simnet. This will cause unintended issues w/ routing through the relayer
if [[ "$NETWORK" != 'simnet' ]] && [[ "$EXTERNAL_ADDRESS" == *"sample.ip.address"* ]]; then
    echo "Your current external address for LND_LTC is set to an internal address. Please change this for $NETWORK"
    exit 1
fi

# Copy certs to the shared file
if [[ -e /secure/lnd-engine-tls-ltc.cert ]]; then
    rm -f /shared/lnd-engine-tls-ltc.cert
    cp /secure/lnd-engine-tls-ltc.cert /shared/lnd-engine-tls-ltc.cert
else
    echo "/secure/lnd-engine-tls-ltc.cert does not exist inside of the lnd docker container."
    echo "Please check your dockerfile changes or rebuild images w/ npm run build-images"
    exit 1
fi

echo "LND LTC starting with network: $NETWORK $NODE"

PARAMS=$(echo \
    "--configfile=$CONFIG_FILE" \
    "--litecoin.$NETWORK" \
    "--debuglevel=$DEBUG" \
    "--externalip=$EXTERNAL_ADDRESS" \
    "--extpreimage.rpchost=$EXTPREIMAGE_HOST" \
    "--$NODE.rpcuser=$RPC_USER" \
    "--$NODE.rpcpass=$RPC_PASS" \
    "--$NODE.rpchost=$RPC_HOST"
)

if [[ "$NODE" == "litecoind" ]]; then
    PARAMS="$PARAMS --$NODE.zmqpubrawblock=$ZMQPUBRAWBLOCK"
    PARAMS="$PARAMS --$NODE.zmqpubrawtx=$ZMQPUBRAWTX"
fi

if [[ "$NETWORK" == 'simnet' ]]; then
  echo "Setting --noseedbackup for $NETWORK"
  PARAMS="$PARAMS --noseedbackup=1"
fi

exec lnd $PARAMS "$@"
