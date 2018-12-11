const {
  listChannels,
  listPendingChannels,
  closeChannel
} = require('../lnd-actions')

/**
 * Closes active channels on the given engine. Will try to close inactive/pending channels
 * if `force` option is given
 *
 * @param {Object} options
 * @param {Object} [options.force=false] force is true if you want to force close all channels, false if not
 * @returns {Promise<void>} returns void on success
 * @throws {Error} Inactive/Pending channels exist and can not be closed unless 'force' is set to true
 */
async function closeChannels ({ force = false } = {}) {
  const [
    { channels: openChannels = [] } = {},
    { pendingOpenChannels = [] } = {}
  ] = await Promise.all([
    // The response from listChannels consists of channels that may be active or inactive
    listChannels({ client: this.client }),
    listPendingChannels({ client: this.client })
  ])

  if (!openChannels.length && !pendingOpenChannels.length) {
    this.logger.debug('closeChannels: No channels exist')
    return
  }

  this.logger.debug('Received channels from engine: ', { openChannels, pendingOpenChannels })

  const activeChannels = openChannels.filter(chan => chan.active)
  const inactiveChannels = openChannels.filter(chan => !chan.active)

  // By default, we will always try to cancel active channels
  let channelsToClose = activeChannels

  // If we are force-closing channels, then we are safe to add inactive and pending
  // channels to be closed
  if (force) {
    // We need to normalize pendingChannels here because their format is different
    // than those received from `listChannels`
    const pendingChannels = pendingOpenChannels.map(chan => chan.channel)

    channelsToClose = channelsToClose.concat(inactiveChannels)
    channelsToClose = channelsToClose.concat(pendingChannels)
  }

  const closedChannelResponses = await Promise.all(channelsToClose.map(channel => close(channel, force, this.client, this.logger)))

  if (force) {
    this.logger.debug('Successfully closed channels', closedChannelResponses)
  } else {
    this.logger.debug('Successfully closed active channels', closedChannelResponses)
  }

  // If we have attempted to close channels, but still have inactive or pending channels
  // on the engine, then we want to fail and let the consumer know that they must force close
  // these channels in order to release ALL funds
  if (!force && (inactiveChannels.length || pendingOpenChannels.length)) {
    throw new Error('Inactive/pending channels exist. You must use `force` to close')
  }
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
