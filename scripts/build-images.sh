#!/usr/bin/env bash

set -e -u

# Default certhost needed to build images. For production, this will change to *.kinesis.network
LTCD_CERT_HOST=${LTCD_CERT_HOST:-docker.for.mac.host.internal}
BTCD_CERT_HOST=${BTCD_CERT_HOST:-docker.for.mac.host.internal}

echo "Building images for cert hosts: LTC: $LTCD_CERT_HOST, BTC: $BTCD_CERT_HOST"
echo "This cert host is used during ltcd/btcd cert generation"
echo ""

# Default branches for each repo
# TODO: Lock these to a specific commit
LND_VERSION='k#epic/cross-chain-preimage'
LTCD_VERSION='master'
BTCD_VERSION='master'

# We add a COMMIT_SHA argument to the lnd dockerfile to trigger cache-invalidation
# when get git clone the kinesis-exchange/lnd repo. Without it, docker would continue
# to cache old code and we would never receive updates from the fork.
#
COMMIT_SHA=`git ls-remote git://github.com/kinesis-exchange/lnd | grep "refs/heads/$LND_VERSION$" | cut -f 1`
LTCD_COMMIT_SHA=`git ls-remote git://github.com/ltcsuite/ltcd | grep "refs/heads/$LTCD_VERSION$" | cut -f 1`
BTCD_COMMIT_SHA=`git ls-remote git://github.com/btcsuite/btcd | grep "refs/heads/$BTCD_VERSION$" | cut -f 1`

# We need to set LTCD_COMMIT_SHA to a specific commit due to an rpcwitness
# data type change that is not pushed to master yet.
#
# We set to a specific commit to make sure LTCD will not break on new changes
# to master.
#
# TODO: Remove this once https://github.com/ltcsuite/ltcd/pull/7 is merged
LTCD_COMMIT_SHA='cdab10132e8c6e4a3ffd112dba54791946d28906'

# NOTE: The names specified with `-t` directly map to the service names in
# the applicable services docker-compose file
docker build -t kinesis_lnd_btc ./docker/lnd --build-arg NETWORK=btc --build-arg COMMIT_SHA=$COMMIT_SHA
docker build -t kinesis_lnd_ltc ./docker/lnd --build-arg NETWORK=ltc --build-arg COMMIT_SHA=$COMMIT_SHA
docker build -t kinesis_ltcd ./docker/ltcd --build-arg COMMIT_SHA=$LTCD_COMMIT_SHA --build-arg CERT_HOST=$LTCD_CERT_HOST
docker build -t kinesis_btcd ./docker/btcd --build-arg COMMIT_SHA=$BTCD_COMMIT_SHA --build-arg CERT_HOST=$BTCD_CERT_HOST
