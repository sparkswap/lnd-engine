const { currencies } = require('./config')
const { validationDependentActions, validationIndependentActions } = require('./engine-actions')
const { generateLndClient } = require('./lnd-setup')
const LND_PROTO_FILE_PATH = require.resolve('../proto/lnd-rpc.proto')
const { exponentialBackoff } = require('./utils')

/**
 * Attempts to retry validating an engine
 *
 * @constant
 * @type {String}
 */
const EXPONENTIAL_BACKOFF_ATTEMPTS = 24

/**
 * Delay in each retry attempt to validating an engine
 *
 * @constant
 * @type {Integer} milliseconds
 */
const EXPONENTIAL_BACKOFF_DELAY = 5000

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
    this.client = generateLndClient(this.host, this.protoPath, this.tlsCertPath, this.macaroonPath)
    this.validated = false

    // We wrap all validation dependent actions in a callback so we can prevent
    // their use if the current engine is in an invalid state.
    //
    // States of the Engine:
    // 1. Locked
    //   - Typically happens during first-time use. No wallet is available on the engine instance
    //     so it must be created.
    // 2. Unlocked but invalid
    //   - we have created a wallet, but our configuration is messed up
    // 3. Unlocked and valid
    //   - the engine is ready to go
    //
    Object.entries(validationDependentActions).forEach(([name, action]) => {
      this[name] = (...args) => {
        if (!this.validated) throw new Error(`${symbol} Engine is not ready yet`)
        return action.call(this, ...args)
      }
    })

    Object.entries(validationIndependentActions).forEach(([name, action]) => {
      this[name] = action
    })

    this.validateEngine()
  }

  /**
   * Validates engine
   *
   * We do not await this function because we want the validations to run in the background.
   * It can take time for the engines to be ready, so we use exponential backoff to retry validation
   * for a period of time, until it is either successful or there is actually something wrong.
   * @returns {void}
   */
  async validateEngine () {
    try {
      const validation = () => this.validateNodeConfig()
      await exponentialBackoff(validation, EXPONENTIAL_BACKOFF_ATTEMPTS, EXPONENTIAL_BACKOFF_DELAY, { symbol: this.symbol })
    } catch (e) {
      return this.logger.error(`Failed to validate engine for ${this.symbol}, error: ${e}`)
    }

    this.logger.info(`Validated engine configuration for ${this.symbol}`)
  }
}

module.exports = LndEngine
