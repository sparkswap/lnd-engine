#!/usr/bin/env bash

# exit from script if error was raised.
set -e

# Copy certs to the shared file
[[ -e /secure/rpc.cert ]] && cp /secure/rpc.cert /shared/rpc-btc.cert

# Start a cron for simnet, if network is simnet
if [[ "$NETWORK" == "simnet" ]]; then
    crond -L /jobs/cron.log
fi


PARAMS=$(echo \
    "--$NETWORK" \
    "--debuglevel=$DEBUG" \
    "--rpcuser=$RPC_USER" \
    "--rpcpass=$RPC_PASS" \
    "--datadir=$DATA_DIR" \
    "--logdir=$LOG_DIR" \
    "--rpclisten=$RPC_LISTEN" \
    "--rpccert=$RPC_CERT" \
    "--rpckey=$RPC_KEY" \
    "--rpcmaxwebsockets=$MAX_WEB_SOCKETS" \
    "--txindex" \
    "--dropcfindex"
)

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

exec btcd $PARAMS
