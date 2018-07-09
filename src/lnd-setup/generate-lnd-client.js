/**
 * Lnd Client Module
 * @module src/lnd-setup/generate-lnd-client
 */

const grpc = require('grpc')
const fs = require('fs')

/**
 * @global
 * @constant
 * @type {String}
 * @default
 */
const GRPC_FILE_TYPE = 'proto'

/**
 * These service options are tied directly to the SSL certs that are generated for
 * the engines LND service.
 *
 * @global
 * @constant
 * @type {Object}
 * @default
 */
const GRPC_OPTIONS = {
  convertFieldsToCamelCase: true,
  binaryAsBase64: true,
  longsAsStrings: true
}

/**
 * Generates credentials for authentication to the LND rpc server
 *
 * @function
 * @private
 * @see https://github.com/lightningnetwork/lnd/blob/master/docs/macaroons.md
 * @param {String} tlsCertPath
 * @param {String} lndMacaroonPath
 * @return {grpc.credentials}
 */
function generateCredentials (tlsCertPath, macaroonPath) {
  if (!fs.existsSync(tlsCertPath)) throw new Error(`LND-ENGINE error - tls cert file not found at path: ${tlsCertPath}`)
  if (!fs.existsSync(macaroonPath)) throw new Error(`LND-ENGINE error - macaroon path not found at path: ${macaroonPath}`)

  const tls = fs.readFileSync(tlsCertPath)
  const macaroon = fs.readFileSync(macaroonPath)

  const metadata = new grpc.Metadata()
  metadata.add('macaroon', macaroon.toString('hex'))

  const macaroonCredentials = grpc.credentials.createFromMetadataGenerator((_, cb) => cb(null, metadata))
  const sslCredentials = grpc.credentials.createSsl(tls)

  return grpc.credentials.combineChannelCredentials(sslCredentials, macaroonCredentials)
}

/**
 * Generates a proto definition for a specified proto file path
 *
 * @function
 * @private
 * @param {String} path - lnd protofile path
 * @return {grpc.Object}
 * @throws {Error} proto file not found
 */
function loadProto (path) {
  if (!fs.existsSync(path)) throw new Error(`LND-ENGINE error - Proto file not found at path: ${path}`)

  return grpc.load(path, GRPC_FILE_TYPE, GRPC_OPTIONS)
}

/**
 *
 * Generates a proto definition for a specified proto file path
 *
 * @function
 * @param {String} host - lnd host address
 * @param {String} protoFilePath - lnd protobuf file path
 * @return {grpc.Client}
 */
function generateLndClient (host, protoPath, tlsCertPath, macaroonPath) {
  const { lnrpc } = loadProto(protoPath)
  const credentials = generateCredentials(tlsCertPath, macaroonPath)

  return new lnrpc.Lightning(host, credentials, {})
}

module.exports = generateLndClient
