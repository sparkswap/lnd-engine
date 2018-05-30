#!/usr/bin/env bash

##########################################
#
# This file contains logic to fund a wallet on SIMNET w/ the default LND setup for the relayer.
#
# Information in this script is based off the LND docker setup:
# https://github.com/lightningnetwork/lnd/tree/master/docker
#
# NOTE: This script is incomplete because of the `--noencryptwallet` flag that is
#       included in the lnd_btc container. If this flag was removed, we would need to
#       create a wallet w/ pass and nmemonic
#
##########################################

set -e -u

echo "Generating a new wallet address"
echo "Engine.createNewAddress().then(console.log)" | docker-compose run lnd_repl

echo -n "Copy and paste the mining address: "
read answer

# Given the address generated above, we can now restart btcd to mine
MINING_ADDRESS="$answer" docker-compose up -d btcd

GENERATE_CMD='btcctl --simnet --rpcuser="$RPC_USER" --rpcpass="$RPC_PASS" --rpccert="$RPC_CERT" generate 400'
docker-compose exec -T btcd /bin/sh -c "$GENERATE_CMD"

echo "Engine.getTotalBalance().then(console.log)" | docker-compose run lnd_repl
