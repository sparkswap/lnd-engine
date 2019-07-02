const { deadline } = require('../grpc-utils')

/** @typedef {import('../lnd-setup').LndClient} LndClient */

/** @typedef {Object} PendingChannels
 *  @property {Array} pendingOpenChannels
 *  @property {Array} pendingClosingChannels
 *  @property {Array} pendingForceClosingChannels
 *  @property {Array} waitingCloseChannels
 */

/**
 * Returns a list of pending channels
 * @see https://api.lightning.community/#pendingchannels
 * @param {Object} opts
 * @param {LndClient} opts.client
 * @returns {Promise<PendingChannels>}
 */
function listPendingChannels ({ client }) {
  return new Promise((resolve, reject) => {
    client.pendingChannels({}, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = listPendingChannels
