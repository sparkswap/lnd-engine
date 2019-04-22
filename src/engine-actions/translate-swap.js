const { Big, networkAddressFormatter, CLTV_DELTA } = require('../utils')
const { queryRoutes, sendToRoute, getInfo } = require('../lnd-actions')

const {
  DEFAULT_MAKER_FWD_DELTA,
  DEFAULT_MIN_FINAL_DELTA,
  BLOCK_BUFFER
} = CLTV_DELTA

const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));

/**
 * Number of route options to be returned when calculating routes for translating
 * a swap.
 * NOTE: 20 is the max value for numRoutes on lnd
 *
 * @constant
 * @type {number}
 * @default
 */
const NUM_OF_ROUTES = 10

/**
 * Calculates a timelock based on the Maker's default fowarding policy
 *
 * @param  {string} extendedTimeLockDelta - Int64 string of the number of seconds extended to us in the inbound HTLC
 * @param  {number} secondsPerBlock       - Block time of the current block chain
 * @param  {number} blockHeight           - Current height of the current block chain
 * @returns {string} Maximum block height for the downstream payment
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
 * gRPC error code for a CANCELLED request, either by a client or a server
 * @see {@link https://github.com/grpc/grpc/blob/master/doc/statuscodes.md}
 * @constant
 * @type {number}
 * @default
 */
const CANCELLED_CODE = 1

/**
 * Use the sendToRoute function as though it returned a promise
 * @param {string} paymentHash - Base64 string of the payment hash to pay for
 * @param {Array} routes - Routes to use
 * @param {Object} options
 * @param {Object} options.logger
 * @param {LndClient} options.client
 * @returns {Promise<TranslateSwapOutcome>}
 * @throws {Error} unknow lnd error
 * @throws {Error} lnd closed stream to send to route
 * @throws {Error} stream failed to finish
 */
function sendToRouteSync (paymentHash, routes, { logger, client }) {
  return new Promise((resolve, reject) => {
    try {
      logger.debug('Setting up stream to sendToRoute', { paymentHash })
      const stream = sendToRoute({ client })

      // keep local state of whether we (as opposed to LND) cancelled so
      // that we can handle a CANCELLED error message appropriately
      let clientCancel = false

      const errorListener = (err = new Error('Unknown LND Error')) => {
        // if we cancelled the request, we treat a CANCELLED code
        // as a cleanup and not a true error
        if (clientCancel && err.code && err.code === CANCELLED_CODE) {
          logger.debug('Received CANCELLED after client cancelled, cleaning up')
          finish()
        } else {
          logger.error(`Error from sendToRoute stream`, err)
          finish(err)
        }
      }

      const endListener = () => {
        logger.error(`LND closed sendToRoute stream before returning a value`)
        return finish(new Error(`LND closed stream to send to route`))
      }

      const dataListener = (response) => {
        const { paymentError, paymentPreimage } = response
        logger.debug('Received sendToRoute response from LND', { paymentError, paymentPreimage })

        // cancel will trigger cleanup through our errorListener
        clientCancel = true
        stream.cancel()

        // TODO: do we need to ensure that this preimage matches the hash that we sent?
        resolve({ paymentError, paymentPreimage })
      }

      // Helper to make sure we tear down our listeners
      const finish = (err, response) => {
        stream.removeListener('error', errorListener)
        stream.removeListener('end', endListener)
        stream.removeListener('data', dataListener)

        if (err) {
          return reject(err)
        }
      }

      stream.on('error', errorListener)
      stream.on('end', endListener)
      stream.on('data', dataListener)

      logger.debug('Writing to sendToRoute stream', { paymentHash })
      stream.write({ paymentHash, routes })
    } catch (e) {
      reject(e)
    }
  })
}

/**
 * @typedef {Object} TranslateSwapOutcome
 * @property {String} paymentPreimage Base64 string of the preimage for the swapHash
 * @property {String} permanentError Error encountered that is permanent, and safe to cancel the upstream HTLC
 */

/**
 * Translates a swap to a new payment channel network by making a payment
 * to the counterparty (Taker) node on this network
 *
 * @param {string} takerAddress - Payment channel network address fo the Taker node we are paying
 * @param {string} swapHash     - swap hash that will be associated with the swap
 * @param {string} amount       - Int64 string of the amount of outbound currency in integer units
 * @param {string} extendedTimeLockDelta  - Int64 string of the time lock extended to us by on the first chain in seconds
 * @returns {TranslateSwapOutcome}
 * @todo make time lock dynamic based on pre-agreed or advertised routes
 */
