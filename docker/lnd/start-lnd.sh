#!/usr/bin/env bash

# exit from script if error was raised.
set -e

# Copy certs to the shared file
if [[ "$CHAIN" == "bitcoin" ]] && [[ -e /secure/lnd-engine-tls-btc.cert ]]; then
    rm -f /shared/lnd-engine-tls-btc.cert
    cp /secure/lnd-engine-tls-btc.cert /shared/lnd-engine-tls-btc.cert
elif [[ "$CHAIN" == "bitcoin" ]]; then
    echo "/secure/lnd-engine-tls-btc.cert does not exist inside of the lnd docker container."
    echo "Please check your dockerfile changes or rebuild images w/ npm run build-images"
    exit 1
fi

if [[ "$CHAIN" == "litecoin" ]] && [[ -e /secure/lnd-engine-tls-ltc.cert ]]; then
    rm -f /shared/lnd-engine-tls-ltc.cert
    cp /secure/lnd-engine-tls-ltc.cert /shared/lnd-engine-tls-ltc.cert
elif [[ "$CHAIN" == "litecoin" ]]; then
    echo "/secure/lnd-engine-tls-btc.cert does not exist inside of the lnd docker container."
    echo "Please check your dockerfile changes or rebuild images w/ npm run build-images"
    exit 1
fi

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
    "--externalip=$EXTERNAL_ADDRESS" \
    "--extpreimage.rpchost=$EXTPREIMAGE_HOST"
)

# We want to disable bootstrapping for testnet due to missing LTC DNS seeds for
# LND and because sparkswap/lnd is not updated to tip
if [[ ! "$NETWORK" == "mainnet" ]]; then
    echo "Disabling dns bootstrap for $NETWORK"
    PARAMS="$PARAMS --nobootstrap"
fi

exec lnd $PARAMS "$@"
