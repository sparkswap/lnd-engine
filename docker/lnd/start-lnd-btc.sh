#!/usr/bin/env bash

set -e

NODE=${NODE:-bitcoind}
CONFIG_FILE=/home/lnd/lnd.conf

echo "LND BTC starting with network: $NETWORK $NODE"

PARAMS=$(echo \
    "--configfile=$CONFIG_FILE" \
    "--bitcoin.$NETWORK" \
    "--debuglevel=$DEBUG" \
    "--$NODE.rpcuser=$RPC_USER" \
    "--$NODE.rpcpass=$RPC_PASS" \
    "--$NODE.rpchost=$RPC_HOST" \
    "--$NODE.zmqpubrawblock=$ZMQPUBRAWBLOCK" \
    "--$NODE.zmqpubrawtx=$ZMQPUBRAWTX"
)

if [[ -n "$EXTERNAL_ADDRESS" ]] && [[ -n "$EXTERNAL_PORT" ]]; then
    echo "Setting external address for lnd $EXTERNAL_ADDRESS:$EXTERNAL_PORT"
    PARAMS="$PARAMS --externalip=$EXTERNAL_ADDRESS:$EXTERNAL_PORT"
fi

if [[ -n "$LND_BASE_FEE" ]]; then
    echo "Setting custom base fee for bitcoin: $LND_BASE_FEE"
    PARAMS="$PARAMS --bitcoin.basefee=$LND_BASE_FEE"
fi

if [[ -n "$LND_FEE_RATE" ]]; then
    echo "Setting custom fee rate for bitcoin: $LND_FEE_RATE"
    PARAMS="$PARAMS --bitcoin.feerate=$LND_FEE_RATE"
fi

exec lnd $PARAMS "$@"
