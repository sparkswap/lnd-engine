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
 * @constant
 * @type {String}
 * @default
 */
const WALLET_EXISTS_ERROR_MESSAGE = 'wallet already exists'

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
    // In gRPC, "unimplemented" indicates operation is not implemented or not
    // supported/enabled in this specific service. In our case, this means the
    // WalletUnlocker RPC has been turned off and the Lightning RPC is now functional
    if (e.code && e.code === UNIMPLEMENTED_SERVICE_CODE) {
      return true
    }

    // If an error has been received that states a wallet exists, then this means that
    // either the user has just created a wallet (and we are revalidating the engine) or
    // the user has just unlocked the engine successfully.
    //
    // Unfortunately we have to string match on the error, since the error code returned
    // is generic (code 2)
    if (e.message && e.message.includes(WALLET_EXISTS_ERROR_MESSAGE)) {
      return true
    }

    // Rethrow the error since the user will now need to troubleshoot the engine
    throw e
  }

  return false
}

module.exports = isEngineUnlocked
