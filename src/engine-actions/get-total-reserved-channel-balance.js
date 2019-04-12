const { Big } = require('../utils')
const { listChannels } = require('../lnd-actions')

/**
 * Get total reserved channel balance for all channels for a specific daemon.
 *
 * Note: For LND, the commitFee for an initiator is the only balance currently reserved.
 *
 * @returns {string} totalReservedChannelBalance (int64)
 */
async function getTotalReservedChannelBalance () {
  const { channels = [] } = await listChannels({ client: this.client })

  // We filter for channels where the engine was the initiator because available balances for
  // a channel are calculated less commit fees when a party was the initiator. The rationale of
  // this calculation is to put the responsibility on the initiator to pay for a force-close
  const initiatorChannels = channels.filter(c => c.initiator)
  this.logger.debug(`getTotalReservedChannelBalance: ${channels.length} channels exist, ${initiatorChannels.length} channels as initiator`)

  const totalReservedChannelBalance = initiatorChannels.reduce((acc, c) => {
    return acc.plus(c.commitFee)
  }, Big(0))

  return totalReservedChannelBalance.toString()
}

module.exports = getTotalReservedChannelBalance
