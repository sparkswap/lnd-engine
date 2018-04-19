# Kinesis LND Engine

Kinesis engine for LND

### Description


#### Before you begin

You must have docker installed. For all applications in Kinesis, it is possible to run these applications standalone
on MacOS or Ubuntu, but it is not recommeneded.

NOTE: We keep the `docker-compose` file at the root of the directory so that all container names are prefixed with `lnd-engine` unless specified by another application.

### Getting Started

Provided below is a quick-n-dirty guide on how to get started with BTC/LND so we can use the Kinesis Broker. In order for the Kinesis CLI and Kinesis Daemon to be fully functional, the following containers must be running:

- rousabeef/BTCD - Headless daemon to interact with blockchain (no wallet in this package)
- LND - Lightning Network Daemon + Wallet

These containers are what make up the `LND-Engine` which is what the Kinesis Broker AND Kinesis Relayer rely on for LND communication.`

The guide below will run you through the steps of setup for LND and funding a wallet on a network. This is a bare minimum to get started on the Kinesis exchange.

We need to setup your LND/BTC wallet.

Our example we will use BTC and simnet.

Run the following commands to build some LND containers:

Once the images are built we can `up` the containers by running:

From this point forward, whenever we want to check on the status of containers, or run commands against them, we will need to `cd` in to the appropriate directory (either `docker` or `docker-user`). Docker-compose will only work when there is a docker-compose file at the root of your `pwd` OR if you specify the directory by using `docker-compose -f my/fake/directory/docker-compose.yml`. It is easier if we simply change directories.

#### Goals

1. Using docker we will start BTC and LND
2. We will fund the account
    - Fake funding through simnet
    - Funding through a faucet on testnet

#### Funding your account

Once the LND/BTC containers are up, lets log into the LND container and create a new wallet

The broker will take the following information:

1. Wallet
2. Relayer address
3. Node address

### Authentication

Authentication for LND happens on the server side. We will generate a client cert (tls.cert) and a private server key (tls.key). Only the LND_BTC instance needs to know about both keys.

Our clients/servers will then use the tls.key + a macaroon to make requests to all LND instances. All services will have some form of TLS/SSL for client/server communication.

NOTE: Specifically w/ LND, macaroon auth will fail if the db/macaroons are not created at the same time, so we need to wipe out the macaroons in the /secure/ folder before each new run.
