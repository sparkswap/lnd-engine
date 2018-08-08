/**
 * Open a channel w/ LND
 *
 * @param {String} publicKey - lnd public key to open channel with
 * @param {String} fundingAmount - the amount to fund the channel w/
 * @return {Promise}
 */
function closeChannel (channelPoint, force, { client }) {
  return client.closeChannel({ channelPoint, force })
}

module.exports = closeChannel
