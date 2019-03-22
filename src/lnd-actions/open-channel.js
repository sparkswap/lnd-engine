const { deadline } = require('../grpc-utils')

/**
 * Open a channel w/ LND
 *
 * @param {string} publicKey - lnd public key to open channel with
 * @param {string} fundingAmount - the amount to fund the channel w/
 * @param {Object} opts
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
