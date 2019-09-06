const { deadline } = require('../grpc-utils')

/** @typedef {import('../lnd-setup').LndClient} LndClient */

/**
 * Open a channel w/ LND
 *
 * @param {object} params
 * @param {string} params.nodePubkey - lnd public key to open channel with
 * @param {string} params.localFundingAmount - the amount to fund the channel w/
 * @param {number} params.targetConf - Number of blocks the channel opening transaction should be confirmed by
 * @param {boolean} params.private - whether to make the channel private
 * @param {object} opts
 * @param {LndClient} opts.client
 * @returns {Promise}
 */
function openChannel (params, { client }) {
  // replace the bytes version of the pub key with the string version
  const pubkeyParams = params.nodePubkey
    ? { nodePubkeyString: params.nodePubkey, nodePubkey: undefined }
    : {}

  const lndParams = Object.assign({}, params, pubkeyParams)

  return new Promise((resolve, reject) => {
    client.openChannelSync(lndParams, { deadline: deadline() }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = openChannel
