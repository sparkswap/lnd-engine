const grpc = require('grpc')
const { readFileSync } = require('fs')

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
 */
function generateCredentials (tlsCertPath, macaroonPath) {
  if (!tlsCertPath) throw new Error('Engine Error: No tls cert path specified')
  if (!macaroonPath) throw new Error('Engine Error: No macaroon path specified')

  const tls = readFileSync(tlsCertPath)
  const macaroon = readFileSync(macaroonPath)

  const metadata = new grpc.Metadata().add('macaroon', macaroon.toString('hex'))

  const macaroonCredentials = grpc.credentials.createFromMetadataGenerator((_, cb) => cb(null, metadata))
  const sslCredentials = grpc.credentials.createSsl(tls)

  return grpc.credentials.combineChannelCredentials(sslCredentials, macaroonCredentials)
}

module.exports = {
  generateCredentials
}