async function translateSwap (takerAddress, swapHash, amount, extendedTimeLockDelta) {
  this.logger.info(`Translating swap for ${swapHash} by sending to ${takerAddress}`, { amount, extendedTimeLockDelta })

  const { publicKey } = networkAddressFormatter.parse(takerAddress)

  const secondsPerBlock = this.secondsPerBlock

  // We specifically use Math.ceil here to ensure that the swap succeeds by providing
  // the terminating node (Taker) additional timelock. This allows enough time so that
  // the Taker will not reject the HTLC as having too little timelock. We add a Block buffer
  // to account for blocks that are mined during swap execution.
  const finalCltvDelta = Math.ceil((DEFAULT_MIN_FINAL_DELTA + BLOCK_BUFFER) / secondsPerBlock)

  const queryRoutesReq = {
    pubKey: publicKey,
    amt: amount,
    numRoutes: NUM_OF_ROUTES,
    finalCltvDelta
  }

  this.logger.debug('Calling queryRoutes on lnd w/ params', { params: queryRoutesReq })

  try {
    var { blockHeight = '' } = await getInfo({ client: this.client })
    var queryRouteResponse = await queryRoutes(queryRoutesReq, { client: this.client })
  } catch (e) {
    // we run into a situation where we cannot find a route because a channel has not been broadcasted
    // to the network. What we will do is wait for the next block and return
    if (e.message.includes('target not found')) {
      const lastHeight = blockHeight
      const tries = 10

      for (let i = 0; i < tries; i++) {
        await sleep(10000)
        var { blockHeight: newBlockHeight } = await getInfo({ client: this.client }) //

        if (lastHeight <= newBlockHeight) {
          try {
            queryRouteResponse = await queryRoutes(queryRoutesReq, { client: this.client })
          } catch (e) {
            this.logger.error('retrying query routes', { tries })
          }
        }
      }

      this.logger.error('Received error on queryRoutes', { error: e.message, stack: e.stack })
      return { permanentError: e.message }
    } else {
      this.logger.error('Received error on queryRoutes', { error: e.message, stack: e.stack })
      return { permanentError: e.message }
    }
  }

  const { routes = [] } = queryRouteResponse

  if (routes.length === 0) {
    const err = `No route to ${takerAddress}`
    this.logger.error(err, { swapHash })
    return { permanentError: err }
  }

  this.logger.debug(`Found ${routes.length} routes to ${takerAddress} for ${swapHash}`)
  routes.forEach((route, i) => {
    this.logger.debug(`Route ${i} totalTimeLock: ${route.totalTimeLock}`)
  })

  if (!blockHeight) {
    this.logger.error('Blockheight was not returned from daemon', { blockHeight })
    return { permanentError: `No route to ${takerAddress}. Blockheight was unavailable` }
  }

  this.logger.debug('Calculating timelock with params:', { extendedTimeLockDelta, blockHeight })

  try {
    var totalTimeLock = calculateTimeLock(extendedTimeLockDelta, secondsPerBlock, blockHeight)
  } catch (err) {
    this.logger.error(err)
    return { permanentError: err.message }
  }

  this.logger.debug(`Maximum timelock for second leg of swap calculated as: ${totalTimeLock}`)

  const availableRoutes = routes.filter(route => Big(route.totalTimeLock).lte(totalTimeLock))

  if (availableRoutes.length === 0) {
    const err = `No route to ${takerAddress} with a timelock (in blocks) less than/equal to ${totalTimeLock}`
    this.logger.error(err, { swapHash })
    return { permanentError: err }
  }

  this.logger.debug(`Found ${availableRoutes.length} routes with a timelock (in blocks) less than/equal to ${totalTimeLock}`, { swapHash })

  const { paymentPreimage, paymentError } = await sendToRouteSync(swapHash, availableRoutes, { logger: this.logger, client: this.client })

  if (paymentError) {
    this.logger.error(`Payment error while sending to route`, { paymentError, swapHash })
    return { permanentError: paymentError }
  }

  return { paymentPreimage }
}

module.exports = translateSwap
