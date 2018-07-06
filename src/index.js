const actions = require('./engine-actions')
const { generateLndClient } = require('./lnd-setup')
const LND_PROTO_FILE_PATH = require.resolve('../proto/lnd-rpc.proto')

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
    if (!host) {
      throw new Error('Host is required for lnd-engine initialization')
    }

    this.host = host
    this.logger = logger || console
    // TODO: Remove defaults for tls/macaroon path and change signature of lnd-engine constructor
    // to reflect that they are required. The default values might be useless now that
    // we support multiple chains for lnd
    this.tlsCertPath = tlsCertPath || TLS_CERT_PATH
    this.macaroonPath = macaroonPath || MACAROON_PATH
    this.protoPath = LND_PROTO_FILE_PATH

    this.client = generateLndClient(this.host, this.protoPath, this.tlsCertPath, this.macaroonPath)

    Object.assign(this, actions)
  }
}

module.exports = LndEngine
