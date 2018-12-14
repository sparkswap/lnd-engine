const { genSeed } = require('../lnd-actions')
const isAvailable = require('./is-available')

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
    // If the call to `genSeed` succeeds, then there are two possible states that
    // the engine could be in:
    //
    // 1. The engine is locked and the user needs to either create a wallet or unlock the wallet
    // 2. The engine has been unlocked during exponential backoff, in which case
    //    the WalletUnlocked RPC is still available
    await genSeed({ client: this.walletUnlocker })
  } catch (e) {
    // In gRPC, "unimplemented" indicates that an operation is not implemented or not
    // supported/enabled in this specific service. In our case, this means the
    // WalletUnlocker RPC has never been started and the Lightning RPC is functional
    //
    // This state typically happens when the relayer has been restarted (wallet already exists)
    // or when the engine is being used in development mode (noseedbackup)
    if (e.code && e.code === UNIMPLEMENTED_SERVICE_CODE) {
      return true
    }

    // If an error has been received that states a wallet exists, then this means that
    // either the user has just created a wallet (and we are re-validating the engine) or
    // the user has just unlocked the engine successfully.
    //
    // Unfortunately we have to string match on the error, since the error code returned
    // is generic (code 2)
    if (e.message && e.message.includes(WALLET_EXISTS_ERROR_MESSAGE)) {
      // At this point, genSeed is up and a wallet exists on the server, however
      // we need to make sure that this isn't because of
      try {
        await isAvailable.call(this)
      } catch (e) {
        if (e.code && e.code === UNIMPLEMENTED_SERVICE_CODE) {
          return false
        }
      }

      return true
    }

    // Rethrow the error since the user will now need to troubleshoot the engine
    throw e
  }

  return false
}

module.exports = isEngineUnlocked
