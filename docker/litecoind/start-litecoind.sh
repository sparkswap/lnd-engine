#!/usr/bin/env bash

# exit from script if error was raised.
set -ex

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
    echo "* * * * * ( litecoin-cli -regtest -rpcuser=$RPC_USER -rpcpassword=$RPC_PASS generate 1 >> /jobs/cron.log 2>&1 )" >> /jobs/funding-cron.txt
    echo "* * * * * ( sleep 10 ; litecoin-cli -regtest -rpcuser="$RPC_USER" -rpcpassword="$RPC_PASS" generate 1 >> /jobs/cron.log 2>&1 )" >> /jobs/funding-cron.txt
    echo "* * * * * ( sleep 20 ; litecoin-cli -regtest -rpcuser="$RPC_USER" -rpcpassword="$RPC_PASS" generate 1 >> /jobs/cron.log 2>&1 )" >> /jobs/funding-cron.txt
    echo "* * * * * ( sleep 30 ; litecoin-cli -regtest -rpcuser="$RPC_USER" -rpcpassword="$RPC_PASS" generate 1 >> /jobs/cron.log 2>&1 )" >> /jobs/funding-cron.txt
    echo "* * * * * ( sleep 40 ; litecoin-cli -regtest -rpcuser="$RPC_USER" -rpcpassword="$RPC_PASS" generate 1 >> /jobs/cron.log 2>&1 )" >> /jobs/funding-cron.txt
    echo "* * * * * ( sleep 50 ; litecoin-cli -regtest -rpcuser="$RPC_USER" -rpcpassword="$RPC_PASS" generate 1 >> /jobs/cron.log 2>&1 )" >> /jobs/funding-cron.txt
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

if [[ "$NETWORK" != "mainnet" ]]; then
    PARAMS="$PARAMS -$NETWORK"
fi

echo "Litecoind starting with network: $NETWORK"

# If MAX_WEB_SOCKETS is specified then we'll set it in the params, otherwise
# we will let litecoind decide on the default (125)
if [[ -n "$MAX_WEB_SOCKETS" ]]; then
    PARAMS="$PARAMS -maxconnections=$MAX_WEB_SOCKETS"
fi

exec litecoind $PARAMS
