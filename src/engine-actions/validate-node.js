const {
  getInfo,
  genSeed
} = require('../lnd-actions')

const validateNodeConfig = require('./validate-node-config')

/**
 * CODE 12 for gprc is equal to 'unimplemented'
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
 * @param {grpc.Client} Lightning grpc client
 * @return {Boolean} isEngineUnlocked
 */
async function isEngineUnlocked (client) {
  try {
    // If the call to `getInfo` succeeds, then we can assume that our LND instance
    // is unlocked and functional
    await getInfo({ client })
    return true
  } catch (e) {
    // CODE 12 for grpc is equal to 'unknown service' or an error type of
    // unimplemented.
    // In GRPC Unimplemented indicates operation is not implemented or not
    // supported/enabled in this specific service.
    if (e.code && e.code === UNIMPLEMENTED_SERVICE_CODE) {
      return false
    }

    // We return true, because the error is unrelated to a service not being implemented
    // and the user will now have to troubleshoot further
    return true
  }
}

/**
 * Validates this engine
 *
 * @function
 * @return {True} Node is configured correctly
 * @throws {Error} Failed to validate an unlocked engine
 */
async function validateNode () {
  const isUnlocked = await isEngineUnlocked(this.client)

  // We need to set the `isUnlocked` variable here so that end users can call the engine
  // and validate if the engine is available or not
  this.isUnlocked = isUnlocked

  // If the Lightning service is not available (wallet is not unlocked) on the engine
  // then we should check the only non-modifying endpoint of the WalletUnlocker to make
  // sure that a connection to the daemon can be made.
  if (!isUnlocked) {
    try {
      await genSeed({ client: this.walletUnlocker })
      return true
    } catch (e) {
      this.logger.error('Call to validate an unlocked engine failed', { stack: e.stack })
      throw new Error(`Call to validate an unlocked engine has failed. Please check your ${this.currencyConfig.chainName} lnd instance`)
    }
  }

  // If the wallet is unlocked and functional in LND (Lightning service is available),
  // then we can validate that all information on the node is correct before allowing the
  // user to continue
  return validateNodeConfig()
}

module.exports = validateNode
