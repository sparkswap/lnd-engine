const {
  getTransactions,
  listClosedChannels,
  listPendingChannels,
  listChannels
} = require('../lnd-actions')
const { Big } = require('../utils')

/**
 * @constant
 * @type {Object}
 * @default
 */
const TRANSACTION_TYPES = Object.freeze({
  CHANNEL_OPEN: 'CHANNEL_OPEN',
  CHANNEL_CLOSE: 'CHANNEL_CLOSE',
  DEPOSIT: 'DEPOSIT',
  WITHDRAW: 'WITHDRAW',
  UNKNOWN: 'UNKNOWN'
})

/**
 * Gets all opening and closing transaction ids from a list of channels.
 * @param {Object} channels
 * @returns {Set} channelTxIds
 */
async function getTxIdsForChannels (channels) {
  return channels.reduce((channelTxIds, { closingTxHash, channelPoint }) => {
    const [ openingTxHash ] = channelPoint.split(':') // eslint-disable-line

    // The closingTxHash will be missing from open or pending channels
    if (closingTxHash) {
      channelTxIds.add(closingTxHash)
    }

    channelTxIds.add(openingTxHash)
    return channelTxIds
  }, new Set())
}

/**
 * Gets closing transaction fees from closed channel objects
 * @param {Object} closedChannels
 * @returns {Set} closedChannelFees
 */
async function getFeesForClosedChannels (closedChannels) {
  return closedChannels.reduce((closedChannelFees, { closingTxHash, capacity, settledBalance }) => {
    // A closed channel would not have a closingTxHash if the we are looking at a
    // pending closed channel
    if (closingTxHash) {
      // We can calculate the fees that were incurred when closing a channel by taking
      // the capacity minus the settled balance. When we call LND to get transactions,
      // the fee for a channel closing will not be present so we need to calculate it
      // here
      closedChannelFees.set(closingTxHash, Big(capacity).minus(settledBalance).toString())
    }
    return closedChannelFees
  }, new Map())
}

/**
 * @param {string} amount
 * @param {boolean} isChannel
 * @param {boolean} isClosedChannel
 * @returns {TRANSACTION_TYPES} type
 */
function determineTransactionType (amount, isChannel, isClosedChannel) {
  // A channel close will have a positive balance as we are putting currency back
  // into our wallet from the payment channel and will be listed in LNDs closed channels
  if (Big(amount).gt(0) && isClosedChannel) {
    return TRANSACTION_TYPES.CHANNEL_CLOSE
  }

  // A channel open will have a negative balance to show for funds that are being
  // put into the payment channels and will be listed in LNDs channel db
  if (Big(amount).lt(0) && isChannel) {
    return TRANSACTION_TYPES.CHANNEL_OPEN
  }

  // Since we've already checked `gt` balances w/ closed channels, we can assume
  // that any credit will be an on-chain deposit
  if (Big(amount).gt(0)) {
    return TRANSACTION_TYPES.DEPOSIT
  }

  // Since we've already checked `gt` balances w/ closed channels, we can assume
  // that any debit will be an on-chain withdraw
  if (Big(amount).lt(0)) {
    return TRANSACTION_TYPES.WITHDRAW
  }

  // If we do not hit any of the types above, then we can return unknown.
  return TRANSACTION_TYPES.UNKNOWN
}

/**
 * Gets all on-chain transactions for the engine
 * @returns {Array<Object>} res
 */
async function getChainTransactions () {
  const { transactions } = await getTransactions({ client: this.client })

  if (!Array.isArray(transactions) || !transactions.length) {
    this.logger.debug('No transactions exist on the engine')
    return []
  }

  // Get all channels from the engine (rough)
  const [
    { channels: rawChannels },
    { channels: rawClosedChannels },
    {
      pendingOpenChannels: rawPendingOpenChannels,
      pendingClosingChannels: rawPendingClosingChannels,
      pendingForceClosingChannels: rawPendingForceClosingChannels,
      waitingCloseChannels: rawWaitingCloseChannels
    }
  ] = await Promise.all([
    listChannels({ client: this.client }),
    listClosedChannels({ client: this.client }),
    listPendingChannels({ client: this.client })
  ])

  const openChannels = [
    ...rawChannels,
    // Pending channels have a different structure than our typical Channel object
    // so we need to grab the channel off of the raw payload
    ...rawPendingOpenChannels.map(chan => chan.channel)
  ]

  const closedChannels = [
    ...rawClosedChannels,
    // Pending channels have a different structure than our typical Channel object
    // so we need to grab the channel off of the raw payload
    ...rawPendingClosingChannels.map(chan => chan.channel),
    ...rawPendingForceClosingChannels.map(chan => chan.channel),
    ...rawWaitingCloseChannels.map(chan => chan.channel)
  ]

  const pendingChannels = [
    ...rawPendingOpenChannels.map(chan => chan.channel),
    ...rawPendingClosingChannels.map(chan => chan.channel),
    ...rawPendingForceClosingChannels.map(chan => chan.channel),
    ...rawWaitingCloseChannels.map(chan => chan.channel)
  ]

  const [
    closedChannelTxIds,
    closedChannelFees,
    openChannelTxIds,
    pendingChannelTxIds
  ] = await Promise.all([
    getTxIdsForChannels(closedChannels),
    getFeesForClosedChannels(rawClosedChannels),
    getTxIdsForChannels(openChannels),
    getTxIdsForChannels(pendingChannels)
  ])

  return transactions.map(({ txHash, amount, blockHeight, timeStamp, totalFees }) => {
    const isClosedChannel = closedChannelTxIds.has(txHash)
    const isChannel = (openChannelTxIds.has(txHash) || closedChannelTxIds.has(txHash))
    const type = determineTransactionType(amount, isChannel, isClosedChannel)

    // Determine is the transaction is pending. Having a blockHeight of 0 means
    // that the transaction has not yet been placed into a block (no confirmations)
    const isPending = (Big(blockHeight).eq(0) || pendingChannelTxIds.has(txHash))

    // `totalFees` will be zero if this is a CHANNEL_CLOSE transaction type
    let fees = Big(totalFees)

    // If we've identified the type of transaction as channel close then `totalFees`
    // will be 0. We calculate the fee based on information from the closing transaction
    // but this is only available if the transaction has hit the blockchain
    if (type === TRANSACTION_TYPES.CHANNEL_CLOSE && !isPending) {
      // TODO: Only re-assign `fees` if we are the initiator of the channel.
      fees = Big(closedChannelFees.get(txHash))
    }

    // Convert the timestamp, seconds after epoch, into an ISO8601 string so that
    // it is more readable
    let timestamp = timeStamp

    // Check to make sure the timestamp exists and then parse the date, to make
    // sure we are not throwing an error if this transaction is in a pending status
    if (timeStamp) {
      const unixTimestamp = new Date(0).setUTCSeconds(timeStamp)
      timestamp = new Date(unixTimestamp).toISOString()
    }

    return {
      type,
      amount: Big(amount).div(this.quantumsPerCommon).toFixed(8),
      transactionHash: txHash,
      blockHeight,
      timestamp,
      fees: fees.div(this.quantumsPerCommon).toFixed(8),
      pending: isPending
    }
  })
}

module.exports = getChainTransactions
