const actions = require('./lnd-actions')
const { generateLndClient } = require('./lnd-setup')
const LND_PROTO_FILE_PATH = require.resolve('../proto/lnd-rpc.proto')

// These values are currently set at build time in the LND Dockerfiles
/** @constant {string} @default */
const LND_HOST = 'lnd_btc:10009'
/** @constant {string} @default */
const TLS_CERT_PATH = '/shared/lnd-engine-tls.cert'
/** @constant {string} @default */
const MACAROON_PATH = '/shared/lnd-engine-admin.macaroon'

class LndEngine {
  /**
   * Create an LndEngine
   *
   * @param {String} LND host ip
   * @param {Object} options
   * @param {Logger} options.logger - defaults to console
   * @param {Logger} options.tlsCertPath - defaults to TLS_CERT_PATH
   * @param {Logger} options.macaroonPath - defaults to MACAROON_PATH
   */
  constructor (host, { logger, tlsCertPath, macaroonPath } = {}) {
    this.host = host || LND_HOST
    this.logger = logger || console
    this.tlsCertPath = tlsCertPath || TLS_CERT_PATH
    this.macaroonPath = macaroonPath || MACAROON_PATH
    this.protoPath = LND_PROTO_FILE_PATH

    this.client = generateLndClient(this.host, this.protoPath, this.tlsCertPath, this.macaroonPath)

    Object.assign(this, actions)
  }
}

module.exports = LndEngine
