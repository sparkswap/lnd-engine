const { deadline } = require('../grpc-utils')

/** @typedef { import('../lnd-setup').LndWalletUnlockerClient } WalletUnlocker */

/**
 * Unlock an LND wallet
 *
 * @see http://api.lightning.community/#unlockWallet
 * @param {Buffer} walletPassword - Buffer or base64 string
 * @param {Object} opts
 * @param {WalletUnlocker} opts.client
 * @returns {Promise}
 */
function unlockWallet (walletPassword, { client }) {
  return new Promise((resolve, reject) => {
    client.unlockWallet({ walletPassword }, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = unlockWallet
