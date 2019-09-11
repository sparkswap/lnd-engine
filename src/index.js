const path = require('path')
const { currencies } = require('./config.json')
const {
  ENGINE_STATUSES,
  CHANNEL_ROUNDING
} = require('./constants')
const {
  validationDependentActions,
  unlockedDependentActions,
  validationIndependentActions,
  errors
} = require('./engine-actions')
const {
  generateLightningClient,
  generateWalletUnlockerClient
} = require('./lnd-setup')
const {
  retry
} = require('./utils')

/**
 * @constant
 * @type {string}
 * @default
 */
const LND_PROTO_PATH = path.resolve(__dirname, '../proto/')

/**
 * Config properties that should be exposed directly on the engine
 * @constant
 * @type {Array<string>}
 */
const PUBLIC_CONFIG = [
  'chainName',
  'quantumsPerCommon',
  'secondsPerBlock',
  'feeEstimate',
  'maxChannelBalance',
  'minChannelBalance',
  'maxPaymentSize'
]

/** @typedef {object} Logger */
/** @typedef {object} Engine */

/**
 * The public interface for interaction with an LND instance
 */
class LndEngine {
  /**
   * LndEngine Constructor
   *
   * @class
   * @param {string} host - host gRPC address
   * @param {string} symbol - Common symbol of the currency this engine supports (e.g. `BTC`)
   * @param {object} [options={}]
   * @param {Logger} [options.logger=console] - logger used by the engine
   * @param {string} [options.tlsCertPath] - file path to the TLS certificate for LND
   * @param {string} [options.macaroonPath] - file path to the macaroon file for LND
   * @param {string} [options.minVersion] - minimum LND version required
   */
  constructor (host, symbol, { logger = console, tlsCertPath, macaroonPath, minVersion } = {}) {
    if (!host) {
      throw new Error('Host is required for lnd-engine initialization')
    }

    this.CHANNEL_ROUNDING = CHANNEL_ROUNDING
    this.host = host
    this.symbol = symbol
    this.minVersion = minVersion
    this.currencyConfig = currencies.find(({ symbol }) => symbol === this.symbol)

    if (!this.currencyConfig) {
      throw new Error(`${symbol} is not a valid symbol for this engine.`)
    }

    // Expose config publicly that we expect to be used by consumers
    PUBLIC_CONFIG.forEach((configKey) => {
      if (this.currencyConfig && !this.currencyConfig.hasOwnProperty(configKey)) {
        throw new Error(`Currency config for ${this.symbol} is missing for '${configKey}'`)
      }
      // @ts-ignore
      this[configKey] = this.currencyConfig[configKey]
    })

    // Default status of the lnd-engine is unknown as we have not run any validations
    // up to this point. We need to define this BEFORE generating the Lightning client
    // to suppress invalid macaroon warnings.
    this.status = ENGINE_STATUSES.UNKNOWN

    this.logger = logger
    this.tlsCertPath = tlsCertPath
    this.macaroonPath = macaroonPath
    this.protoPath = LND_PROTO_PATH
    this.client = generateLightningClient(this)
    this.walletUnlocker = generateWalletUnlockerClient(this)

    // We wrap all validation dependent actions in a callback so we can prevent
    // their use if the current engine is in a state that prevents a call from
    // functioning correctly.
    Object.entries(validationDependentActions).forEach(([name, action]) => {
      this[name] = (...args) => {
        if (!this.validated) {
          throw new Error(`${symbol} Engine is not validated. Engine Status: ${this.status}`)
        }

        return action.call(this, ...args)
      }
    })

    Object.entries(unlockedDependentActions).forEach(([name, action]) => {
      this[name] = (...args) => {
        if (!this.isUnlocked) {
          throw new Error(`${symbol} Engine is not available and unlocked. ` +
            `Engine Status: ${this.status}`)
        }

        return action.call(this, ...args)
      }
    })

    Object.entries(validationIndependentActions).forEach(([name, action]) => {
      this[name] = action.bind(this)
    })
  }

  get validated () {
    return (this.status === ENGINE_STATUSES.VALIDATED)
  }

  get isUnlocked () {
    // note that we don't include the UNLOCKED state because it means that
    // there is a configuration problem
    const { NOT_SYNCED, VALIDATED } = ENGINE_STATUSES
    return (this.status === NOT_SYNCED || this.status === VALIDATED)
  }

  get isLocked () {
    return (this.status === ENGINE_STATUSES.LOCKED)
  }

  /**
   * Validates and sets the current state of an engine
   *
   * @returns {Promise<void>}
   */
  async validateEngine () {
    const payload = { symbol: this.symbol }
    const logger = this.logger
    const validationCall = async () => {
      // A macaroon file for lnd will only exist if lnrpc (Lightning RPC) has been started
      // on LND. Since an engine can become unlocked during any validation call, we
      // need to ensure that we are updating LndEngine's client in the situation that
      // a macaroon file becomes available (meaning an engine has been unlocked).
      if (this.client) {
        this.client.close()
      }
      this.client = generateLightningClient(this)

      // Returns a status `ENGINE_STATUS`
      // @ts-ignore
      this.status = await this.getStatus()

      if (!this.validated) {
        throw new Error(`Engine failed to validate. Current status: ${this.status}`)
      }
    }

    // It can take an extended period time for the engines to be ready, due to blockchain
    // syncing or setup, so we use `retry` to retry validation until
    // it is successful
    await retry(validationCall, payload, { debugName: 'validateEngine', logger })

    logger.info(`Validated engine configuration for ${this.symbol}`)
  }
}

LndEngine.STATUSES = ENGINE_STATUSES
LndEngine.CHANNEL_ROUNDING = CHANNEL_ROUNDING
LndEngine.ERRORS = errors

module.exports = LndEngine
