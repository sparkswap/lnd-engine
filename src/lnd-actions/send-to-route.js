/**
 * Sends to a specified route
 *
 * @function
 * @see {@link https://github.com/lightningnetwork/lnd/blob/master/lnrpc/rpc.proto#L422}
 * @return {ReadableStream}
 */
function sendToRoute ({ client }) {
  return client.sendToRoute({})
}

module.exports = sendToRoute
