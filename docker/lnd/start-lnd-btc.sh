#!/usr/bin/env bash

# exit from script if error was raised.
set -e

CONFIG_FILE=/home/lnd/lnd.conf

# Simple check to make sure that the user has changed the external url of lnd_btc
# outside of simnet. This will cause unintended issues w/ routing through the relayer
if [[ "$NETWORK" != 'simnet' ]] && [[ "$EXTERNAL_ADDRESS" == *"host.docker.internal"* ]]; then
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

# USING THIS OPTION BECAUSE WERE BAD
# BUT THIS WILL NEED TO BE REMOVED FOR TESTNET
echo 'LND has --noencryptwallet set. MAKE SURE TO REMOVE THIS'


PARAMS=$(echo \
    "--configfile=$CONFIG_FILE" \
    "--bitcoin.$NETWORK" \
    "--debuglevel=$DEBUG" \
    "--externalip=$EXTERNAL_ADDRESS" \
    "--extpreimage.rpchost=$EXTPREIMAGE_HOST" \
    "--btcd.rpcuser=$RPC_USER" \
    "--btcd.rpcpass=$RPC_PASS" \
    "--btcd.rpchost=$RPC_HOST"
)

exec lnd $PARAMS "$@"
