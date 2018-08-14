const {
  listChannels,
  closeChannel
} = require('../lnd-actions')
/**
 * Closes a channel given the channel point
 *
 * @param {Object} options
 * @param {Object} [options.force=false] force is true if you want to force close channels, false if not
 * @returns {Promise<Array.<Object>>}
 */
async function closeChannels ({ force = false } = {}) {
  const { channels = [] } = await listChannels({ client: this.client })

  if (channels.length === 0) {
    this.logger.debug('closeChannels: No channels exist')
    return []
  }

  const activeChannels = channels.filter(c => c.active === true)

  if (activeChannels.length === 0) {
    this.logger.debug('closeChannels: No active channels exist')
    return []
  }

  const closedChannelResponses = await Promise.all(activeChannels.map(channel => close(channel, force, this.client, this.logger)))

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
