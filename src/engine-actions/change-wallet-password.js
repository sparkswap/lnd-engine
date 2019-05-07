const {
  changePassword: lndChangePassword
} = require('../lnd-actions')

/**
 * Changes an engine's wallet password
 *
 * @param {string} currentPass - current wallet password
 * @param {string} newPass - new wallet password
 * @returns {Promise}
 */
function changeWalletPassword (currentPass, newPass) {
  const currentPassword = Buffer.from(currentPass, 'utf8')
  const newPassword = Buffer.from(newPass, 'utf8')

  return lndChangePassword(currentPassword, newPassword, { client: this.walletUnlocker })
}

module.exports = changeWalletPassword
