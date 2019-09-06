const {
  connectPeer,
  openChannel
} = require('../lnd-actions')
const {
  Big,
  networkAddressFormatter,
  loggablePubKey
} = require('../utils')
const getUncommittedBalance = require('./get-uncommitted-balance')
const { CHANNEL_ROUNDING } = require('../constants')

/**
 * Default number of seconds before our first confirmation. (30 minutes)
 * @type {number}
 */
const DEFAULT_CONFIRMATION_DELAY = 1800

/** @typedef {import('..').Engine} Engine */

/**
 * Determine the amount to fund channels with by taking into account
 * uneconomic channels (that are too small to be worth it.)
 *
 * @private
 * @param   {Engine} engine
 * @param   {string} fundingAmount - int64 string of amount desired to open
 * @param   {string} roundBehavior - Behavior to use when encoutnering a channel that is too small.
 * @returns {typeof Big}                    Modified amount to open in channels
 */
function getAmountForChannels (engine, fundingAmount, roundBehavior) {
  const {
    maxChannelBalance,
    minChannelBalance,
    quantumsPerCommon,
    symbol,
    logger
  } = engine

  let amount = Big(fundingAmount)

  if (amount.eq(0)) {
    throw new Error(`Funding amount of 0 ${symbol} is invalid.`)
  }

  // our last channel will be our only channel not at maxChannelBalance, so we need to handle it separately
  const lastChannelBalance = amount.mod(maxChannelBalance)

  // short-circuit if our last channel does not exist or is of sufficient size
  if (lastChannelBalance.gte(minChannelBalance) || lastChannelBalance.eq(0)) {
    return amount
  }

  logger.debug('Last channel would result in an uneconomic channel balance.', {
    fundingAmount,
    lastChannelBalance
  })

  // find the nearest funding amounts that would not trigger the uneconomic channel
  const lowFundingAmount = amount.minus(lastChannelBalance)
  const highFundingAmount = lowFundingAmount.plus(minChannelBalance)

  if (roundBehavior === CHANNEL_ROUNDING.ERROR) {
    throw new Error(`Funding amount would result in an uneconomic channel balance. ` +
      `Try either ${lowFundingAmount.div(quantumsPerCommon).toString()} ${symbol} ` +
      `or ${highFundingAmount.div(quantumsPerCommon).toString()} ${symbol}.`)
  }

  if (roundBehavior === CHANNEL_ROUNDING.DOWN) {
    logger.debug('Rounding down to avoid uneconomic channel balance.', {
      fundingAmount,
      lowFundingAmount: lowFundingAmount.toString()
    })
    if (lowFundingAmount.lte(0)) {
      throw new Error(`Funding amount ${amount.div(quantumsPerCommon).toString()} ${symbol} ` +
        `too small for minimum channel balance of ${Big(minChannelBalance).div(quantumsPerCommon)} ${symbol}.`)
    }
    return lowFundingAmount
  }

  if (roundBehavior === CHANNEL_ROUNDING.UP) {
    logger.debug('Rounding up to avoid uneconomic channel balance.', {
      fundingAmount,
      highFundingAmount: highFundingAmount.toString()
    })
    return highFundingAmount
  }

  throw new Error(`Invalid round behavior: ${roundBehavior}. Must be one of ${Object.values(CHANNEL_ROUNDING)}.`)
}

/**
 * Check that the balance in the engine can cover the desired funding amount
 *
 * @private
 * @param   {Engine} engine
 * @param   {string} fundingAmount - Int64 string of desired funding amount
 * @returns {Promise<void>}
 * @throws  {Error} If Balance is insufficient to cover amount and fees
 */
async function assertBalanceIsSufficient (engine, fundingAmount) {
  const {
    maxChannelBalance,
    quantumsPerCommon,
    feeEstimate,
    symbol,
    logger
  } = engine

  const amount = Big(fundingAmount)

  // round up to find the number of channels to open
  // See: https://mikemcl.github.io/big.js/#round
  const channelsToOpen = amount.div(maxChannelBalance).round(0, 3)

  // We add fees onto the funding amount and make sure the user has enough funds for
  // the transaction, if they do not, error out so we avoid opening some, but not all channels.
  const balance = await getUncommittedBalance.call(engine)
  const balanceCommon = Big(balance).div(quantumsPerCommon).toString()
  const totalFeesEstimate = Big(feeEstimate).times(channelsToOpen)
  const fundingAmountWithFees = amount.plus(totalFeesEstimate)

  logger.debug('Received balance information', {
    balance,
    fundingAmountWithFees: fundingAmountWithFees.toString()
  })

  if (fundingAmountWithFees.gt(balance)) {
    logger.error('Requested channel balance (plus fees) is larger than uncommitted balance', {
      balance,
      fundingAmountWithFees: fundingAmountWithFees.toString(),
      fundingAmount,
      symbol
    })

    // Find maximum estimated capacity given the fees we expect to pay
    const maxFundingAmount = Big(balance).minus(totalFeesEstimate).div(quantumsPerCommon).toString()

    throw new Error(`Requested funding amount exceeds available balance (${balanceCommon} ${symbol}). ` +
      `Maximum estimated funding amount: ${maxFundingAmount} ${symbol}.`)
  }
}

