<img src="https://sparkswap.com/img/logo.svg" alt="sparkswap - sparkswap.com" width="400">

[![CircleCI](https://circleci.com/gh/sparkswap/lnd-engine.svg?style=svg&circle-token=47c81b3a717f062885f159dfded078e134413db1)](https://circleci.com/gh/sparkswap/lnd-engine)

Sparkswap LND Engine
====================

The following repo contains 2 modules that make up a Sparkswap Payment Channel Network Engine:

1. NPM module w/ LND abstraction layer (located in `src`)
2. Dockerfiles for all containers needed for the LND Engine to run on a broker daemon

A current docker setup a functional BTC/LTC LND Engine:
1. Bitcoin node (currently bitcoind)
2. LND BTC node (Sparkswap fork)
3. Litecoin node (currently litecoind)
4. LND LTC node (Sparkswap fork)

#### Installation (lnd-engine only)

The following commands will install dependencies, import associated proto files for
the lnd-engine codebase and will build all docker images

```
npm run build
```

Additionally, You can then use `npm run build-images` to build docker images separately.

To run tests, use `npm run test`

#### Installation w/ Docker

The lnd-engine docker files make use of Docker's internal image storage (to replicate the functionality of docker hub locally). Run the `npm run build-images` command to
update all docker images on your local docker installation.

#### Library Usage

```
const LndEngine = require('lnd-engine')

const engineOptions = {
  logger: ...,
  tlsCertPath: /absolute/path/to/tls/cert, // required
  macaroonPath: /absolute/path/to/macaroon, // required
}

const engine = new LndEngine('0.0.0.0:10009', 'BTC', engineOptions)

engine.getUncommittedBalance.... etc
```

# API

Documentation is up-to-date as of v0.2.0-alpha-release

**NOTE:** Please see detailed documentation at [sparkswap.com/docs/engines/lnd](https://sparkswap.com/docs/engines/lnd)

### Healthcheck

```
isAvailable
validateEngine
```

### Addresses

```
createNewAddress
getPaymentChannelNetworkAddress
getPublicKey
```

### Invoices

```
createInvoice
createRefundInvoice
getInvoiceValue
getInvoices
isInvoicePaid
payInvoice
```

### Cross-Chain Atomic Swaps

```
createSwapHash
executeSwap
getSettledSwapPreimage
prepareSwap
translateSwap
```

### Balances

```
getConfirmedBalance
getUncommittedBalance
getTotalChannelBalance
getUnconfirmedBalance
isBalanceSufficient
getTotalPendingChannelBalance
getUncommittedPendingBalance
getPendingChannelCapacities
getOpenChannelCapacities
getMaxChannel
```

### Channels

```
createChannel
numChannelsForAddress
closeChannels
```

### Wallets
```
withdrawFunds
```

## License

The Sparkswap LND Engine is licensed under the [MIT License](./LICENSE).
