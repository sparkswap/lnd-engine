const { deadline } = require('../grpc-utils')

/** @typedef {import('../lnd-setup').LndClient} LndClient */

/**
 * Open a channel w/ LND
 *
 * @param {string} publicKey - lnd public key to open channel with
 * @param {string} fundingAmount - the amount to fund the channel w/
 * @param {object} opts
 * @param {LndClient} opts.client
 * @returns {Promise}
 */
function openChannel (publicKey, fundingAmount, { client }) {
  const params = {
    nodePubkeyString: publicKey,
    localFundingAmount: fundingAmount
  }

  return new Promise((resolve, reject) => {
    client.openChannelSync(params, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = openChannel
