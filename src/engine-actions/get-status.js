const grpc = require('grpc')

const { ENGINE_STATUSES } = require('../constants')
const {
  getInfo,
  genSeed
} = require('../lnd-actions')

/**
 * Error message that is returned from LND to let us identify if a wallet exists
 * on the current LND instance when using `genSeed`.
 *
 * @see {@link https://github.com/lightningnetwork/lnd/blob/master/walletunlocker/service.go}
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
async function getStatus () {
  // Make a call to getInfo to see if lnrpc is up on the current engine. If
  // this calls returns successful, then we will attempt to validate the node config.
  try {
    const info = await getInfo({ client: this.client })

    // We validate an engines configuration here and return either an UNLOCKED
    // or VALIDATED status if the code doesn't error out
    const { chains = [] } = info

    if (chains.length === 0) {
      this.logger.error('LND has no chains configured.')
      return ENGINE_STATUSES.UNLOCKED
    }

    if (chains.length > 1) {
      this.logger.error(`LndEngine cannot support an LND instance with more than one active chain. Found: ${chains}`)
      return ENGINE_STATUSES.UNLOCKED
    }

    const [ chainName ] = chains

    if (chainName !== this.currencyConfig.chainName) {
      this.logger.error(`Mismatched configuration: Engine is configured for ${this.currencyConfig.chainName}, LND is configured for ${chainName}.`)
      return ENGINE_STATUSES.UNLOCKED
    }

    return ENGINE_STATUSES.VALIDATED
  } catch (e) {
    // If we received an error from the `getInfo` call above, then we want to check
    // the error status. If the error status is anything but UNIMPLEMENTED, we can
    // assume that the node is unavailable.
    //
    // UNIMPLEMENTED should only occur when the lnrpc has not started on the
    // engine's lnd instance
    if (e.code !== grpc.status.UNIMPLEMENTED) {
      this.logger.error('LndEngine failed to call getInfo', { error: e.message })
      return ENGINE_STATUSES.UNAVAILABLE
    }

    // If the error code IS unimplemented, then we call `genSeed` and make
    // a determination if the wallet is locked or needs to be created.
    try {
      await genSeed({ client: this.walletUnlocker })
      return ENGINE_STATUSES.NEEDS_WALLET
    } catch (e) {
      if (e.message && e.message.includes(WALLET_EXISTS_ERROR_MESSAGE)) {
        return ENGINE_STATUSES.LOCKED
      }

      this.logger.error('LndEngine failed to call genSeed', { error: e.message })
      return ENGINE_STATUSES.UNAVAILABLE
    }
  }
}

module.exports = getStatus
