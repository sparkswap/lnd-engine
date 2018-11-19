/**
 * Unlock an LND wallet
 *
 * @function
 * @see {@link http://api.lightning.community/#unlockWallet}
 * @param {Buffer} walletPassword - Buffer or base64 string
 * @param {Object} opts
 * @param {grpc.Client} client - WalletUnlocker rpc client
 * @return {Promise}
 */
function unlockWallet (walletPassword, { client }) {
  return new Promise((resolve, reject) => {
    client.unlockWallet({ walletPassword }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = unlockWallet
