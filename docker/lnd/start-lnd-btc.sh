#!/usr/bin/env bash

set -e

NODE=${NODE:-btcd}
CONFIG_FILE=/home/lnd/lnd.conf
NODE=${NODE}

if [ -z "$NODE" ]; then
    echo "NODE is not set for lnd-btc"
    exit 1
fi

# Simple check to make sure that the user has changed the external url of lnd_btc
# outside of simnet. This will cause unintended issues w/ routing through the relayer
if [[ "$NETWORK" != 'simnet' ]] && [[ "$EXTERNAL_ADDRESS" == *"sample.ip.address"* ]]; then
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

# USING THIS OPTION BECAUSE WE'RE BAD
# BUT THIS WILL NEED TO BE REMOVED FOR MAINNET
echo 'LND has --noseedbackup set. MAKE SURE TO REMOVE THIS'
echo "LND BTC starting with network: $NETWORK $NODE"

PARAMS=$(echo \
    "--configfile=$CONFIG_FILE" \
    "--bitcoin.$NETWORK" \
    "--bitcoin.node=$NODE" \
    "--debuglevel=$DEBUG" \
    "--externalip=$EXTERNAL_ADDRESS" \
    "--extpreimage.rpchost=$EXTPREIMAGE_HOST" \
    "--$NODE.rpcuser=$RPC_USER" \
    "--$NODE.rpcpass=$RPC_PASS" \
    "--$NODE.rpchost=$RPC_HOST"
)

if [[ "$NODE" == "bitcoind" ]]; then
    PARAMS="$PARAMS --bitcoind.zmqpubrawblock=$ZMQPUBRAWBLOCK"
    PARAMS="$PARAMS --bitcoind.zmqpubrawtx=$ZMQPUBRAWTX"
fi

exec lnd $PARAMS "$@"
