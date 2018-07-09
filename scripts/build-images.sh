#!/usr/bin/env bash

set -e -u

# NOTE: The names specified with `-t` directly map to the service names in
# the applicable services docker-compose file
docker build -t kinesis_lnd_btc ./docker/lnd --build-arg NETWORK=btc
docker build -t kinesis_lnd_ltc ./docker/lnd --build-arg NETWORK=ltc
docker build -t kinesis_ltcd ./docker/ltcd
docker build -t kinesis_btcd ./docker/btcd
