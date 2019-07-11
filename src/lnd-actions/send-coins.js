const { deadline } = require('../grpc-utils')

/** @typedef {import('../lnd-setup').LndClient} LndClient */

/**
 * Sends coins from lnd wallet to address
 *
 * @see http://api.lightning.community/#sendCoins
 * @param {string} addr
 * @param {number} amount
 * @param {object} opts
 * @param {LndClient} opts.client
 * @returns {object} response
 */
function sendCoins (addr, amount, { client }) {
  return new Promise((resolve, reject) => {
    client.sendCoins({ addr, amount }, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = sendCoins
