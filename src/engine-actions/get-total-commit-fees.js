const { Big } = require('../utils')
const { listChannels } = require('../lnd-actions')

/**
 * Get total commit fees for all channels for a specific daemon
 *
 * @returns {string} totalCommitFees (int64)
 */
async function getTotalCommitFees () {
  const { channels = [] } = await listChannels({ client: this.client })

  if (channels.length === 0) {
    this.logger.debug('getCommitFees: No channels exist')
    return Big(0).toString()
  }

  // We include commit fees only if the channel was the initiator
  const initiatorChannels = channels.filter(c => c.initiator)
  const totalCommitFees = initiatorChannels.reduce((acc, c) => {
    return acc.plus(Big(c.commitFee))
  }, Big(0))

  return totalCommitFees.toString()
}

module.exports = getTotalCommitFees
