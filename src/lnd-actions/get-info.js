const { deadline } = require('../grpc-utils')

/**
 * Queries LND for its public key
 *
 * @see http://api.lightning.community/#getInfo
 * @param {Object} opts
 * @param {LndClient} opts.client
 * @returns {Promise<Object>}
 */
function getInfo ({ client }) {
  return new Promise((resolve, reject) => {
    client.getInfo({}, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = getInfo
