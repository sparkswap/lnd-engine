/**
 * Balance
 * @module src/lnd-actions/balance
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
    this.client.walletBalance({}, (err, res) => {
      if (err) return reject(err)

      this.logger.log('Received response from lnd: ', res)

      return resolve(res)
    })
  })
}

/**
 * Total balance of unspent funds
 * @returns {String} total
 */
async function total () {
  const { totalBalance } = await walletBalance.call(this)
  return totalBalance
}

/**
 * Balance of unconfirmed unspent funds
 * @returns {String} total
 */
async function unconfirmed () {
  const { unconfirmedBalance } = await walletBalance.call(this)
  return unconfirmedBalance
}

/**
 * Balance of confirmed unspent funds
 * @returns {String} total
 */
async function confirmed () {
  const { confirmedBalance } = await walletBalance.call(this)
  return confirmedBalance
}

module.exports = {
  total,
  unconfirmed,
  confirmed,
  uncommitted: confirmed,
  committed: unconfirmed
}
