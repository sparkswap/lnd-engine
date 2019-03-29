#!/usr/bin/env bash

set -e

NODE=${NODE:-litecoind}
CONFIG_FILE=/home/lnd/lnd.conf

echo "LND LTC starting with network: $NETWORK $NODE"

PARAMS=$(echo \
    "--configfile=$CONFIG_FILE" \
    "--litecoin.$NETWORK" \
    "--debuglevel=$DEBUG" \
    "--extpreimage.rpchost=$EXTPREIMAGE_HOST" \
    "--$NODE.rpcuser=$RPC_USER" \
    "--$NODE.rpcpass=$RPC_PASS" \
    "--$NODE.rpchost=$RPC_HOST" \
    "--$NODE.zmqpubrawblock=$ZMQPUBRAWBLOCK" \
    "--$NODE.zmqpubrawtx=$ZMQPUBRAWTX"
)

if [[ -n "$EXTERNAL_ADDRESS" ]]; then
    echo "Setting external address for lnd $EXTERNAL_ADDRESS"
    PARAMS="$PARAMS --externalip=$EXTERNAL_ADDRESS"
fi

if [[ -n "$LND_BASE_FEE" ]]; then
    echo "Setting custom base fee for litecoin: $LND_BASE_FEE"
    PARAMS="$PARAMS --litecoin.basefee=$LND_BASE_FEE"
fi

if [[ -n "$LND_FEE_RATE" ]]; then
    echo "Setting custom fee rate for litecoin: $LND_FEE_RATE"
    PARAMS="$PARAMS --litecoin.feerate=$LND_FEE_RATE"
fi

exec lnd $PARAMS "$@"
