const {
  listChannels,
  listPendingChannels,
  closeChannel
} = require('../lnd-actions')

/**
 * Closes active channels on the given engine. Will try to close all channels
 * if `force` option is given
 *
 * @param {Object} options
 * @param {Object} [options.force=false] force is true if you want to force close channels, false if not
 * @returns {Promise<Array.<Object>>}
 */
async function closeChannels ({ force = false } = {}) {
  // This consists of channels that may be active or inactive
  const { channels: openChannels = [] } = await listChannels({ client: this.client })

  // We start by only including active channels to be closed
  let channelsToClose = openChannels.filter(c => c.active === true)

  // If we want to force close channels, we will include inactive and pending channels
  // as these two types can only be closed w/ the force flag, resulting in a more
  // thorough returning of funds
  if (force) {
    const { pendingOpenChannels = [] } = await listPendingChannels({ client: this.client })
    const inactiveChannels = openChannels.filter(c => c.active === false)
    channelsToClose = channelsToClose.concat(pendingOpenChannels)
    channelsToClose = channelsToClose.concat(inactiveChannels)
  }

  if (channelsToClose.length === 0) {
    this.logger.debug('closeChannels: No channels exist')
    return []
  }

  const closedChannelResponses = await Promise.all(channelsToClose.map(channel => close(channel, force, this.client, this.logger)))

  this.logger.info('Successfully closed channels', closedChannelResponses)

  return closedChannelResponses
}

async function close (channel, force, client, logger) {
  return new Promise((resolve, reject) => {
    try {
      const [fundingTxidStr, outputIndex] = channel.channelPoint.split(':')
      const channelPoint = {
        fundingTxidStr,
        outputIndex: parseInt(outputIndex)
      }
      const close = closeChannel(channelPoint, force, { client })

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

      const errorListener = (err) => {
        logger.error('Error from closeChannel stream', err)
        return finish(err)
      }

      const endListener = () => {
        const error = 'LND closed closeChannel stream before returning our value'
        logger.error(error)
        return finish(new Error(error))
      }

      const dataListener = (response) => {
        logger.info('Closing channel', response)
        return finish(null, response)
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
