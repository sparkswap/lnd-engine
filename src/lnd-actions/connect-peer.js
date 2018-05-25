const { deadline } = require('../grpc-utils')

/**
 * Creates a new connection to an lnd node
 *
 * @param {String} publicKey
 * @param {String} host
 * @return {Promise<void>}
 */
function connectPeer (publicKey, host, { client }) {
  const addr = {
    pubkey: publicKey,
    host
  }

  return new Promise((resolve, reject) => {
    client.connectPeer({ addr }, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve()
    })
  })
}

module.exports = connectPeer
