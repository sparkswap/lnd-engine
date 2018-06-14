const {
  queryRoutes,
  sendToRoute
} = require('../lnd-actions')

/**
 * Given a public key and channel id, we make a payment to the specified channel
 *
 * @param {String} channelId
 * @param {String} destinationPublicKey
 * @param {String} paymentRequest
 * @returns {True} success
 */
async function payChannel (channelId, destinationPublicKey, paymentRequest) {
  const { hops = [] } = await queryRoutes(destinationPublicKey, { client: this.client })

  // Channel ID should be unique, so there is only one id ever returned from hops.find
  const route = hops.find(h => h.chanId === channelId)

  if (!route) {
    this.logger.error(`Failed to find route based off of channel id: ${channelId}`)
    throw new Error(`Failed to find specified channel: ${channelId}`)
  }

  const { paymentError } = await sendToRoute(paymentRequest, route, { client: this.client })

  if (paymentError) {
    this.logger.error('Failed to pay channel', { destinationPublicKey })
    throw new Error(paymentError)
  }

  this.logger.debug('Payment successfully made', { paymentRequest, channelId })

  return true
}

module.exports = payChannel
