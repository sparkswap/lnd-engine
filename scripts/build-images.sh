#!/usr/bin/env bash

set -e -u

# NOTE: The names specified with `-t` directly map to the service names in
# the applicable services docker-compose file
docker build -t kinesis_lnd ./docker/lnd
docker build -t kinesis_ltcd ./docker/ltcd
docker build -t kinesis_btcd ./docker/btcd
