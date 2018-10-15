#!/usr/bin/env bash

set -e

# Copy certs to the shared file
if [[ -e /secure/rpc.cert ]]; then
    rm -f /shared/rpc-ltc.cert
    cp /secure/rpc.cert /shared/rpc-ltc.cert
else
    echo "/secure/rpc.cert does not exist inside of the ltcd docker container."
    echo "Please check your dockerfile changes or rebuild images w/ npm run build-images"
    exit 1
fi

# Start a cron if network is simnet
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

# If the network is mainnet, then we can omit the network tag for ltcd.
if [[ "$NETWORK" != "mainnet" ]]; then
    PARAMS="$PARAMS --$NETWORK"
fi

echo "LTCD starting with network: $NETWORK"

# If MAX_WEB_SOCKETS is specified then we'll set it in the params, otherwise
# we will let ltcd decide on the default
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
    # TODO: Need to update this for ltcd
    BURN_ADDRESS='03f1bc833f465d56bb388cb3d9c9bc9ac175cc0293bfb53a568607281db9680d05'
    PARAMS="$PARAMS --miningaddr=$BURN_ADDRESS"
fi

exec ltcd $PARAMS

