const { deadline } = require('../grpc-utils')

/** @typedef {import('../lnd-setup').LndClient} LndClient */

/**
 * @typedef {Object} FeeLimit
 * @property {String} fixed
 */

/**
 * Find available routes to a destination
 *
 * @function
 * @param {Object} params
 * @param {string}  params.pubKey         - Public key of the node to find routes to
 * @param {string}  params.amt            - Number of satoshis to send
 * @param {number}  params.numRoutes      - Max number of routes to return
 * @param {number}  params.finalCltvDelta - CLTV delta to be used for the final hop
 * @param {FeeLimit} params.feeLimit      - Int64 string of max number of satoshis to pay in fees
 * @param {Object} opts
 * @param {LndClient} opts.client
 * @returns {Promise}
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
