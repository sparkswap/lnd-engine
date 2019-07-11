const { deadline } = require('../grpc-utils')

/** @typedef {import('../lnd-setup').LndWalletUnlockerClient} WalletUnlocker */

/**
 * Change the wallet password of an lnd wallet
 *
 * @see http://api.lightning.community/#changePassword
 * @param {Buffer} currentPassword - Buffer or base64 string
 * @param {Buffer} newPassword - Buffer or base64 string
 * @param {object} opts
 * @param {WalletUnlocker} opts.client
 * @returns {Promise}
 */
function changePassword (currentPassword, newPassword, { client }) {
  return new Promise((resolve, reject) => {
    client.changePassword({ currentPassword, newPassword }, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = changePassword
