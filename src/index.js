const actions = require('./engine-actions')
const { generateLndClient } = require('./lnd-setup')
const LND_PROTO_FILE_PATH = require.resolve('../proto/lnd-rpc.proto')

/**
 * @constant
 * @type {Array<string>}
 * @default
 */
const SUPPORTED_CURRENCIES = Object.freeze({
  LTC: 'LTC',
  BTC: 'BTC'
})

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
  constructor (host, currency, { logger, tlsCertPath, macaroonPath } = {}) {
    if (!host) throw new Error('Host is required for lnd-engine initialization')
    if (!currency) throw new Error('Currency is required for lnd-engine initialization')
    if (!Object.values(SUPPORTED_CURRENCIES).includes(currency)) throw new Error(`lnd-engine does not support currency: ${currency}`)

    this.host = host
    this.currency = currency
    this.logger = logger || console

    // TODO: Remove defaults for tls/macaroon path and change signature of lnd-engine constructor
    // to reflect that they are required. The default values might be useless now that
    // we support multiple chains for lnd
    this.tlsCertPath = tlsCertPath || TLS_CERT_PATH
    this.macaroonPath = macaroonPath || MACAROON_PATH
    this.protoPath = LND_PROTO_FILE_PATH

    this.client = generateLndClient(this.host, this.protoPath, this.tlsCertPath, this.macaroonPath)

    Object.assign(this, actions)

    this.initialize()
      .then(() => {
        logger.info(`lnd-engine is initialized: ${host} for currency ${currency}`)
      })
      .catch(logger.error)
  }

  async initialize () {
    const { chains = [] } = await actions.getInfo({ client: this.client })

    if (Array.isArray(chains) && !chains.length) {
      throw new Error('lnd-engine initialization chain information does not exist')
    }

    if (!chains.includes(this.currency)) {
      throw new Error(`Host only supports ${chains.join(', ')} currency types. Received ${this.currency}.`)
    }
  }

  /**
   * @return {Object} key, value of currencies supported by lnd
   */
  static types () {
    return SUPPORTED_CURRENCIES
  }
}

module.exports = LndEngine
