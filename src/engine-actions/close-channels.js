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
  const closedChannelResponses = await Promise.all(channels.map(channel => close(channel)))
  this.logger.debug(`Successfully closed channel`)
  return closedChannelResponses
}

async function close (channel) {
  console.log('client', this.client)
  return new Promise(async (resolve, reject) => {
    try {
      console.log('channelPoint and client test')
      console.log(channel.channelPoint)
      console.log(this.client)
      const close = closeChannel(channel.channelPoint, false, { client: this.client })

      const errorListener = (err) => {
        this.logger.error(`Error from closeChannel stream`, err)
        return finish(err)
      }

      const endListener = () => {
        const error = `LND closed closeChannel stream before returning our value`
        this.logger.error(error)
        return finish(new Error(error))
      }

      const dataListener = (response) => {
        // see what the response is before figuring out the return
        this.logger.info(response)
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
