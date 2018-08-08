const {
  listChannels,
  closeChannel
} = require('../lnd-actions')
/**
 * Closes a channel given the channel point
 *
 * @param {String} paymentChannelNetworkAddress
 * @param {String} fundingAmount - int64 string
 * @returns {Promise<void>} returns void on success
 */
async function closeChannels ({ force = false } = {}) {
  const { channels = [] } = await listChannels({ client: this.client })
  const closedChannelResponses = await Promise.all(channels.map(channel => close(channel, this.client, this.logger)))
  this.logger.debug(`Successfully closed channel`)
  return closedChannelResponses
}

async function close (channel, client, logger) {
  return new Promise(async (resolve, reject) => {
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
        // see what the response is before figuring out the return
        logger.info(JSON.stringify(response))
        return finish(response)
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
