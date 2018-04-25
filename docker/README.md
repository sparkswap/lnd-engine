## LND ENGINE DOCKER FILES

This directory contains all files needed to setup LND Engine w/ the kinesis exchange

#### Before you begin

You must have docker installed. For all applications in Kinesis, it is possible to run these applications standalone
on MacOS or Ubuntu, but it is not recommeneded.

### Getting Started

Provided below is a quick-n-dirty guide on how to get started with BTC/LND so we can use the Kinesis Broker. In order for the Kinesis CLI and Kinesis Daemon to be fully functional, the following containers must be running:

- rousabeef/BTCD - Headless daemon to interact with blockchain (no wallet in this package)
- LND - Lightning Network Daemon + Wallet

These containers are what make up the `LND-Engine` which is what the Kinesis Broker AND Kinesis Relayer rely on for LND communication.`
