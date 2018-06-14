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
 * Executes a connection and opens a channel w/ another lnd instance
 *
 * @param {String} host
 * @param {String} publicKey - LN identity_publickey
 * @param {String} fundingAmount - int64 string
 * @param {String} symbol - ticker symbol
 * @returns {True} success
 */
async function createChannel (host, publicKey, fundingAmount, symbol) {
  // TODO check the funding defaults (usually 20000 satosh) and fail before contacting
  // LND
  this.logger.debug(`Attempting to create channel with ${host}`)

  await connectPeer(publicKey, host, { client: this.client, logger: this.logger })

  this.logger.debug(`Successfully connected to peer: ${host}`)

  const chanPoint = await openChannel(publicKey, fundingAmount, { client: this.client })

  this.logger.debug(`Successfully opened channel with: ${host}`)

  if (!Object.values(SUPPORTED_SYMBOLS).includes(symbol)) {
    throw new Error(`Symbol is not currently supported on the engine: ${symbol}`)
  }

  const feeRate = SUPPORTED_SYMBOLS[symbol] === 'BTC' ? BTC_FEE_PER_KW : LTC_FEE_PER_KW

  await updateChannelPolicy(chanPoint, feeRate)

  return true
}

module.exports = createChannel
