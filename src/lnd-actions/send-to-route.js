const { deadline } = require('../grpc-utils')

/**
 * Sends to a specified route
 *
 * @function
 * @see {@link https://github.com/lightningnetwork/lnd/blob/master/lnrpc/rpc.proto#L422}
 * @param {String} paymentHash payment hash of the send
 * @param {Array} routes Routes to send to
 * @return {Promise}
 */
function sendToRoute (paymentHash, routes, { client }) {
  return new Promise((resolve, reject) => {
    client.sendToRouteSync({ paymentHash, routes }, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = sendToRoute
