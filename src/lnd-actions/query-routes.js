const { deadline } = require('../grpc-utils')

/**
 * Returns all lightning network hops for a specified public key
 *
 * @function
 * @see {@link https://api.lightning.community/#queryroutes}
 * @param {String} pubKey
 * @return {Promise}
 */
function queryRoutes (pubKey, { client }) {
  return new Promise((resolve, reject) => {
    client.queryRoutes({ pubKey }, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = queryRoutes
