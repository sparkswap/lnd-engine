const { sendPayment } = require('../lnd-actions')
const { networkAddressFormatter } = require('../utils')

/**
 * Default fee limit for swap routes.
 * We expect to route swaps through a fee-less hub.
 * @todo Make this value dynamic.
 */
const DEFAULT_FEE_LIMIT = '0'

/**
 * Initiates a swap
 *
 * @param {string} address        - Payment Channel Network Address for the last hop of this leg of the swap
 * @param {string} swapHash       - base64 string of the swap hash associated with this swap
 * @param {string} amount         - Int64 string of the amount of outbound currency in its integer units
 * @param {number} maxTimeLock    - Maximum number of seconds that this swap should take to be finalized
 * @param {number} [finalDelta=0] - delta (in seconds) to use for the time-lock of the CLTV extended to the final hop.
 *                                  If unspecified, defaults to the BOLT-11 value (9 Blocks for BTC)
 * @param {string} [feeLimit=0]   - Maximum amount of fees to pay on the route
 * @returns {Promise<void>} - Promise that resolves when the swap is settled
 */
async function initiateSwap (address, swapHash, amount, maxTimeLock, finalDelta = 0, feeLimit = DEFAULT_FEE_LIMIT) {
  this.logger.info(`Initiating swap for ${swapHash} with ${address}`, { address, swapHash, amount })

  const { publicKey: counterpartyPubKey } = networkAddressFormatter.parse(address)

  // Since `maxTimeLock` is a maximum, we use Math.floor to be conservative
  const cltvLimit = Math.floor(maxTimeLock / this.secondsPerBlock)

  // We use Math.ceil to be sure that the last node in this leg of the swap accepts the payment.
  const finalCltvDelta = Math.ceil(finalDelta / this.secondsPerBlock)

  const request = {
    destString: counterpartyPubKey,
    paymentHash: swapHash,
    amt: amount,
    feeLimit: {
      fixed: feeLimit
    },
    cltvLimit,
    finalCltvDelta
  }

  const { paymentError, paymentPreimage } = await sendPayment(request, { client: this.client, logger: this.logger })

  if (paymentError) {
    this.logger.error('Failed to execute swap', { swapHash, address, paymentError })
    throw new Error(paymentError)
  }

  return paymentPreimage
}

module.exports = initiateSwap
