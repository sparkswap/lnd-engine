const {
  unlockWallet: lndUnlockWallet
} = require('../lnd-actions')

/**
 * Unlocks an engine's wallet
 *
 * @param {String} walletPassword
 * @return {Promise}
 */
function unlockWallet (password) {
  const walletPassword = Buffer.from(password, 'utf8')
  return lndUnlockWallet(walletPassword, { client: this.walletUnlocker })
}

module.exports = unlockWallet
