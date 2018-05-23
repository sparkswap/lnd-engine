/**
 * Channels
 * @module src/lnd-actions/channels
 */

const { deadline } = require('../grpc-utils')

/**
 * Open a channel w/ LND
 *
 * @param {String} publicKey - lnd public key to open channel with
 * @param {String} fundingAmount - the amount to fund the channel w/
 */
function open (publicKey, fundingAmount) {
  const params = {
    nodePubKey: publicKey,
    localFundingAmount: fundingAmount
  }

  return new Promise((resolve, reject) => {
    this.client.openChannelSync(params, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)

      this.logger.debug('Received response from lnd: ', res)

      // TODO: Remove this because it is unneeded?
      // specifically, I think we'll have to make another call to get the channel
      // id as it is not returned in the call itself
      const { outputIndex } = res

      return resolve(outputIndex)
    })
  })
}

module.exports = {
  open
}
