const { Big, networkAddressFormatter } = require('../utils')
const { queryRoutes, sendToRoute, getInfo } = require('../lnd-actions')

/**
 * Amount of time, in seconds, to deduct from the incoming HTLC to ensure we have enough timelock
 * for forwarding the swap. This is roughly equivalent to our forwarding policy for the first channel
 * on the new chain.
 * LND's default is 24 hours (144 Bitcoin blocks).
 * @type {Number}
 * @constant
 * @todo make this dynamic based on our node's actual forwarding policies, or user-set and pre-agreed with the Taker
 */
const DEFAULT_FWD_DELTA = 86400

/**
 * @param  {String} extendedTimeLockDelta Int64 string of the number of seconds extended to us in the inbound HTLC
 * @param  {Number} secondsPerBlock       Block time of the current block chain
 * @param  {Number} blockHeight           Current height of the current block chain
 * @return {String} Maximum block height for the downstream payment
 */
function calculateTimeLock (extendedTimeLockDelta, secondsPerBlock, blockHeight) {
  /**
   * Max time lock to use on the path to taker address in seconds
   * @todo make this dynamic based on the node's forwarding policy
   * @type {Big}
   */
  const maxTimeLockDelta = Big(extendedTimeLockDelta).minus(DEFAULT_FWD_DELTA)

  if (maxTimeLockDelta.lte(0)) {
    throw new Error(`Insufficient time lock extended for forwarding policy. Expected at least ${DEFAULT_FWD_DELTA}, got ${extendedTimeLockDelta}`)
  }

  // round down in terms of blocks extended
  // @see {@link https://mikemcl.github.io/big.js/#rm}
  const maxTimeLockDeltaInBlocks = maxTimeLockDelta.div(secondsPerBlock).round(0, 0)
  return maxTimeLockDeltaInBlocks.plus(blockHeight).toString()
}

/**
 * Translates a swap to a new payment channel network by making a payment
 * to the counterparty (Taker) node on this network
 *
 * @param {String} takerAddress Payment channel network address fo the Taker node we are paying
 * @param {String} swapHash     swap hash that will be associated with the swap
 * @param {String} amount       Int64 string of the amount of outbound currency in integer units
 * @param {String} extendedTimeLockDelta  Int64 string of the time lock extended to us by on the first chain in seconds
 * @returns {String} Base64 string of the preimage for the swapHash
 * @todo make time lock dynamic based on pre-agreed or advertised routes
 */
async function translateSwap (takerAddress, swapHash, amount, extendedTimeLockDelta) {
  this.logger.info(`Translating swap for ${swapHash} by sending to ${takerAddress}`, { amount, extendedTimeLockDelta })

  const { publicKey } = networkAddressFormatter.parse(takerAddress)
  const queryRoutesReq = {
    pubKey: publicKey,
    amt: amount
  }

  const [ { routes = [] }, { blockHeight } ] = await Promise.all([
    queryRoutes(queryRoutesReq, { client: this.client }),
    getInfo({ client: this.client })
  ])

  this.logger.debug(`Found ${routes.length} routes to ${takerAddress} for ${swapHash}`)

  if (routes.length === 0) {
    this.logger.error(`No route to ${takerAddress}`, { swapHash })
    throw new Error(`No route to ${takerAddress}`)
  }

  const totalTimeLock = calculateTimeLock(extendedTimeLockDelta, this.currencyConfig.secondsPerBlock, blockHeight)

  const availableRoutes = routes.filter(route => Big(route.totalTimeLock).lte(totalTimeLock))

  this.logger.debug(`Found ${availableRoutes.length} routes with at most ${totalTimeLock} for ${swapHash}`)

  if (availableRoutes.length === 0) {
    this.logger.error(`No route to ${takerAddress} with at most ${totalTimeLock}`, { swapHash })
    throw new Error(`No route to ${takerAddress} with at most ${totalTimeLock}`)
  }

  const { paymentPreimage, paymentError } = await sendToRoute(swapHash, availableRoutes, { client: this.client })

  if (paymentError) {
    this.logger.error(`Payment error while sending to route`, { paymentError, swapHash })
    throw new Error(paymentError)
  }

  return paymentPreimage
}

module.exports = translateSwap
