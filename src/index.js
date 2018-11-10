const path = require('path')

const { currencies } = require('./config')
const {
  generateLightningClient,
  generateWalletUnlockerClient
} = require('./lnd-setup')
const actions = require('./engine-actions')

/**
 * @constant
 * @type {Number}
 * @default
 */
const LND_PROTO_FILE_PATH = path.resolve(__dirname, '..', 'proto', 'lnd-rpc.proto')

/**
 * The public interface for interaction with an LND instance
 */
class LndEngine {
  /**
   * LndEngine Constructor
   *
   * @class
   * @param {String} host - host grpc address
   * @param {String} symbol Common symbol of the currency this engine supports (e.g. `BTC`)
   * @param {Object} options
   * @param {Logger} [options.logger=console] - logger used by the engine
   * @param {String} options.tlsCertPath - file path to the TLS certificate for LND
   * @param {String} options.macaroonPath - file path to the macaroon file for LND
   */
  constructor (host, symbol, { logger = console, tlsCertPath, macaroonPath } = {}) {
    if (!host) {
      throw new Error('Host is required for lnd-engine initialization')
    }

    this.host = host
    this.symbol = symbol
    this.currencyConfig = currencies.find(({ symbol }) => symbol === this.symbol)

    if (!this.currencyConfig) {
      throw new Error(`${symbol} is not a valid symbol for this engine.`)
    }

    this.logger = logger
    this.tlsCertPath = tlsCertPath
    this.macaroonPath = macaroonPath
    this.protoPath = LND_PROTO_FILE_PATH

    this.client = generateLightningClient(this)
    this.walletUnlocker = generateWalletUnlockerClient(this)

    Object.assign(this, actions)
  }
}

module.exports = LndEngine
