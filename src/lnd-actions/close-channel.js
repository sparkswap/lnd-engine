/** @typedef {import('../lnd-setup').LndClient} LndClient */
/** @typedef {import('grpc').ClientReadableStream} ClientReadableStream */

/**
 * Close a channel w/ LND
 * @see http://api.lightning.community/#closechannel
 *
 * @param {object} channelPoint - { fundingTxidStr, outputIndex } to identify the channel to be closed
 * @param {boolean} force - true if we want to force close the channel, false if not (defaults to false)
 * @param {object} opts
 * @param {LndClient} opts.client
 * @returns {ClientReadableStream}
 */
function closeChannel (channelPoint, force, { client }) {
  return client.closeChannel({ channelPoint, force })
}

module.exports = closeChannel
