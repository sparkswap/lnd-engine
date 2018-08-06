#!/usr/bin/env bash

# exit from script if error was raised.
set -e

CONFIG_FILE=/home/lnd/lnd.conf

# Copy certs to the shared file
if [[ -e /secure/lnd-engine-tls-ltc.cert ]]; then
    rm -f /shared/lnd-engine-tls-ltc.cert
    cp /secure/lnd-engine-tls-ltc.cert /shared/lnd-engine-tls-ltc.cert
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
    "--litecoin.$NETWORK" \
    "--debuglevel=$DEBUG" \
    "--externalip=$EXTERNAL_ADDRESS" \
    "--extpreimage.rpchost=$EXTPREIMAGE_HOST" \
    "--ltcd.rpcuser=$RPC_USER" \
    "--ltcd.rpcpass=$RPC_PASS"
)

# User is allowed to specify
# Default is btcd
if [[ -z "$RPC_HOST" ]]; then
    PARAMS="$PARAMS --ltcd.rpchost=$RPC_HOST"
fi

exec lnd $PARAMS "$@"
