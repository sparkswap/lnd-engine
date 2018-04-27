const grpc = require('grpc')
const { readFileSync } = require('fs')

// ex: /secure/tls.cert
// ex: /secure/admin.macaroon
const { TLS_CERT_PATH, LND_MACAROON_PATH } = process.env

// Check that these files exist or exit
// Make sure the paths are setup correctly for testing

async function generateCredentials () {
  // Create auth credentials w/ macaroon (decentralized token bearer specific to LND) and
  // w/ use of lnd ssl cert
  const macaroonCreds = grpc.credentials.createFromMetadataGenerator((_args, callback) => {
    const macaroon = readFileSync(LND_MACAROON_PATH)
    const metadata = new grpc.Metadata()
    metadata.add('macaroon', macaroon.toString('hex'))
    callback(null, metadata)
  })

  const lndCert = readFileSync(TLS_CERT_PATH)
  const sslCreds = grpc.credentials.createSsl(lndCert)
  const credentials = grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds)

  return credentials
}

module.exports = {
  generateCredentials
}
