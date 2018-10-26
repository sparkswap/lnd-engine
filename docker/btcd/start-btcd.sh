#!/usr/bin/env bash

# exit from script if error was raised.
set -e

if [[ -e /secure/rpc.cert ]]; then
    rm -f /shared/rpc-btc.cert
    cp /secure/rpc.cert /shared/rpc-btc.cert
else
    echo "/secure/rpc.cert does not exist inside of the btcd docker container."
    echo "Please check your dockerfile changes or rebuild images w/ npm run build-images"
    exit 1
fi

# Start a cron for simnet, if network is simnet
if [[ "$NETWORK" == "simnet" ]]; then
    crond -L /jobs/cron.log
fi

PARAMS=$(echo \
    "--debuglevel=$DEBUG" \
    "--rpcuser=$RPC_USER" \
    "--rpcpass=$RPC_PASS" \
    "--datadir=$DATA_DIR" \
    "--logdir=$LOG_DIR" \
    "--rpclisten=$RPC_LISTEN" \
    "--rpccert=$RPC_CERT" \
    "--rpckey=$RPC_KEY" \
    "--txindex"
)

# If the network is mainnet, then we can omit the network tag for btcd.
if [[ "$NETWORK" != "mainnet" ]]; then
    PARAMS="$PARAMS --$NETWORK"
fi


# If MAX_WEB_SOCKETS is specified then we'll set it in the params, otherwise
# we will let btcd decide on the default
if [[ -n "$MAX_WEB_SOCKETS" ]]; then
    PARAMS="$PARAMS --rpcmaxwebsockets=$MAX_WEB_SOCKETS"
fi

# Set the mining flag w/ specified environment variable
#
# If the network is set to simnet AND the address is not specified as an env variable
# we will use a fake address to give the appearance of miners on the simnet blockchain
if [[ -n "$MINING_ADDRESS" ]]; then
    PARAMS="$PARAMS --miningaddr=$MINING_ADDRESS"
elif [[ "$NETWORK" == "simnet" ]]; then
    BURN_ADDRESS='sb1qcpeeeyuwfvguh6nudsquxww88dlefkrvns2wjd'
    PARAMS="$PARAMS --miningaddr=$BURN_ADDRESS"
fi

echo "BTCD starting with network: $NETWORK"

exec btcd $PARAMS
