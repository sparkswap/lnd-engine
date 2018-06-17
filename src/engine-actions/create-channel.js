const {
  connectPeer,
  openChannel,
  updateChannelPolicy
} = require('../lnd-actions')
const {
  LTC_FEE_PER_KW,
  BTC_FEE_PER_KW,
  SUPPORTED_SYMBOLS
} = require('../config')

/**
 * Takes the response from OpenChannelSync (lnd) and returns a channel point
 * that can be used to update/view information on an opened channel
 *
 * @see {@link https://api.lightning.community/#openchannelsync}
 * @param {Object} info
 * @param {String} info.fundingTxidBytes
 * @param {String} info.fundingTxidStr
 * @param {String} info.fundingTxidStr
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
 * Returns a feeRate for a specified symbol in mSat
 *
 * @param {String} symbol
 * @return {Number} feeRate
 */
function feeRateFromSymbol (symbol) {
  if (SUPPORTED_SYMBOLS[symbol] === SUPPORTED_SYMBOLS.BTC) return (parseInt(BTC_FEE_PER_KW, 10) / 1000000)
  if (SUPPORTED_SYMBOLS[symbol] === SUPPORTED_SYMBOLS.LTC) return (parseInt(LTC_FEE_PER_KW, 10) / 1000000)
}

/**
 * Executes a connection and opens a channel w/ another lnd instance
 *
 * @param {String} host
 * @param {String} publicKey - LN identity_publickey
 * @param {String} fundingAmount - int64 string
 * @param {String} symbol - ticker symbol
 * @returns {Promise<boolean>} returns true on success
 */
async function createChannel (host, publicKey, fundingAmount, symbol) {
  if (!Object.values(SUPPORTED_SYMBOLS).includes(symbol)) {
    throw new Error(`Symbol is not currently supported on the engine: ${symbol}`)
  }

  // TODO check the funding defaults (usually 20000 satosh) and fail before contacting
  // LND
  this.logger.debug(`Attempting to create channel with ${host}`)

  await connectPeer(publicKey, host, { client: this.client, logger: this.logger })

  this.logger.debug(`Successfully connected to peer: ${host}`)

  const channelInfo = await openChannel(publicKey, fundingAmount, { client: this.client })

  this.logger.debug(`Successfully opened channel with: ${host}`)

  // TODO: support multiple currencies
  const feeRate = feeRateFromSymbol(symbol)

  if (!feeRate) {
    this.logger.error('Unable to generate fee from provided symbol')
    return false
  }

  const chanPoint = generateChanPointFromChannelInfo(channelInfo)

  if (!chanPoint) {
    this.logger.error('Unable to generate chanpoint w/ openChannel info', { channelInfo })
    return false
  }

  // Updates a channel policy after a given amount of time (ONLY FOR SIMNET)
  if (process.env.NODE_ENV !== 'production') {
    setTimeout(async () => {
      this.logger.debug('Updating channel point', { chanPoint, feeRate })
      await updateChannelPolicy(chanPoint, feeRate, { client: this.client })
    }, 30000)
  }

  return true
}

module.exports = createChannel
