const { deadline } = require('../grpc-utils')

/**
 * Unlock an LND wallet
 *
 * @see http://api.lightning.community/#unlockWallet
 * @param {Buffer} walletPassword - Buffer or base64 string
 * @param {Object} opts
 * @param {LndClient} opts.client - WalletUnlocker rpc client
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
