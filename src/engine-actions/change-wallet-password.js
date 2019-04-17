const {
  changePassword: lndChangePassword
} = require('../lnd-actions')

/**
 * Unlocks an engine's wallet
 *
 * @param {string} currentPass - current wallet password
 * @param {string} newPass - new wallet password
 * @returns {Promise}
 */
async function changeWalletPassword (currentPass, newPass) {
  const currentPassword = Buffer.from(currentPass, 'utf8')
  const newPassword = Buffer.from(newPass, 'utf8')

  return lndChangePassword(currentPassword, newPassword, { client: this.walletUnlocker })
}

module.exports = changeWalletPassword
