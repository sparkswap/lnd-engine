/**
 * Wallet Balance
 * @module src/lnd-actions/wallet-balance
 */

/**
 * Gets the specified lnd instance's wallet balance
 *
 * @function
 * @see {@link http://api.lightning.community/#walletBalance}
 * @return {Promise}
 */
function walletBalance () {
  return new Promise((resolve, reject) => {
    this.client.walletBalance({}, (err, response) => {
      if (err) return reject(err)
      return resolve(response)
    })
  })
}

module.exports = walletBalance
