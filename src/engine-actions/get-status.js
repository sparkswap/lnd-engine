const grpc = require('grpc')

const {
  getInfo,
  genSeed
} = require('../lnd-actions')

const { ENGINE_STATUS } = require('./utils')

/**
 * @constant
 * @type {String}
 * @default
 */
const WALLET_EXISTS_ERROR_MESSAGE = 'wallet already exists'

/**
 * Returns the state of the current lnd-engine.
 * @see {ENGINE_STATUS}
 * @returns {String} status - ENGINE_STATUS
 */
function getStatus () {
  return new Promise((resolve, reject) => {
    getInfo({ client: this.client })
      .then(async (result) => {
        const { chains = [] } = result

        if (chains.length === 0) {
          this.logger.error('LND has no chains configured.')
          return resolve(ENGINE_STATUS.UNLOCKED)
        }

        if (chains.length > 1) {
          this.logger.error(`LndEngine cannot support an LND instance with more than one active chain. Found: ${chains}`)
          return resolve(ENGINE_STATUS.UNLOCKED)
        }

        const [ chainName ] = chains

        if (chainName !== this.currencyConfig.chainName) {
          this.logger.error(`Mismatched configuration: Engine is configured for ${this.currencyConfig.chainName}, LND is configured for ${chainName}.`)
          return resolve(ENGINE_STATUS.UNLOCKED)
        }

        return resolve(ENGINE_STATUS.VALIDATED)
      })
      .catch((e) => {
        if (e.code !== grpc.status.UNIMPLEMENTED) {
          return resolve(ENGINE_STATUS.UNAVAILABLE)
        }

        genSeed({ client: this.walletUnlocker })
          .then(() => resolve(ENGINE_STATUS.NEEDS_WALLET))
          .catch((e) => {
            if (e.message && e.message.includes(WALLET_EXISTS_ERROR_MESSAGE)) {
              return resolve(ENGINE_STATUS.LOCKED)
            }

            return resolve(ENGINE_STATUS.UNAVAILABLE)
          })
      })
  })
}

module.exports = getStatus
