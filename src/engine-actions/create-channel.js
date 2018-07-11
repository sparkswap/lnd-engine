const {
  connectPeer,
  openChannel,
  updateChannelPolicy
} = require('../lnd-actions')
const {
  SUPPORTED_SYMBOLS
} = require('../fee-config')
const {
  feeRateForSymbol,
  networkAddressFormatter
} = require('../utils')
const delay = require('timeout-as-promise')

/**
 * Default timelock delta
 *
 * @see {@link https://github.com/lightningnetwork/lnd/blob/master/chainregistry.go}
 * @constant
 * @type {Number}
 * @default
 */
const TIMELOCK_DELTA = 144

/**
 * Whole number value for milli-satoshi fee rate
 *
 * @constant
 * @type {Number}
 * @default
 */
const FEE_RATE_PRECISION = 1000000

/**
 * Takes the response from OpenChannelSync (lnd) and returns a channel point
 * that can be used to update/view information on an opened channel
 *
 * @see {@link https://api.lightning.community/#openchannelsync}
 * @param {Object} info
 * @param {String} info.fundingTxidBytes
 * @param {String} info.fundingTxidStr
 * @param {Number} info.outputIndex
 * @return {Object} res
 * @return {Null} an error occurred
 */
function generateChanPointFromChannelInfo (info) {
  const { fundingTxidBytes, fundingTxidStr, outputIndex: oIndex } = info
  const outputIndex = parseInt(oIndex, 10)

  if (fundingTxidBytes) {
    return { fundingTxidBytes, outputIndex }
  } else if (fundingTxidStr) {
    return { fundingTxidStr, outputIndex }
  } else {
    return null
  }
}

/**
 * Based on a specified channel type (as determined by the symbol) we return the applicable
 * feeRate for the type of currency.
 *
 * For the `updateChannelPolicy` endpoint, this is expressed as per satoshi transferred
 * and is a double with 6 decimal place precision (1e-6)
 *
 * @param {String} symbol
 * @return {Number} feeRate
 */
function feeRatePerSatoshiForSymbol (symbol) {
  const feeRatePerMillionSatoshis = feeRateForSymbol(symbol)

  if (!feeRatePerMillionSatoshis) return false

  return (parseInt(feeRatePerMillionSatoshis, 10) / FEE_RATE_PRECISION)
}

/**
 * Executes a connection and opens a channel w/ another lnd instance
 *
 * @param {String} paymentChannelNetworkAddress
 * @param {String} fundingAmount - int64 string
 * @param {String} symbol - ticker symbol
 * @returns {Promise<boolean>} returns true on success
 */
async function createChannel (paymentChannelNetworkAddress, fundingAmount, symbol) {
  if (!Object.values(SUPPORTED_SYMBOLS).includes(symbol)) {
    throw new Error(`Symbol is not currently supported on the engine: ${symbol}`)
  }

  const { publicKey, host } = networkAddressFormatter.parse(paymentChannelNetworkAddress)

  // TODO check the funding defaults (usually 20000 satosh) and fail before contacting
  // LND
  this.logger.debug(`Attempting to create  ${symbol} channel with ${host}`)

  await connectPeer(publicKey, host, { client: this.client, logger: this.logger })

  this.logger.debug(`Successfully connected to peer: ${host}`)

  const channelInfo = await openChannel(publicKey, fundingAmount, { client: this.client })

  this.logger.debug(`Successfully opened channel with: ${host}`)

  // TODO: support multiple currencies
  const feeRate = feeRatePerSatoshiForSymbol(symbol)

  if (!feeRate) {
    this.logger.error('Unable to generate fee from provided symbol')
    return false
  }

  const chanPoint = generateChanPointFromChannelInfo(channelInfo)

  if (!chanPoint) {
    this.logger.error('Unable to generate chanpoint w/ openChannel info', { channelInfo })
    return false
  }

  // Updates a channel policy after a channel "is" active (time estimate).
  //
  // It takes 6 confirmation blocks to open a channel. Currently we mine a block every 10 seconds.
  // With this code, we will wait 120 seconds (2 minutes) which should be long enough
  // for the channel to open
  if (process.env.NODE_ENV === 'development') {
    this.logger.debug('Queuing channel to be updated in 2 minutes')
    await delay(120000)
    this.logger.debug('Updating channel point', { chanPoint, feeRate })
    await updateChannelPolicy(chanPoint, feeRate, TIMELOCK_DELTA, { client: this.client })
  }

  return true
}

module.exports = createChannel
