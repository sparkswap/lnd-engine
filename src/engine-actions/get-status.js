const grpc = require('grpc')
const compareVersions = require('compare-versions')

const { ENGINE_STATUSES } = require('../constants')
const {
  getInfo,
  genSeed
} = require('../lnd-actions')
const {
  generateLightningClient,
  generateWalletUnlockerClient
} = require('../lnd-setup')

/**
 * Error message that is returned from LND to let us identify if a wallet exists
 * on the current LND instance when using `genSeed`.
 *
 * @see {@link https://github.com/lightningnetwork/lnd/blob/master/walletunlocker/service.go}
 * @constant
 * @type {string}
 * @default
 */
const WALLET_EXISTS_ERROR_MESSAGE = 'wallet already exists'

/**
 * Returns the state of the current lnd-engine.
 * @see {LndEngine#ENGINE_STATUS}
 * @returns {Promise<string>} status - ENGINE_STATUS
 */
async function getStatusInternal () {
  // Make a call to getInfo to see if lnrpc is up on the current engine. If
  // this calls returns successful, then we will attempt to validate the node config.
  try {
    const info = await getInfo({ client: this.client })

    // We validate an engines configuration here and return either an UNLOCKED
    // or VALIDATED status if the code doesn't error out
    const { chains = [], syncedToChain } = info

    if (chains.length === 0) {
      this.logger.error('LND has no chains configured.')
      return ENGINE_STATUSES.UNLOCKED
    }

    if (chains.length > 1) {
      this.logger.error(`LndEngine cannot support an LND instance with more than one active chain. Found: ${chains}`)
      return ENGINE_STATUSES.UNLOCKED
    }

    const { chain: chainName } = chains[0]

    if (chainName !== this.chainName) {
      this.logger.error(`Mismatched configuration: Engine is configured for ${this.chainName}, LND is configured for ${chainName}.`)
      return ENGINE_STATUSES.UNLOCKED
    }

    if (!syncedToChain) {
      this.logger.error(`Wallet is not yet synced to the main chain`)
      return ENGINE_STATUSES.NOT_SYNCED
    }

    const version = info.version.split(' ')[0]
    if (this.minVersion && compareVersions(version, this.minVersion) < 0) {
      this.logger.error(`LND version is too old: ${version} < ${this.minVersion}`)
      return ENGINE_STATUSES.OLD_VERSION
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

/**
 * Sets the engine status and returns the state of the current lnd-engine.
 * @see {LndEngine#ENGINE_STATUS}
 * @returns {Promise<string>} status - ENGINE_STATUS
 */
async function getStatus () {
  const { LOCKED, NEEDS_WALLET } = ENGINE_STATUSES
  if (this.status === LOCKED || this.status === NEEDS_WALLET) {
    // LND gets stuck in the LOCKED state due to the way the grpc library works
    // regenerating the lightning client and wallet unlocker is a workaround
    // see: https://github.com/grpc/grpc-node/issues/993
    this.client.close()
    this.walletUnlocker.close()
    this.client = generateLightningClient(this)
    this.walletUnlocker = generateWalletUnlockerClient(this)
  }
  this.status = await getStatusInternal.call(this)
  return this.status
}

module.exports = getStatus
