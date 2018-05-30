const { deadline } = require('../grpc-utils')

/**
 * Queries LND for its public key
 *
 * @function
 * @see {@link http://api.lightning.community/#getInfo}
 * @return {String} identityPubkey
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
