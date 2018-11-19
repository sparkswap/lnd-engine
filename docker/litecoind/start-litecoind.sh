#!/usr/bin/env bash

set -e

MINER=${MINER:-false}

# Start a cron if network is regtest and the current node is setup to be the networks
# miner.
if [[ "$NETWORK" == "regtest" ]] && [[ "$MINER" = true ]]; then
    echo "Setting up litecoind instance as MINER"
    mkdir -p "/jobs"
    touch "/jobs/cron.log"
    # We must add the `funding-cron` txt file here because we are forced to use
    # `cron` instead of `crond`, where the former does not import environment variables
    # from the user session and instead uses a bare-bones `sh` session to run these commands
    LITECOIN_CLI_PATH=/usr/local/bin/litecoin-cli
    echo "* * * * * ( $LITECOIN_CLI_PATH -regtest -rpcuser=$RPC_USER -rpcpassword=$RPC_PASS generate 101 >> /jobs/cron.log 2>&1 ) ; sleep infinity" >> /jobs/funding-cron.txt
    echo "* * * * * ( $LITECOIN_CLI_PATH -regtest -rpcuser=$RPC_USER -rpcpassword=$RPC_PASS generate 1 >> /jobs/cron.log 2>&1 )" >> /jobs/funding-cron.txt
    echo "* * * * * ( sleep 10 ; $LITECOIN_CLI_PATH -regtest -rpcuser="$RPC_USER" -rpcpassword="$RPC_PASS" generate 1 >> /jobs/cron.log 2>&1 )" >> /jobs/funding-cron.txt
    echo "* * * * * ( sleep 20 ; $LITECOIN_CLI_PATH -regtest -rpcuser="$RPC_USER" -rpcpassword="$RPC_PASS" generate 1 >> /jobs/cron.log 2>&1 )" >> /jobs/funding-cron.txt
    echo "* * * * * ( sleep 30 ; $LITECOIN_CLI_PATH -regtest -rpcuser="$RPC_USER" -rpcpassword="$RPC_PASS" generate 1 >> /jobs/cron.log 2>&1 )" >> /jobs/funding-cron.txt
    echo "* * * * * ( sleep 40 ; $LITECOIN_CLI_PATH -regtest -rpcuser="$RPC_USER" -rpcpassword="$RPC_PASS" generate 1 >> /jobs/cron.log 2>&1 )" >> /jobs/funding-cron.txt
    echo "* * * * * ( sleep 50 ; $LITECOIN_CLI_PATH -regtest -rpcuser="$RPC_USER" -rpcpassword="$RPC_PASS" generate 1 >> /jobs/cron.log 2>&1 )" >> /jobs/funding-cron.txt
    chmod 755 /jobs/funding-cron.txt
    /usr/bin/crontab /jobs/funding-cron.txt
    cron
fi

PARAMS=$(echo \
    "-printtoconsole" \
    "-rpcuser=$RPC_USER" \
    "-rpcpassword=$RPC_PASS" \
    "-datadir=$DATA_DIR" \
    "-rpcbind=$RPC_LISTEN" \
    "-rpcallowip=0.0.0.0/0" \
    "-listenonion=0" \
    "-zmqpubrawblock=tcp://0.0.0.0:28333" \
    "-zmqpubrawtx=tcp://0.0.0.0:28334" \
    "-server=1" \
    "-txindex"
)

if [[ "$DEBUG" == "debug" ]]; then
    PARAMS="$PARAMS -debug"
fi

# Litecoind has options for -regtest and -testnet, but does not require an option
# if the network is mainnet
if [[ "$NETWORK" != "mainnet" ]]; then
    PARAMS="$PARAMS -$NETWORK"
fi

# Litecoind does not support hostname to ip resolution very well, so instead, if the
# CONNECT_HOST variable is set to a docker address, we will use the OS to resolve to
# an IP and then connect to that machine
if [[ "$NETWORK" == "regtest" ]] && [[ -n "$CONNECT_HOST" ]]; then
    if [[ "$CONNECT_HOST" == "host.docker.internal" ]]; then
        CONNECT_HOST=$(getent hosts host.docker.internal | awk '{ print $1 ; exit }')
    fi

    echo "Connecting to mining node: $CONNECT_HOST:$CONNECT_PORT"
    PARAMS="$PARAMS --connect=$CONNECT_HOST:$CONNECT_PORT"
fi

# For a regtest setup, we need to expose a port that other nodes can connect to.
# this port will be designated for ONLY miners.
if [[ "$NETWORK" == "regtest" ]] && [[ "$MINER" = true ]]; then
    PARAMS="$PARAMS -port=$MINER_PORT"
fi

# If MAX_WEB_SOCKETS is specified then we'll set it in the params, otherwise
# we will let litecoind decide on the default (125)
if [[ "$NETWORK" == "regtest" ]] && [[ -n "$MAX_WEB_SOCKETS" ]]; then
    PARAMS="$PARAMS -maxconnections=$MAX_WEB_SOCKETS"
fi

echo "Litecoind starting with network: $NETWORK"

exec litecoind $PARAMS
