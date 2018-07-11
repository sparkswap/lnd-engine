const { sendPayment } = require('../lnd-actions')
const { networkAddressFormatter, sha256 } = require('../utils')

/**
 * The default CLTV delta that channels use to forward HTLCs.
 * @see {@link https://github.com/lightningnetwork/lnd/issues/1431}
 */
const DEFAULT_MIN_FWD_CLTV_DELTA = 144

/**
 * Executes a swap as the initiating node
 *
 * @param {String} makerAddress Payment Channel Network Address for the Maker of the swap
 * @param {String} swapHash     base64 string of the swap hash associated with this swap
 * @param {String} amount       Int64 string of the amount of outbound currency in its integer units
 * @returns {Promise<void>}     Promise that resolves when the swap is settled
 */
async function executeSwap (makerAddress, swapHash, amount) {
  this.logger.info(`Executing swap for ${swapHash} with ${makerAddress}`, { makerAddress, swapHash, amount })

  const { publicKey: counterpartyPubKey } = networkAddressFormatter.parse(makerAddress)

  // TODO: add a final CLTV delta based on swap information
  const request = {
    destString: counterpartyPubKey,
    paymentHash: swapHash,
    amt: amount,
    // TODO: Use swap information to determine an appropriate final delta
    // For now we take the default forwarding policy and double it to give a margin of safety
    finalCltvDelta: DEFAULT_MIN_FWD_CLTV_DELTA * 2
  }

  const { paymentError, paymentPreimage } = await sendPayment(request, { client: this.client })

  if (paymentError) {
    this.logger.error('Failed to execute swap', { swapHash, makerAddress, paymentError })
    throw new Error(paymentError)
  }

  console.log('paymentPreimage', paymentPreimage)

  const derivedHash = sha256.hash(paymentPreimage)

  console.log(derivedHash)
  if (derivedHash !== swapHash) {
    this.logger.error('Swap executed but hash did not match', { swapHash, makerAddress, derivedHash })
    throw new Error(`Hash from preimage does not match swap hash: expected ${swapHash}, found ${derivedHash}`)
  }
}

module.exports = executeSwap
