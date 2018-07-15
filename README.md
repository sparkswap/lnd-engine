# Kinesis LND Engine

<img src="https://kines.is/logo.png" alt="Kinesis Exchange" width="550">

[![CircleCI](https://circleci.com/gh/kinesis-exchange/lnd-engine.svg?style=svg&circle-token=47c81b3a717f062885f159dfded078e134413db1)](https://circleci.com/gh/kinesis-exchange/lnd-engine)

The following repo contains 2 modules that make up a `Kinesis Engine`:

1. NPM module w/ LND abstraction layer (located in `src`)
2. Dockerfiles for all containers needed for the LND Engine

A current docker setup for the Kinesis exchange may look like:
1. BTCD node
2. LND BTCD node (kinesis-exchange fork)
3. LTCD node
4. LND LTCD node (kinesis-exchange fork)

#### Installation (lnd-engine only)

The following commands will install dependencies, import proto files and run tests on the
lnd-engine codebase. These steps do not build the docker images associated with the lnd-engine.

```
npm i
npm run build
npm test
```

#### Installation w/ Docker

The lnd-engine docker files make use of Docker's image storage. Run the `npm run build-images` command to
update all docker images on your local docker installation.

#### Using the docker files in your personal project

After you have built all images on your local system, you can then use the provided `docker-compose.btc.example.yml` or
`docker-compose.ltc.example.yml` files in your project.

#### Library Usage

```
const LndEngine = require('lnd-engine')
const engine = new LndEngine(LND_HOST, engineOptions)

engine.getTotalBalance.... etc...
```

# JS API

```
getTotalBalance()
getUnconfirmedBalance()
getConfirmedBalanace()
getUncommittedBalance()
getCommittedBalance()
getPublicKey()
getInvoiceValue(requestHash)
getTotalChannelBalance())
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
