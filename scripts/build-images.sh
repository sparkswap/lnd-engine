#!/usr/bin/env bash

set -e -u

# We add a COMMIT_SHA argument to the lnd dockerfile to trigger cache-invalidation
# when get git clone the kinesis-exchange/lnd repo. Without it, docker would continue
# to cache old code and we would never receive updates from the fork.
COMMIT_SHA=`git ls-remote git://github.com/kinesis-exchange/lnd | grep refs/heads/k#epic/cross-chain-preimage | cut -f 1`

# NOTE: The names specified with `-t` directly map to the service names in
# the applicable services docker-compose file
docker build -t kinesis_lnd_btc ./docker/lnd --build-arg NETWORK=btc --build-arg COMMIT_SHA=$COMMIT_SHA
docker build -t kinesis_lnd_ltc ./docker/lnd --build-arg NETWORK=ltc --build-arg COMMIT_SHA=$COMMIT_SHA
docker build -t kinesis_ltcd ./docker/ltcd
docker build -t kinesis_btcd ./docker/btcd
