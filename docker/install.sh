#!/usr/bin/env bash

##########################################
#
# This file contains the steps necessary to install an LND Engine
#
##########################################

set -e

echo ""
echo "It's time to get all setup and stuff!"
echo ""

if [ -z ${ROOT_DIR+x} ]; then
  echo "Please set a ROOT_DIR for the install script to run"
fi

NPM_DIR=$ROOT_DIR/node_modules/lnd-engine/docker

echo "Cleaning directories and recreating lnd-engine"

# Clean the lnd-engine dir and recreate it
rm -rf $ROOT_DIR/docker/lnd-engine
mkdir -p $ROOT_DIR/docker/lnd-engine

# Copy all files from LND Engine to docker
cp -rf $NPM_DIR/* $ROOT_DIR/docker/lnd-engine

# Steps for success:
# - down all containers
# - build images
# - up all containers for the broker
echo "Downing all lnd-engine containers"
(cd $ROOT_DIR/docker/lnd-engine && docker-compose down)

echo "Building all lnd-engine containers"
(cd $ROOT_DIR/docker/lnd-engine && docker-compose build --force-rmk)

