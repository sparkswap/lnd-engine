const {
  genSeed
} = require('../lnd-actions')

/**
 * CODE 12 for gRPC is equal to 'unimplemented'
 * @see https://github.com/grpc/grpc-go/blob/master/codes/codes.go
 * @constant
 * @type {Number}
 * @default
 */
const UNIMPLEMENTED_SERVICE_CODE = 12

/**
 * Rough estimate if the lnd instance's wallet is unlocked or not
 *
 * @private
 * @param {gRPC.Client} Lightning gRPC client
 * @return {Boolean} isEngineUnlocked
 */
async function isEngineUnlocked () {
  try {
    // If the call to `genSeed` succeeds, then we can assume that our LND instance
    // is locked, but functional
    await genSeed({ client: this.walletUnlocker })
  } catch (e) {
    this.logger.debug('Error received when checking for engine unlock')

    // In GRPC, "unimplemented" indicates operation is not implemented or not
    // supported/enabled in this specific service. In our case, this means the
    // WalletUnlocker RPC has been turned off and the Lightning RPC is now functional
    if (e.code && e.code === UNIMPLEMENTED_SERVICE_CODE) {
      return true
    }
  }

  // By default, we return false because it means the error was unrelated to the
  // response we were expecting. The user will need to check the underlying daemon,
  // but we can assume that the current engine is still locked w/ WalletLocker
  return false
}

module.exports = isEngineUnlocked
