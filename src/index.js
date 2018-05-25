const actions = require('./lnd-actions')
const { generateLndClient } = require('./lnd-setup')
const LND_PROTO_FILE_PATH = require.resolve('../proto/lnd-rpc.proto')

// These values are currently set at build time in the LND Dockerfiles
/**
 * @constant
 * @type {String}
 * @default
 */
const LND_HOST = 'lnd_btc:10009'

/**
 * @constant
 * @type {String}
 * @default
 */
const TLS_CERT_PATH = '/shared/lnd-engine-tls.cert'

/**
 * @constant
 * @type {String}
 * @default
 */
const MACAROON_PATH = '/shared/lnd-engine-admin.macaroon'

/**
 * The public interface for interaction with an LND instance
 */
class LndEngine {
  /**
   * LndEngine Constructor
   *
   * @class
   * @param {String} [host=LND_HOST] - host grpc address
   * @param {Object} options
   * @param {Logger} [options.logger=console] - defaults to console
   * @param {String|TLS_CERT_PATH} [options.tlsCertPath=TLS_CERT_PATH] - defaults to TLS_CERT_PATH
   * @param {String} [options.macaroonPath=MACAROON_PATH] options.macaroonPath - defaults to MACAROON_PATH
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
