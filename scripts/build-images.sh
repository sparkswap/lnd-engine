#!/usr/bin/env bash

set -e -u

# We add a CACHE_DATE to the lnd repos to trigger cache-invalidation for the cloning
# the lnd repository. Without it, docker would continue to cache old code and we
# would never receive updates from the kinesis-exchange/lnd fork.
CACHE_DATE=`date '+%Y-%m-%d-%H:%M'`

# NOTE: The names specified with `-t` directly map to the service names in
# the applicable services docker-compose file
docker build -t kinesis_lnd_btc ./docker/lnd --build-arg NETWORK=btc --build-arg $CACHE_DATE
docker build -t kinesis_lnd_ltc ./docker/lnd --build-arg NETWORK=ltc --build-arg $CACHE_DATE
docker build -t kinesis_ltcd ./docker/ltcd
docker build -t kinesis_btcd ./docker/btcd
