const {
  sendCoins
} = require('../lnd-actions')

/**
 * Given a payment request, it pays the invoices and returns a refund invoice
 *
 * @param {String} addr wallet address to send the coins to
 * @param {Integer} amount amount of coin to send to wallet address
 * @param {Object} options
 * @return {String} txid transaction for the withdrawal
 */

async function withdrawFunds (addr, amount) {
  try {
    const { txid } = await sendCoins(addr, amount, { client: this.client })
    this.logger.debug('Coins successfully sent', { txid })

    return txid
  } catch (err) {
    throw new Error(err)
  }
}

module.exports = withdrawFunds
