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

  try {
    await lndUnlockWallet(walletPassword, { client: this.walletUnlocker })
  } catch (e) {
    throw e
  }
}

module.exports = unlockWallet
