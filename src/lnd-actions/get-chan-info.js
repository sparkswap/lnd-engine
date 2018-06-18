const { deadline } = require('../grpc-utils')

/**
 * Given a channel id, returns information on the channel
 *
 * @function
 * @see {@link http://api.lightning.community/#getChanInfo}
 * @return {String} identityPubkey
 */
function getChanInfo (chanId, { client }) {
  return new Promise((resolve, reject) => {
    client.getChanInfo({ chanId }, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = getChanInfo
