/** @typedef {import('../lnd-setup').LndClient} LndClient */
/** @typedef {import('grpc').ClientReadableStream} ClientReadableStream */

/**
 * Sends to a specified route
 *
 * @see https://github.com/lightningnetwork/lnd/blob/master/lnrpc/rpc.proto#L422
 * @param {object} opts
 * @param {LndClient} opts.client
 * @returns {ClientReadableStream}
 */
function sendToRoute ({ client }) {
  return client.sendToRoute({})
}

module.exports = sendToRoute
