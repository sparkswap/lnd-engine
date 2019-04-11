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

  // We filter for channels where the engine was the initiator because available balances for
  // a channel are calculated less commit fees when a party was the initiator. The rationale of
  // this calculation is to put the responsibility on the initiator for paying fees on a force-close
  const initiatorChannels = channels.filter(c => c.initiator)
  const totalCommitFees = initiatorChannels.reduce((acc, c) => {
    return acc.plus(Big(c.commitFee))
  }, Big(0))

  return totalCommitFees.toString()
}

module.exports = getTotalCommitFees
