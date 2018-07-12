const { sendPayment } = require('../lnd-actions')
const { networkAddressFormatter, sha256 } = require('../utils')

/**
 * The default amount of time, in seconds, that the Maker will use in forwarding this transaction.
 * LND's default value announced on its channels is 24 hours (144 Bitcoin blocks)
 * @todo Make this amount dynamic and determined with the price/amount or determined from the channel graph
 * @type {Number}
 * @constant
 */
const DEFAULT_MAKER_FWD_DELTA = 86400

/**
 * The default amount of time, in seconds, that the Relayer will use in forwarding this transaction.
 * LND's default value announced on its channels is 24 hours (144 Bitcoin blocks)
 * @todo Make this amount dynamic and published by the Relayer or determined from the channel graph
 * @type {Number}
 * @constant
 */
const DEFAULT_RELAYER_FWD_DELTA = 86400

/**
 * The default amoumt of time, in seconds, that the Taker (this node) expects to receive when settling a swap.
 * It is derived from BOLT-11 which states it as 90 minutes (9 Bitcoin blocks)
 * @see {@link https://github.com/lightningnetwork/lightning-rfc/blob/master/11-payment-encoding.md}
 * @todo Make this amount dynamic and set by the broker/user
 * @type {Number}
 * @constant
 */
const DEFAULT_MIN_FINAL_DELTA = 5400

/**
 * The number of blocks to buffer any output timelock by to account for block ticks during a swap
 * This is especially problematic on simnet where we mine blocks every 10 seconds, but it is a known issue on mainnet
 * @see {@link https://github.com/lightningnetwork/lnd/issues/535}
 * @type {Number}
 * @constant
 */
const BLOCK_BUFFER = 1

/**
 * Executes a swap as the initiating (i.e. Taker) node
 *
 * @param {String} makerAddress Payment Channel Network Address for the Maker of the swap
 * @param {String} swapHash     base64 string of the swap hash associated with this swap
 * @param {String} amount       Int64 string of the amount of outbound currency in its integer units
 * @returns {Promise<void>}     Promise that resolves when the swap is settled
 */
async function executeSwap (makerAddress, swapHash, amount) {
  this.logger.info(`Executing swap for ${swapHash} with ${makerAddress}`, { makerAddress, swapHash, amount })

  const { publicKey: counterpartyPubKey } = networkAddressFormatter.parse(makerAddress)

  // For now, we assume that the swap path when returning back to the Taker will pass through the Maker and the
  // Relayer. This allows us to calculate a final CLTV that will complete the route by adding the forward CLTV
  // delta for the Maker, the Relayer, and the final CLTV delta for the Taker.
  // We calculate the amount in seconds before converting it to blocks for the current engine's currency.
  // We add one additional block to create a buffer in case of a block tick during the swap
  // TODO: use the channel graph or pre-agreed lock times to create this delta to avoid rejections and allow for more flexibility
  const totalTimeLockInSeconds = DEFAULT_MAKER_FWD_DELTA + DEFAULT_RELAYER_FWD_DELTA + DEFAULT_MIN_FINAL_DELTA
  const finalCltvDelta = Math.ceil(totalTimeLockInSeconds / this.currencyConfig.secondsPerBlock) + BLOCK_BUFFER

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
