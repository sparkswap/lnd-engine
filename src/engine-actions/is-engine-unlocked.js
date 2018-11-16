const {
  genSeed
} = require('../lnd-actions')

/**
 * CODE 12 for gRPC is equal to 'unimplemented'
 *
 * @see https://github.com/grpc/grpc-go/blob/master/codes/codes.go
 * @constant
 * @type {Number}
 * @default
 */
const UNIMPLEMENTED_SERVICE_CODE = 12

/**
 * Rough estimate if the engine's node unlocked or not. Sets the `unlocked` flag
 * on an engine.
 *
 * States of the Engine:
 * - Locked - First-time use or engine requires a password to have access to funds
 * - Unlocked - engine is fully functional and ready to accept requests
 *
 * @function
 * @return {Boolean}
 */
async function isEngineUnlocked () {
  try {
    // If the call to `genSeed` succeeds, then we can assume that our LND instance
    // is locked, but functional
    await genSeed({ client: this.walletUnlocker })
  } catch (e) {
    // In GRPC, "unimplemented" indicates operation is not implemented or not
    // supported/enabled in this specific service. In our case, this means the
    // WalletUnlocker RPC has been turned off and the Lightning RPC is now functional
    if (e.code && e.code === UNIMPLEMENTED_SERVICE_CODE) {
      return true
    }

    // Rethrow the error since the user will now need to troubleshoot the engine
    throw e
  }

  return false
}

module.exports = isEngineUnlocked
