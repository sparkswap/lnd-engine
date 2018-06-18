const { deadline } = require('../grpc-utils')

/**
 * Sends to a specified route
 *
 * @function
 * @see {@link https://github.com/lightningnetwork/lnd/blob/master/lnrpc/rpc.proto#L422}
 * @param {String} paymentHash payment hash of the send (base64 encoded)
 * @param {Array} routes Routes to send to
 * @return {Promise}
 */
function sendToRoute (paymentHash, routes, { client }) {
  return new Promise((resolve, reject) => {
    /** Although the LND RPC proto suggest that it supports a `bytes` parameter of `paymentHash`
     * It does not pass through correctly when using `SendToRouteSync` and rejects as an invalid payment hash
     * @see {@link https://github.com/lightningnetwork/lnd/blob/master/rpcserver.go#L2356}
     * @see {@link https://trello.com/c/lc3URJ4G/335-submit-bugfix-for-lnd-sendtoroutesync-paymenthash}
     */
    try {
      const paymentHashString = Buffer.from(paymentHash, 'base64').toString('hex')

      // need a longer timeout for this - it takes awhile
      client.sendToRouteSync({ paymentHashString, routes }, { deadline: deadline(10) }, (err, res) => {
        if (err) return reject(err)
        return resolve(res)
      })
    } catch (e) {
      reject(e)
    }
  })
}

module.exports = sendToRoute
