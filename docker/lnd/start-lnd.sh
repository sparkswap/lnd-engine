#!/usr/bin/env bash

# exit from script if error was raised.
set -e

# Copy certs to the shared file
[[ -e /secure/lnd-engine-tls-btc.cert ]] && cp /secure/lnd-engine-tls-btc.cert /shared
[[ -e /secure/lnd-engine-tls-ltc.cert ]] && cp /secure/lnd-engine-tls-ltc.cert /shared

# USING THIS OPTION BECAUSE WERE BAD
# BUT THIS WILL NEED TO BE REMOVED FOR TESTNET
echo 'LND has --noencryptwallet set. MAKE SURE TO REMOVE THIS'
echo "Using LND w/ env options: CHAIN:$CHAIN NETWORK:$NETWORK NODE:$NODE"


PARAMS=$(echo \
    "--noencryptwallet" \
    "--adminmacaroonpath=$ADMIN_MACAROON" \
    "--readonlymacaroonpath=$READ_ONLY_MACAROON" \
    "--tlscertpath=$TLS_CERT_PATH" \
    "--tlskeypath=$TLS_KEY_PATH" \
    "--rpclisten=$RPC_LISTEN" \
    "--listen=$LISTEN" \
    "--restlisten=$REST_LISTEN" \
    "--datadir=$DATA_DIR" \
    "--logdir=$LOG_DIR" \
    "--$CHAIN.$NETWORK" \
    "--$CHAIN.active" \
    "--$CHAIN.node=$NODE" \
    "--$NODE.rpccert=$RPC_CERT_PATH" \
    "--$NODE.rpchost=$RPC_HOST" \
    "--$NODE.rpcuser=$RPC_USER" \
    "--$NODE.rpcpass=$RPC_PASS" \
    "--debuglevel=$DEBUG" \
    "--externalip=$EXTERNAL_ADDRESS"
)

# We want to disable bootstrapping for testnet due to missing LTC DNS seeds for
# LND and because sparkswap/lnd is not updated to tip
if [[ "$NETWORK" == "testnet" ]]; then
    PARAMS="$PARAMS --nobootstrap"
fi

exec lnd $PARAMS "$@"
