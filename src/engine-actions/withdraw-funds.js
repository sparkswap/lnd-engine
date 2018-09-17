const {
  sendCoins
} = require('../lnd-actions')

/**
 * Given an address and amount, it withdraws funds from the lnd wallet to the given address
 *
 * @param {String} addr wallet address to send the coins to
 * @param {Integer} amount amount of coin to send to wallet address
 * @return {String} txid transaction for the withdrawal
 */

async function withdrawFunds (addr, amount) {
  const { txid } = await sendCoins(addr, amount, { client: this.client })
  this.logger.debug('Funds withdrawn successfully', { txid })

  return txid
}

module.exports = withdrawFunds
