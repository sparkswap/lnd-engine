const { walletBalance } = require('../lnd-actions')

/**
 * Total balance of unspent funds
 * @returns {String} total
 */
async function getTotalBalance () {
  const { totalBalance } = await walletBalance({ client: this.client })
  return totalBalance
}

module.exports = getTotalBalance
