const {
  unlockWallet: lndUnlockWallet
} = require('../lnd-actions')

/**
 * Unlocks an engine's wallet
 *
 * @param {String} walletPassword
 * @return {Promise}
 */
async function unlockWallet (password) {
  const walletPassword = Buffer.from(password, 'utf8')

  // If the engine is in any other status than locked
  if (!this.locked) {
    throw new Error('Engine is not in locked status. Unable to unlock')
  }

  return lndUnlockWallet(walletPassword, { client: this.walletUnlocker })
}

module.exports = unlockWallet
