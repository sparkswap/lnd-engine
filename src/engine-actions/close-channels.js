const {
  listChannels,
  closeChannel,
  listPendingChannels
} = require('../lnd-actions')
/**
 * Closes a channel given the channel point
 *
 * @param {String} paymentChannelNetworkAddress
 * @param {String} fundingAmount - int64 string
 * @returns {Promise<void>} returns void on success
 */
async function closeChannels ({ force = false, pending = false } = {}) {
  const { channels = [] } = await listChannels({ client: this.client })
  const activeChannels = channels.filter(c => c.active)

  let inactiveChannels = []
  if (force === true) {
    inactiveChannels = channels.filter(c => c.active === false)
  }

  let pendingChannels = []
  if (pending === true) {
    const { pendingOpenChannels = [] } = await listPendingChannels({ client: this.client })
    pendingChannels = pendingOpenChannels
  }
  const closedChannelResponses = await Promise.all(activeChannels.concat(inactiveChannels).map(channel => close(channel, this.client, this.logger)))
  const closedPendingChannelResponses = await Promise.all(pendingChannels.map(channel => close(channel.channel, this.client, this.logger)))

  const allClosedChannels = closedChannelResponses.concat(closedPendingChannelResponses)
  this.logger.info('Successfully closed channels', allClosedChannels)
  return allClosedChannels
}

async function close (channel, client, logger) {
  return new Promise((resolve, reject) => {
    try {
      const [fundingTxidStr, outputIndex] = channel.channelPoint.split(':')
      const channelPoint = {
        fundingTxidStr,
        outputIndex: parseInt(outputIndex)
      }
      const close = closeChannel(channelPoint, false, { client })

      const errorListener = (err) => {
        logger.error(`Error from closeChannel stream`, err)
        return finish(err)
      }

      const endListener = () => {
        const error = `LND closed closeChannel stream before returning our value`
        logger.error(error)
        return finish(new Error(error))
      }

      const dataListener = (response) => {
        logger.info('Closing channel', response)
        return finish(null, response)
      }

      // Helper to make sure we tear down our listeners
      const finish = (err, response) => {
        close.removeListener('error', errorListener)
        close.removeListener('end', endListener)
        close.removeListener('data', dataListener)

        if (err) {
          return reject(err)
        }

        resolve(response)
      }

      close.on('error', errorListener)
      close.on('end', endListener)
      close.on('data', dataListener)
    } catch (e) {
      return reject(e)
    }
  })
}

module.exports = closeChannels
