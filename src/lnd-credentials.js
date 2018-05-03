const grpc = require('grpc')
const fs = require('fs')

/**
 * Generates credentials for authentication to the LND rpc server
 *
 * @see https://github.com/lightningnetwork/lnd/blob/master/docs/macaroons.md
 * @param {String} tlsCertPath
 * @param {String} lndMacaroonPath
 */
function generateCredentials (tlsCertPath, macaroonPath) {
  if (!tlsCertPath) throw new Error('Engine Error: No tls cert path specified')
  if (!macaroonPath) throw new Error('Engine Error: No macaroon path specified')

  const tls = fs.readFileSync(tlsCertPath)
  const macaroon = fs.readFileSync(macaroonPath)

  const metadata = new grpc.Metadata()
  metadata.add('macaroon', macaroon.toString('hex'))

  const macaroonCredentials = grpc.credentials.createFromMetadataGenerator((_, cb) => cb(null, metadata))
  const sslCredentials = grpc.credentials.createSsl(tls)

  return grpc.credentials.combineChannelCredentials(sslCredentials, macaroonCredentials)
}

module.exports = {
  generateCredentials
}