/**
 * Executes a connection and opens channels w/ another lnd instance
 *
 * @param {string} paymentChannelNetworkAddress
 * @param {string} fundingAmount - int64 string
 * @param {object} [options]
 * @param {string} [options.roundBehavior=CHANNEL_ROUNDING.DOWN] - Behavior when encountering a channel that is too small
 * @param {number} [options.targetTime=DEFAULT_CONFIRMATION_DELAY] - Estimated time to first confirmation in seconds (impacts the fee rate used to open channels)
 * @param {boolean} [options.privateChan=false] - Whether to make channels private
 * @returns {Promise<void>} resolves void on success
 */
async function createChannels (paymentChannelNetworkAddress, fundingAmount, {
  roundBehavior = CHANNEL_ROUNDING.DOWN,
  targetTime = DEFAULT_CONFIRMATION_DELAY,
  privateChan = false
} = {}) {
  const {
    feeEstimate,
    minChannelBalance,
    maxChannelBalance,
    secondsPerBlock,
    symbol,
    logger,
    client
  } = this

  if (!Object.values(CHANNEL_ROUNDING).includes(roundBehavior)) {
    throw new Error(`Invalid round behavior: ${roundBehavior}. Must be one of ${Object.values(CHANNEL_ROUNDING)}.`)
  }

  if (!feeEstimate) {
    throw new Error(`Currency configuration for ${symbol} has not been setup with a fee estimate`)
  }

  if (!maxChannelBalance) {
    throw new Error(`Currency configuration for ${symbol} has not been setup with a max channel balance`)
  }

  if (!minChannelBalance) {
    throw new Error(`Currency configuration for ${symbol} has not been setup with a min channel balance`)
  }

  if (!secondsPerBlock) {
    throw new Error(`Currency configuration for ${symbol} has not been setup with a secondsPerBlock`)
  }

  // Minimum of one block, but target lower than the specified time. This specifies the fee that will
  // be used to open the channel(s)
  const targetConf = Math.max(Math.floor(targetTime / secondsPerBlock), 1)

  // modify our funding amount based on the number of channels we're opening and the desired rounding behavior
  let amount = getAmountForChannels(this, fundingAmount, roundBehavior)

  // Check that we have sufficient balance to cover all of our channels
  await assertBalanceIsSufficient(this, amount)

  // round up to find the number of channels to open
  const channelsToOpen = amount.div(maxChannelBalance).round(0, 3)

  const { publicKey, host } = networkAddressFormatter.parse(paymentChannelNetworkAddress)
  const loggablePublicKey = loggablePubKey(publicKey)

  logger.debug(`Attempting to create ${channelsToOpen} channels with ${loggablePublicKey}`)

  await connectPeer(publicKey, host, { client, logger })

  logger.debug(`Successfully connected to peer: ${loggablePublicKey}`)

  // We loop over channels and create them synchronously (rather than all at once)
  // to try to avoid any issues with trying to open multiple channels simultaneously.
  for (let i = 0; i < channelsToOpen; i++) {
    // Open max size channels until the last channel
    let channelAmount = amount.gt(maxChannelBalance) ? maxChannelBalance : amount.toString()
    amount = amount.minus(channelAmount)

    logger.info(`Opening outbound channel`, {
      publicKey: loggablePublicKey,
      symbol,
      channelAmount,
      channelNum: i + 1
    })

    await openChannel({
      nodePubkey: publicKey,
      localFundingAmount: channelAmount,
      targetConf,
      private: privateChan
    }, { client })
  }

  logger.debug(`Successfully opened ${channelsToOpen} channels with: ${loggablePublicKey}`)
}

module.exports = createChannels
