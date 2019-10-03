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
   * @param {number} [options.finalHopTimeLock] - value of property on engine
   *   that suggests a time lock to use on time locks for the final hop of a
   *   payment
   * @param {number} [options.retrieveWindowDuration] - value of property on
   *   engine corresponding to the max expected time it might take to retrieve a
   *   preimage, to be used to calculate the forwarding delta
   * @param {number} [options.claimWindowDuration] - value of property on
   *   engine corresponding the max expected time it might take to publish
   *   a claim for a payment on the blockchain using a preimage, to be used to
   *   calculate the forwarding delta
   */
  constructor (host, symbol, { logger = console, tlsCertPath, macaroonPath,
    minVersion, finalHopTimeLock, retrieveWindowDuration, claimWindowDuration } = {}) {
    if (!host) {
      throw new Error('Host is required for lnd-engine initialization')
    }

    this.CHANNEL_ROUNDING = CHANNEL_ROUNDING
    this.host = host
    this.symbol = symbol
    this.minVersion = minVersion
    this.currencyConfig = currencies.find(({ symbol }) => symbol === this.symbol)
    this.secondsPerBlock = 600 // can be overridden by config.json setting

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

    // ~9 blocks, from BOLT #2
    // see https://github.com/lightningnetwork/lightning-rfc/blob/master/
    //     02-peer-protocol.md#cltv_expiry_delta-selection
    this.finalHopTimeLock = finalHopTimeLock || 9 * this.secondsPerBlock

    // based on a forward time lock delta of 40 blocks from LND
    // see https://github.com/lightningnetwork/lnd/pull/2759
    this.retrieveWindowDuration = retrieveWindowDuration || 6000
    this.claimWindowDuration = claimWindowDuration || 30 * this.secondsPerBlock

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
}

LndEngine.STATUSES = ENGINE_STATUSES
LndEngine.CHANNEL_ROUNDING = CHANNEL_ROUNDING
LndEngine.ERRORS = errors

module.exports = LndEngine
