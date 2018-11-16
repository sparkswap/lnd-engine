const {
  unlockWallet: lndUnlockWallet
} = require('../lnd-actions')

/**
 * Unlocks an engine's wallet
 *
 * @param {String} walletPassword
 * @return {void}
 */
async function unlockWallet (walletPassword) {
  return lndUnlockWallet(walletPassword, { client: this.walletUnlocker })
}

module.exports = unlockWallet
