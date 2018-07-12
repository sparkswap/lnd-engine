const { Big, networkAddressFormatter } = require('../utils')
const { queryRoutes, sendToRoute, getInfo } = require('../lnd-actions')

/**
 * Translates a swap to a new payment channel network by making a payment
 * to the counterparty (Taker) node on this network
 *
 * @param {String} takerAddress Payment channel network address fo the Taker node we are paying
 * @param {String} swapHash     swap hash that will be associated with the swap
 * @param {String} amount       Int64 string of the amount of outbound currency in integer units
 * @param {String} maxTimeLockDelta  Int64 string of the total available timelock for the path to the `takerAddress` in seconds
 * @returns {String} Base64 string of the preimage for the swapHash
 * @todo make time lock dynamic based on pre-agreed or advertised routes
 */
async function translateSwap (takerAddress, swapHash, amount, maxTimeLockDelta) {
  this.logger.info(`Translating swap for ${swapHash} by sending to ${takerAddress}`, { amount, maxTimeLockDelta })

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

  // round down in terms of blocks extended
  // @see {@link https://mikemcl.github.io/big.js/#rm}
  const maxTimeLockDeltaInBlocks = Big(maxTimeLockDelta).div(this.currencyConfig.secondsPerBlock).round(0, 0)
  const maxTimeLockInBlocks = maxTimeLockDeltaInBlocks.plus(blockHeight)

  const availableRoutes = routes.filter(route => Big(route.totalTimeLock).lte(maxTimeLockInBlocks))

  this.logger.debug(`Found ${availableRoutes.length} routes with at least ${maxTimeLockDelta} for ${swapHash}`)

  if (availableRoutes.length === 0) {
    this.logger.error(`No route to ${takerAddress} with at least ${maxTimeLockDelta}`, { swapHash })
    throw new Error(`No route to ${takerAddress} with at least ${maxTimeLockDelta}`)
  }

  const { paymentPreimage, paymentError } = await sendToRoute(swapHash, availableRoutes, { client: this.client })

  if (paymentError) {
    this.logger.error(`Payment error while sending to route`, { paymentError, swapHash })
    throw new Error(paymentError)
  }

  return paymentPreimage
}

module.exports = translateSwap
