const grpc = require('grpc')

const {
  getInfo,
  genSeed
} = require('../lnd-actions')

/**
 * @constant
 * @type {String}
 * @default
 */
const WALLET_EXISTS_ERROR_MESSAGE = 'wallet already exists'

/**
 * Returns the state of the current lnd-engine.
 * @see {LndEngine#ENGINE_STATUS}
 * @returns {String} status - ENGINE_STATUS
 */
function getStatus () {
  return new Promise((resolve, reject) => {
    // Make a call to getInfo to see if lnrpc is up on the current engine. If
    // this calls returns successful, then we will attempt to validate the node config.
    getInfo({ client: this.client })
      // We validate an engines configuration here and return either an UNLOCKED
      // or VALIDATED status if the code doesn't error out
      .then(async (result) => {
        const { chains = [] } = result

        if (chains.length === 0) {
          this.logger.error('LND has no chains configured.')
          return resolve(this.statuses.UNLOCKED)
        }

        if (chains.length > 1) {
          this.logger.error(`LndEngine cannot support an LND instance with more than one active chain. Found: ${chains}`)
          return resolve(this.statuses.UNLOCKED)
        }

        const [ chainName ] = chains

        if (chainName !== this.currencyConfig.chainName) {
          this.logger.error(`Mismatched configuration: Engine is configured for ${this.currencyConfig.chainName}, LND is configured for ${chainName}.`)
          return resolve(this.statuses.UNLOCKED)
        }

        return resolve(this.statuses.VALIDATED)
      })
      // If we received an error from the `getInfo` call above, then we want to check
      // the error status. If the error status is anything but UNIMPLEMENTED, we can
      // assume that the node is unavailable.
      //
      // UNIMPLEMENTED should only occur when the lnrpc has not started on the
      // engine's lnd instance
      .catch((e) => {
        if (e.code !== grpc.status.UNIMPLEMENTED) {
          this.logger.error('LndEngine failed to call getInfo', { error: e.message })
          return resolve(this.statuses.UNAVAILABLE)
        }

        // If the error code IS unimplemented, then we call `genSeed` and make
        // a determination if the wallet is locked or needs to be created.
        genSeed({ client: this.walletUnlocker })
          .then(() => resolve(this.statuses.NEEDS_WALLET))
          .catch((e) => {
            if (e.message && e.message.includes(WALLET_EXISTS_ERROR_MESSAGE)) {
              return resolve(this.statuses.LOCKED)
            }

            this.logger.error('LndEngine failed to call genSeed', { error: e.message })
            return resolve(this.statuses.UNAVAILABLE)
          })
      })
  })
}

module.exports = getStatus
