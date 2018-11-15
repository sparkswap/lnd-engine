/**
 * Sends to a specified route
 *
 * @function
 * @see {@link https://github.com/lightningnetwork/lnd/blob/master/lnrpc/rpc.proto#L422}
 * @param {String} paymentHash payment hash of the send (base64 encoded)
 * @param {Array} routes Routes to send to
 * @return {ReadableStream}
 */
function sendToRoute (paymentHash, routes, { client }) {
  return client.sendToRoute({ paymentHash, routes })
}

module.exports = sendToRoute
