# Kinesis LND Engine

<img src="https://kines.is/logo.png" alt="Kinesis Exchange" width="550">

[![CircleCI](https://circleci.com/gh/kinesis-exchange/lnd-engine.svg?style=svg&circle-token=47c81b3a717f062885f159dfded078e134413db1)](https://circleci.com/gh/kinesis-exchange/lnd-engine)

The following repo contains 2 modules that make up a `Kinesis Engine`:

1. NPM module w/ LND abstraction layer (located in `src`)
2. Dockerfiles for all containers needed for the LND Engine to work correctly

#### Installation via NPM

You must have ssh/private access to the lnd-engine to be able to download these files. Add the following reference to your `package.json`:

```
{
  "dependencies": {
    ...
    "lnd-engine": "kinesis-exchange/lnd-engine"
  }
}
```

Then you can use `extends` (Docker 2) to add the engine to your current docker stack:

```
lnd_btc:
  extends:
    file: ./node_modules/lnd-engine/docker-compose.yml
    service: lnd_btc

btcd:
  extends:
    file: ./node_modules/lnd-engine/docker-compose.yml
    service: btcd

lnd_repl:
  extends:
    file: ./node_modules/lnd-engine/docker-compose.yml
    service: repl
```

#### Getting Started

```
npm i
npm test
```

You can access the repl through `docker-compose run repl npm run c` and view all available commands with `commands`
