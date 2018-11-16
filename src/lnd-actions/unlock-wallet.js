/**
 * Unlock an LND wallet
 *
 * @function
 * @see {@link http://api.lightning.community/#unlockWallet}
 * @param {String} walletPassword
 * @param {Object} opts
 * @param {grpc.Client} client - WalletUnlocker rpc client
 * @return {Promise}
 */
function unlockWallet (walletPassword, { client }) {
  // If we are given a string, we need to convert this to bytes
  // in order for gRPC to accept it
  if (typeof walletPassword === 'string') {
    walletPassword = Buffer.from(walletPassword, 'utf8')
  }

  return new Promise((resolve, reject) => {
    client.unlockWallet({ walletPassword }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = unlockWallet
