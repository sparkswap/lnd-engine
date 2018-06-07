#!/usr/bin/env bash

# exit from script if error was raised.
set -e

# Copy certs to the shared file
[[ -e /secure/rpc.cert ]] && cp /secure/rpc.cert /shared

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
    "--rpccert=$RPC_CERT" \
    "--rpckey=$RPC_KEY" \
    "--rpclisten=$RPC_LISTEN" \
    "--txindex"
)

# Set the mining flag w/ specified environment variable
#
# If the network is set to simnet AND the address is not specified as an env variable
# we will use a fake address to give the appearance of miners on the simnet blockchain
if [[ -n "$MINING_ADDRESS" ]]; then
    PARAMS="$PARAMS --miningaddr=$MINING_ADDRESS"
elif [[ "$NETWORK" == "simnet" ]]; then
    PARAMS="$PARAMS --miningaddr=SW8yPHHVAeedS5JMsACPuARdb3AxidHUkv"
fi

exec btcd $PARAMS
