const { deadline } = require('../grpc-utils')

/**
 * Given an error, detects if the error message says that the peer is already
 * connected
 *
 * @private
 * @param {Error} err
 * @return {Boolean}
 */
function alreadyConnected (err) {
  return (err && err.code === 2 && err.details && err.details.includes('already connected to peer'))
}

/**
 * Creates a new connection to an lnd node
 *
 * @param {String} publicKey
 * @param {String} host
 * @return {Promise<void>}
 */
function connectPeer (publicKey, host, { client, logger }) {
  const addr = {
    pubkey: publicKey,
    host
  }

  return new Promise((resolve, reject) => {
    client.connectPeer({ addr }, { deadline: deadline() }, (err, res) => {
      console.log('here')
      if (alreadyConnected(err)) {
        logger.info(`Peer already connected: ${publicKey}`)
        return resolve()
      } else if (err) {
        return reject(err)
      }

      return resolve()
    })
  })
}

module.exports = connectPeer
