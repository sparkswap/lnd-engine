const actions = require('./lnd-actions')
const { generateLndClient } = require('./lnd-setup')
const LND_PROTO_FILE_PATH = require.resolve('../proto/lnd-rpc.proto')

// These values are currently set at build time in the LND Dockerfiles
const LND_HOST = 'lnd_btc:10009'
const TLS_CERT_PATH = '/shared/lnd-engine-tls.cert'
const MACAROON_PATH = '/shared/lnd-engine-admin.macaroon'

/**
 * Constructor for creating an interface to an LND Engine.
 *
 * @params {String} LND host ip
 * @params {Object} options
 * @params {Logger} options.logger - defaults to console
 * @params {Logger} options.tlsCertPath - defaults to TLS_CERT_PATH
 * @params {Logger} options.macaroonPath - defaults to MACAROON_PATH
 */
class LndEngine {
  constructor (host, { logger, tlsCertPath, macaroonPath } = {}) {
    this.host = host || LND_HOST
    this.logger = logger || console
    this.tlsCertPath = tlsCertPath || TLS_CERT_PATH
    this.macaroonPath = macaroonPath || MACAROON_PATH
    this.protoPath = LND_PROTO_FILE_PATH

    this.client = generateLndClient(this.protoPath)

    Object.assign(this, actions)
  }
}

module.exports = LndEngine
