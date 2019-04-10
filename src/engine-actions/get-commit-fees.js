const { Big } = require('../utils')
const { listChannels } = require('../lnd-actions')

/**
 * Get commit fees for all channels for a specific daemon
 *
 * @returns {string} totalCommitFees (int64)
 */
async function getCommitFees () {
  const { channels = [] } = await listChannels({ client: this.client })
  console.log('channels', channels)

  if (channels.length === 0) {
    this.logger.debug('getCommitFees: No channels exist')
    return Big(0).toString()
  }

  const totalCommitFees = channels.reduce((acc, c) => {
    // We include commit fees only if the channel was the initiator
    const commitFee = c.initiator ? Big(c.commitFee) : Big(0)
    return acc.plus(commitFee)
  }, Big(0))

  return totalCommitFees.toString()
}

module.exports = getCommitFees
