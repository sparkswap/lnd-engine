#!/usr/bin/env bash

# exit from script if error was raised.
set -e

# Start a cron if network is regtest
if [[ "$NETWORK" == "regtest" ]]; then
    mkdir -p "/jobs"
    touch "/jobs/cron.log"
    # We must add the `funding-cron` txt file here because we are forced to use
    # `cron` instead of `crond`, where the former does not import environment variables
    # from the user session and instead uses a bare-bones `sh` session to run these commands
    echo "* * * * * ( bitcoin-cli -regtest -rpcuser=$RPC_USER -rpcpassword=$RPC_PASS generate 1 >> /jobs/cron.log 2>&1 )" >> /jobs/funding-cron.txt
    echo "* * * * * ( sleep 10 ; bitcoin-cli -regtest -rpcuser="$RPC_USER" -rpcpassword="$RPC_PASS" generate 1 >> /jobs/cron.log 2>&1 )" >> /jobs/funding-cron.txt
    echo "* * * * * ( sleep 20 ; bitcoin-cli -regtest -rpcuser="$RPC_USER" -rpcpassword="$RPC_PASS" generate 1 >> /jobs/cron.log 2>&1 )" >> /jobs/funding-cron.txt
    echo "* * * * * ( sleep 30 ; bitcoin-cli -regtest -rpcuser="$RPC_USER" -rpcpassword="$RPC_PASS" generate 1 >> /jobs/cron.log 2>&1 )" >> /jobs/funding-cron.txt
    echo "* * * * * ( sleep 40 ; bitcoin-cli -regtest -rpcuser="$RPC_USER" -rpcpassword="$RPC_PASS" generate 1 >> /jobs/cron.log 2>&1 )" >> /jobs/funding-cron.txt
    echo "* * * * * ( sleep 50 ; bitcoin-cli -regtest -rpcuser="$RPC_USER" -rpcpassword="$RPC_PASS" generate 1 >> /jobs/cron.log 2>&1 )" >> /jobs/funding-cron.txt
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

echo "Bitcoind starting with network: $NETWORK"

# If MAX_WEB_SOCKETS is specified then we'll set it in the params, otherwise
# we will let bitcoind decide on the default (125)
if [[ -n "$MAX_WEB_SOCKETS" ]]; then
    PARAMS="$PARAMS -maxconnections=$MAX_WEB_SOCKETS"
fi

exec bitcoind $PARAMS
