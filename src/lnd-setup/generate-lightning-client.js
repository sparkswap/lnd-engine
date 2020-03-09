
/**
 * Lnd Lightning Client Module
 * @module src/lnd-setup/generate-lightning0-client
 */

const grpc = require('grpc')
const loadProto = require('../utils/load-proto')
const fs = require('fs')
const { ENGINE_STATUSES } = require('../constants')

/** @typedef {import('.').LndClient} LndClient */
/** @typedef {import('..').Logger} Logger */

/**
 * Array of lnd proto files to load to generate lightning client
 * @type {ReadonlyArray<string>}
 */
const PROTO_FILES = Object.freeze([
  'rpc.proto',
  'invoicesrpc/invoices.proto',
  'routerrpc/router.proto'
])

/**
 * Generates a lnrpc.Lightning client which allows full functionality of the LND node
 *
 * @function
 * @param {object} engine
 * @param {string} engine.host
 * @param {string} engine.protoPath
 * @param {string} engine.tlsCertPath
 * @param {string} engine.macaroonPath
 * @param {string} engine.status
 * @param {Logger} engine.logger
 * @returns {LndClient} lnrpc Lightning client definition
 */
function generateLightningClient ({ host, protoPath, tlsCertPath, macaroonPath, status, logger }) {
  const { lnrpc, invoicesrpc, routerrpc } = loadProto(protoPath, PROTO_FILES)

  const macaroonExists = fs.existsSync(macaroonPath)

  // We require all communication to be done via TLS, if there is no cert available,
  // we will throw
  if (!fs.existsSync(tlsCertPath)) {
    throw new Error(`LND-ENGINE error - tls cert file not found at path: ${tlsCertPath}`)
  }

  const tls = fs.readFileSync(tlsCertPath)

  let rpcCredentials

  // We do not require a macaroon to be available to use the lnd-engine, as the user
  // may have used the configuration `--no-macaroons` for testing.
  //
  // A macaroon will not be created if:
  // 1. An LND wallet hasn't been initialized (NEEDS_WALLET or UNKNOWN): expected
  // 2. The daemon/docker has messed up: unexpected
  const showMacaroonWarn = ![ ENGINE_STATUSES.UNKNOWN, ENGINE_STATUSES.NEEDS_WALLET ].includes(status)

  if (!macaroonExists) {
    if (showMacaroonWarn) {
      logger.warn(`LND-ENGINE warning - macaroon not found at path: ${macaroonPath}`)
    }
    rpcCredentials = grpc.credentials.createSsl(tls)
  } else {
    const macaroon = fs.readFileSync(macaroonPath)
    const metadata = new grpc.Metadata()
    metadata.add('macaroon', macaroon.toString('hex'))
    const macaroonCredentials = grpc.credentials.createFromMetadataGenerator((_, cb) => cb(null, metadata))

    const sslCredentials = grpc.credentials.createSsl(tls)
    rpcCredentials = grpc.credentials.combineChannelCredentials(sslCredentials, macaroonCredentials)
  }

  const interceptors = [
    (options, nextCall) => {
      console.log('Called LND at ${new Date()}')
      return new grpc.InterceptingCall(nextCall(options))
    }
  ]

  const client = new lnrpc.Lightning(host, rpcCredentials, { interceptors })
  client.invoices = new invoicesrpc.Invoices(host, rpcCredentials, { interceptors })
  client.router = new routerrpc.Router(host, rpcCredentials, { interceptors })
  return client
}

module.exports = generateLightningClient
