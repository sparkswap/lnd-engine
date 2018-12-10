const {
  connectPeer,
  openChannel
} = require('../lnd-actions')
const {
  Big,
  networkAddressFormatter
} = require('../utils')
const {
  getUncommittedBalance
} = require('./index')

/**
 * Executes a connection and opens a channel w/ another lnd instance
 *
 * @param {String} paymentChannelNetworkAddress
 * @param {String} fundingAmount - int64 string
 * @returns {Promise<void>} returns void on success
 */
async function createChannel (paymentChannelNetworkAddress, fundingAmount) {
  // A very archaic fee estimation amount. These numbers were taken from default
  // values on the fee estimators located in `bitcoind` and `litecoind` respectively.
  //
  // Equivalent USD to <currency> at current market Dec 10 2018:
  // LTC: $0.48 USD or 2000000 litoshis
  // BTC: $0.68 USD or 20000 satoshis
  //
  // TODO: Expose fee estimation in LND to provide a better way to estimate fees
  //       for the user
  const { feeEstimate } = this.currencyConfig

  if (!feeEstimate) {
    throw new Error(`Currency configuration for ${this.symbol} has not been setup with a fee estimate`)
  }

  const { publicKey, host } = networkAddressFormatter.parse(paymentChannelNetworkAddress)

  this.logger.debug(`Attempting to create channel with ${host}`)

  await connectPeer(publicKey, host, { client: this.client, logger: this.logger })

  this.logger.debug(`Successfully connected to peer: ${host}`)

  // We add fees onto the funding amount and make sure the user has enough funds for
  // the transaction, if they do not, we will then subtract the feeEstimate from
  // their `fundingAmount` and try to open a channel.
  //
  // This allows the user to create channels with the max limit of funds OR allows
  // the user to create the largest possible channel accounting for the opening
  // and closing transactions
  const balance = await getUncommittedBalance.call(this)
  const balanceWithFeeEstimate = Big(fundingAmount).plus(feeEstimate)

  if (balanceWithFeeEstimate.gt(balance)) {
    const fundingAmountSubFees = Big(fundingAmount).minus(feeEstimate).toString()
    await openChannel(publicKey, fundingAmountSubFees, { client: this.client })
  } else {
    await openChannel(publicKey, fundingAmount, { client: this.client })
  }

  this.logger.debug(`Successfully opened channel with: ${host}`)
}
module.exports = createChannel
