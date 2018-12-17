const { currencies } = require('./config')
const {
  generateLightningClient,
  generateWalletUnlockerClient
} = require('./lnd-setup')
const {
  validationDependentActions,
  validationIndependentActions,
  isNodeConfigValid
} = require('./engine-actions')
const {
  exponentialBackoff,
  ENGINE_STATUS
} = require('./utils')

/**
 * @constant
 * @type {String}
 * @default
 */
const LND_PROTO_FILE_PATH = require.resolve('../proto/lnd-rpc.proto')

/**
 * The public interface for interaction with an LND instance
 */
class LndEngine {
  /**
   * LndEngine Constructor
   *
   * @class
   * @param {String} host - host gRPC address
   * @param {String} symbol Common symbol of the currency this engine supports (e.g. `BTC`)
   * @param {Object} [options={}]
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
    this.statuses = ENGINE_STATUS

    // Default status of the lnd-engine is unknown as we have not ran any validations
    // up to this point
    this.status = ENGINE_STATUS.UNKNOWN

    // We wrap all validation dependent actions in a callback so we can prevent
    // their use if the current engine is in a state that prevents a call from
    // functioning correctly.
    Object.entries(validationDependentActions).forEach(([name, action]) => {
      this[name] = (...args) => {
        if (!this.available) throw new Error(`${symbol} Engine is not available`)
        if (!this.unlocked) throw new Error(`${symbol} Engine is locked`)
        if (!this.validated) throw new Error(`${symbol} Engine is not validated`)
        return action.call(this, ...args)
      }
    })

    Object.entries(validationIndependentActions).forEach(([name, action]) => {
      this[name] = action
    })
  }

  get available () {
    return (
      this.status !== ENGINE_STATUS.UNKNOWN ||
      this.status !== ENGINE_STATUS.UNAVAILABLE
    )
  }

  get unlocked () {
    return (this.status === ENGINE_STATUS.UNLOCKED)
  }

  get validated () {
    return (this.status === ENGINE_STATUS.VALIDATED)
  }

  /**
   * Validates and sets the current state of an engine
   *
   * @returns {void}
   */
  async validateEngine () {
    try {
      const payload = { symbol: this.symbol }
      const validationCall = async () => {
        // A macaroon file for lnd will only exist if lnrpc (Lightning RPC) has been started
        // on LND. Since an engine can become unlocked during any validation call, we
        // need to ensure that we are updating LndEngine's client in the situation that
        // a macaroon file becomes available (meaning an engine has been unlocked).
        this.client = generateLightningClient(this)

        // Returns a status `ENGINE_STATUS`
        this.status = await this.getStatus()

        if (!this.available) {
          throw new Error('Engine is not available')
        }

        if (!this.unlocked) {
          throw new Error('Engine is locked')
        }

        if (!this.validated) {
          throw new Error('Engine failed to validate. Retrying')
        }
      }

      // It can take an extended period time for the engines to be ready, due to blockchain
      // syncing or setup, so we use exponential backoff to retry validation until
      // it is either successful or there is something wrong.
      await exponentialBackoff(validationCall, payload, { logger: this.logger })
    } catch (e) {
      return this.logger.error(`Failed to validate engine for ${this.symbol}, error: ${e}`, { error: e })
    }

    this.logger.info(`Validated engine configuration for ${this.symbol}`)
  }
}

module.exports = LndEngine
