const { walletBalance } = require('./lnd-actions')

/**
 * Balance of confirmed unspent funds
 *
 * @returns {String} total
 */
async function getConfirmedBalance () {
  const { confirmedBalance } = await walletBalance({ client: this.client })
  return confirmedBalance
}

module.exports = getConfirmedBalance
