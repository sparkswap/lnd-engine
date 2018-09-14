#!/usr/bin/env bash

# exit from script if error was raised.
set -e

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
    echo "/secure/lnd-engine-tls-btc.cert does not exist inside of the lnd docker container."
    echo "Please check your dockerfile changes or rebuild images w/ npm run build-images"
    exit 1
fi

# USING THIS OPTION BECAUSE WE'RE BAD
# BUT THIS WILL NEED TO BE REMOVED FOR MAINNET
echo 'LND has --noseedbackup set. MAKE SURE TO REMOVE THIS'
echo "LND LTC starting with network: $NETWORK"

PARAMS=$(echo \
    "--configfile=$CONFIG_FILE" \
    "--litecoin.$NETWORK" \
    "--debuglevel=$DEBUG" \
    "--externalip=$EXTERNAL_ADDRESS" \
    "--extpreimage.rpchost=$EXTPREIMAGE_HOST" \
    "--ltcd.rpcuser=$RPC_USER" \
    "--ltcd.rpcpass=$RPC_PASS" \
    "--ltcd.rpchost=$RPC_HOST"
)

exec lnd $PARAMS "$@"
