const { Big, networkAddressFormatter, CLTV_DELTA } = require('../utils')
const { queryRoutes, sendToRoute, getInfo } = require('../lnd-actions')

const {
  DEFAULT_MAKER_FWD_DELTA,
  DEFAULT_MIN_FINAL_DELTA
} = CLTV_DELTA

/**
 * Number of route options to be returned when calculating routes for translating
 * a swap.
 * NOTE: 20 is the max value for numRoutes on lnd
 *
 * @type {Number}
 * @constant
 * @default
 */
const NUM_OF_ROUTES = 10

/**
 * Calculates a timelock based on the Maker's default fowarding policy
 *
 * @param  {String} extendedTimeLockDelta Int64 string of the number of seconds extended to us in the inbound HTLC
 * @param  {Number} secondsPerBlock       Block time of the current block chain
 * @param  {Number} blockHeight           Current height of the current block chain
 * @return {String} Maximum block height for the downstream payment
 */
function calculateTimeLock (extendedTimeLockDelta, secondsPerBlock, blockHeight) {
  // maxTimeLockDelta represents the max time lock to use on the path from
  // the Maker (the current node) to the taker address, in seconds.
  //
  // We substract our own timelock delta so that we have sufficient time for the
  // act of translating between block chains.
  //
  const maxTimeLockDelta = Big(extendedTimeLockDelta).minus(DEFAULT_MAKER_FWD_DELTA)

  if (maxTimeLockDelta.lte(0)) {
    throw new Error(`Insufficient time lock extended for forwarding policy. Expected at least ${DEFAULT_MAKER_FWD_DELTA}, got ${extendedTimeLockDelta}`)
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

  const secondsPerBlock = this.currencyConfig.secondsPerBlock

  if (!secondsPerBlock) {
    throw new Error('secondsPerBlock is not specified in the currencyConfig for lnd-engine')
  }

  // We specifically use Math.ceil here to ensure that the swap succeeds by providing
  // the terminating node (Taker) additional timelock. This allows enough time so that
  // the Taker will not reject the HTLC as having too little timelock.
  const finalCltvDelta = Math.ceil(DEFAULT_MIN_FINAL_DELTA / secondsPerBlock)

  const queryRoutesReq = {
    pubKey: publicKey,
    amt: amount,
    numRoutes: NUM_OF_ROUTES,
    finalCltvDelta
  }

  this.logger.debug('Calling queryRoutes on lnd w/ params', { params: queryRoutesReq })

  const [ { routes = [] }, { blockHeight = '' } ] = await Promise.all([
    queryRoutes(queryRoutesReq, { client: this.client }),
    getInfo({ client: this.client })
  ])

  if (routes.length === 0) {
    this.logger.error(`No route to ${takerAddress}`, { swapHash })
    throw new Error(`No route to ${takerAddress}`)
  }

  this.logger.debug(`Found ${routes.length} routes to ${takerAddress} for ${swapHash}`)
  routes.forEach((route, i) => {
    this.logger.debug(`Route ${i} totalTimeLock: ${route.totalTimeLock}`)
  })

  if (!blockHeight) {
    this.logger.error('Blockheight was not returned from daemon', { blockHeight })
    throw new Error(`No route to ${takerAddress}. Blockheight was unavailable`)
  }

  this.logger.debug('Calculating timelock with params:', { extendedTimeLockDelta, blockHeight })

  const totalTimeLock = calculateTimeLock(extendedTimeLockDelta, this.currencyConfig.secondsPerBlock, blockHeight)

  this.logger.debug(`Maximum timelock for second leg of swap calculated as: ${totalTimeLock}`)

  const availableRoutes = routes.filter(route => Big(route.totalTimeLock).lte(totalTimeLock))

  if (availableRoutes.length === 0) {
    this.logger.error(`No route to ${takerAddress} with a timelock (in blocks) less than/equal to ${totalTimeLock}`, { swapHash })
    throw new Error(`No route to ${takerAddress} with a timelock (in blocks) less than/equal to ${totalTimeLock}`)
  }

  this.logger.debug(`Found ${availableRoutes.length} routes with a timelock (in blocks) less than/equal to ${totalTimeLock}`, { swapHash })

  const { paymentPreimage, paymentError } = await sendToRoute(swapHash, availableRoutes, { client: this.client })

  if (paymentError) {
    this.logger.error(`Payment error while sending to route`, { paymentError, swapHash })
    throw new Error(paymentError)
  }

  return paymentPreimage
}

module.exports = translateSwap
