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

Then add the following commands to your `package.json`:

```
    "lup": "npm explore lnd-engine -- docker-compose -p $npm_package_config_project_name up -d",
    "ld": "npm explore lnd-engine -- docker-compose -p $npm_package_config_project_name down -v",
    "lps": "npm explore lnd-engine -- docker-compose -p $npm_package_config_project_name ps"
```

NOTE: If you are trying to use `lnd-engine` locally, you may need to blow away your projects `npm-shrinkwrap` file to avoid caching of the incorrect repo.

#### Getting Started

```
npm i
npm test
```

You can access the repl through `docker-compose run repl npm run c` and view all available commands with `commands`
