/**
 * Sends to a specified route
 *
 * @see https://github.com/lightningnetwork/lnd/blob/master/lnrpc/rpc.proto#L422
 * @param {Object} opts
 * @param {LndClient} opts.client
 * @returns {ReadableStream}
 */
function sendToRoute ({ client }) {
  return client.sendToRoute({})
}

module.exports = sendToRoute
