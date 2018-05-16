const grpc = require('grpc')
const fs = require('fs')

const GRPC_FILE_TYPE = 'proto'

// These service options are tied directly to the SSL certs that are generated for
// the engines LND service.
//
// NOTE: This needs to be a mutable object because grpc will attempt to add
// default properties to it
const GRPC_OPTIONS = {
  convertFieldsToCamelCase: true,
  binaryAsBase64: true,
  longsAsStrings: true
}

// NOTE: This needs to be a mutable object because grpc will attempt to add
// default properties to it
const LND_CLIENT_OPTIONS = {
  'grpc.ssl_target_name_override': 'lnd_btc',
  'grpc.default_authority': 'lnd_btc'
}

/**
 * Generates credentials for authentication to the LND rpc server.
 *
 * The followig steps need to occur to generate the correct credentials for an LND instance:
 * 1. Read the LND public key
 * 2. Read the admin.macaroon (this is created in LND)
 * 3. Create grpc metadata w/ the macaroon
 * 4. Create grpc ssl credentials w/ public key
 * 5. combine metadata and ssl into channel credentials
 *
 * @see docker
 * @see https://github.com/lightningnetwork/lnd/blob/master/docs/macaroons.md
 * @param {String} tlsCertPath
 * @param {String} lndMacaroonPath
 * @throws {Error} tls cert path is not defined
 * @throws {Error} proto file not found
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
 * @param {String} path - lnd protofile path
 * @return {grpc#proto}
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
 * @param {String} host - lnd host address
 * @param {String} protoFilePath - lnd protobuf file path
 * @return {grpc#Client}
 */
function generateLndClient (host, protoPath, tlsCertPath, macaroonPath) {
  console.debug(`Generating proto for host: ${host}`)

  const { lnrpc } = loadProto(protoPath)
  const credentials = generateCredentials(tlsCertPath, macaroonPath)

  return new lnrpc.Lightning(host, credentials, LND_CLIENT_OPTIONS)
}

module.exports = generateLndClient
