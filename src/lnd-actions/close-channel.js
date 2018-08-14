/**
 * Close a channel w/ LND
 * @see {@link http://api.lightning.community/#closechannel}
 *
 * @param {Object} channelPoint { fundingTxidStr, outputIndex } to identify the channel to be closed
 * @param {Boolean} force - true if we want to force close the channel, false if not (defaults to false)
 * @param {Object} options
 * @param {Object} options.client - lnd client
 * @return {ReadableStream} Readable stream from gprc
 */
function closeChannel (channelPoint, force, { client }) {
  return client.closeChannel({ channelPoint, force })
}

module.exports = closeChannel
