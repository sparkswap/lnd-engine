const { deadline } = require('../grpc-utils')

/**
 * Open a channel w/ LND
 *
 * @param {String} publicKey - lnd public key to open channel with
 * @param {String} fundingAmount - the amount to fund the channel w/
 * @return {Promise}
 */
function openChannel (publicKey, fundingAmount, { client }) {
  const params = {
    nodePubkey: publicKey,
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
