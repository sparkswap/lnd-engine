# Kinesis LND Engine

<img src="https://kines.is/logo.png" alt="Kinesis Exchange" width="550">

[![CircleCI](https://circleci.com/gh/kinesis-exchange/lnd-engine.svg?style=svg&circle-token=47c81b3a717f062885f159dfded078e134413db1)](https://circleci.com/gh/kinesis-exchange/lnd-engine)

The following repo contains 2 modules that make up a `Kinesis Engine`:

1. NPM module w/ LND abstraction layer (located in `src`)
2. Dockerfiles for all containers needed for the LND Engine to work correctly

Our current docker setup consists of the following containers:

- roasbeef/BTCD - Headless daemon to interact with blockchain (no wallet in this package)
- LND - Lightning Network Daemon + Wallet
- repl - an interactive shell for using the lnd-engine stack

#### Getting Started

```
npm i
npm run build
npm test
```

You can access the repl through `docker-compose run lnd_repl` and view all available commands with `commands`

#### Using the docker files in your personal project

In order to use the lnd-engine in your project, follow the steps below:

Copy the docker files from this repo and put them into a `docker` folder at the root of your project (this assumes that your `docker-compose` file is also at the root of your project directory. Then, add the following references to your `docker-compose` file.

NOTE: This code is ONLY supported in docker versions 2.x. Docker 3 does not support `extends` and is incompatible with the lnd-engine

```
# These services are imported from the lnd-engine
lnd_btc:
  build:
    context: ./docker
  depends_on:
    - btcd
  extends:
    file: ./docker/lnd-docker-compose.yml
    service: lnd_btc
  environment:
    # specify your public port
    - EXTERNAL_ADDRESS=docker.for.mac.host.internal:10111
  ports:
    # This is a public port
    - '10111:10111'

btcd:
  build:
    context: ./docker
  extends:
    file: ./docker/lnd-docker-compose.yml
    service: btcd
```

# API

```
getTotalBalance()
getUnconfirmedBalance()
getConfirmedBalanace()
getUncommittedBalance()
getCommittedBalance()
getPublicKey()
getInvoiceValue(requestHash)
getChannelBalances()
createNewAddress()
createSwapHash(orderId, amountInSatoshis)
createInvoice()
createChannel(host, publicKey, fundingAmount)
isAvailable()
isInvoicePaid()
isBalanceSufficient()
payInvoice(invoiceRequest)
prepareSwap(swapHash, inbound, outbound)
executeSwap(counterpartyPubKey, swapHash, inbound, outbound)
createRefundInvoice(paymentRequest)
```
