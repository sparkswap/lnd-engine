const { deadline } = require('../grpc-utils')
/**
 * @typedef {Object} FeeLimit
 * @property {String} fixed Int64 string of max number of satoshis to pay in fees
 */

/**
 * Find available routes to a destination
 *
 * @function
 * @param {String}   params.pubKey         Public key of the node to find routes to
 * @param {String}   params.amt            Number of satoshis to send
 * @param {Number}   params.numRoutes      Max number of routes to return
 * @param {Number}   params.finalCltvDelta CLTV delta to be used for the final hop
 * @param {FeeLimit} params.feeLimit       Fee Limit
 * @param {LND}      opts.client           LND client to use
 * @return {Promise}
 */
function queryRoutes ({ pubKey, amt, numRoutes, finalCltvDelta, feeLimit }, { client }) {
  return new Promise((resolve, reject) => {
    try {
      client.queryRoutes({ pubKey, amt, numRoutes, finalCltvDelta, feeLimit }, { deadline: deadline() }, (err, res) => {
        if (err) return reject(err)
        return resolve(res)
      })
    } catch (e) {
      reject(e)
    }
  })
}

module.exports = queryRoutes
