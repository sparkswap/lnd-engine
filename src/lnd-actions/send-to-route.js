const { deadline } = require('../grpc-utils')

/**
 * Sends a payment to a specified route
 *
 * @function
 * @see {@link https://github.com/lightningnetwork/lnd/blob/master/lnrpc/rpc.proto}
 * @param {String} paymentHash
 * @param {Object} route - an lnd route (more info in lnd proto)
 * @return {Promise}
 */
function sendToRoute (paymentHash, route, { client }) {
  const routes = [route]

  return new Promise((resolve, reject) => {
    client.SendToRouteSync({ paymentHash, routes }, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = sendToRoute
