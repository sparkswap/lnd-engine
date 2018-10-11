const { addInvoice } = require('../lnd-actions')
const { Big } = require('../utils')

/**
 * Creates an invoice
 *
 * @param {String} memo
 * @param {Number} expiry - in seconds
 * @param {Number} commonValue - value in common units (e.g. BTC)
 * @returns {String} paymentRequest hash of invoice from lnd
 */
async function createInvoice (memo, expiry, commonValue) {
  const quantumValue = Big(this.currencyConfig.quantumsPerCommon).times(commonValue).round().toString()
  const { paymentRequest } = await addInvoice({ memo, expiry, value: quantumValue }, { client: this.client })
  return paymentRequest
}

module.exports = createInvoice
