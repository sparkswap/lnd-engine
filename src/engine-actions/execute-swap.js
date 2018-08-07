const { sendPayment } = require('../lnd-actions')
const { networkAddressFormatter, sha256, CLTV_DELTA } = require('../utils')

/**
 * Timelock delta constants
 *
 * @constant
 * @type {Object<key, Number}
 * @default
 */
const {
  DEFAULT_MAKER_FWD_DELTA,
  DEFAULT_MIN_FINAL_DELTA,
  DEFAULT_RELAYER_FWD_DELTA,
  BLOCK_BUFFER
} = CLTV_DELTA

/**
 * Executes a swap as the initiating (i.e. Taker) node
 *
 * For now, we assume that the swap path when returning back to the Taker will pass through the Maker and the
 * Relayer. This allows us to calculate a final CLTV that will complete the route by adding the forward CLTV
 * delta for the Maker, the Relayer, and the final CLTV delta for the Taker.
 * We calculate the amount in seconds before converting it to blocks for the current engine's currency.
 * We add one additional block to create a buffer in case of a block tick during the swap
 *
 * @todo use the channel graph or pre-agreed lock times to create this delta to avoid rejections and allow for more flexibility
 * @param {String} makerAddress Payment Channel Network Address for the Maker of the swap
 * @param {String} swapHash     base64 string of the swap hash associated with this swap
 * @param {String} amount       Int64 string of the amount of outbound currency in its integer units
 * @returns {Promise<void>}     Promise that resolves when the swap is settled
 */
async function executeSwap (makerAddress, swapHash, amount) {
  this.logger.info(`Executing swap for ${swapHash} with ${makerAddress}`, { makerAddress, swapHash, amount })

  const { publicKey: counterpartyPubKey } = networkAddressFormatter.parse(makerAddress)
  const secondsPerBlock = this.currencyConfig.secondsPerBlock

  if (!secondsPerBlock) {
    throw new Error('secondsPerBlock is not specified in the currencyConfig for lnd-engine')
  }

  // TotalTimeLock includes `Maker -> Relayer -> Taker` deltas (in seconds), where
  // our current node is the Taker.
  const totalTimeLockInSeconds = DEFAULT_MAKER_FWD_DELTA + DEFAULT_RELAYER_FWD_DELTA + DEFAULT_MIN_FINAL_DELTA

  // We specifically use Math.ceil here to ensure that the swap succeeds by providing
  // the maker (who is translating between chains) additional timelock. As the Taker,
  // we would prefer to add additional time (in blocks) to our finalCltvDelta than to
  // have to hltc be rejected.
  const finalCltvDelta = Math.ceil((totalTimeLockInSeconds + BLOCK_BUFFER) / secondsPerBlock)

  const request = {
    destString: counterpartyPubKey,
    paymentHash: swapHash,
    amt: amount,
    finalCltvDelta
  }

  const { paymentError, paymentPreimage } = await sendPayment(request, { client: this.client })

  if (paymentError) {
    this.logger.error('Failed to execute swap', { swapHash, makerAddress, paymentError })
    throw new Error(paymentError)
  }

  const derivedHash = sha256.hash(paymentPreimage)

  if (derivedHash !== swapHash) {
    this.logger.error('Swap executed but hash did not match', { swapHash, makerAddress, derivedHash })
    throw new Error(`Hash from preimage does not match swap hash: expected ${swapHash}, found ${derivedHash}`)
  }
}

module.exports = executeSwap
