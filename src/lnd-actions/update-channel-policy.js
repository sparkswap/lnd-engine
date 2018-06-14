/**
 *
 * @param {Object} channelPoint
 * @param {String} channelPoint.fundingTxidBytes
 * @param {String} channelPoint.fundingTxidStr
 * @param {String} channelPoint.outputIndex
 * @returns {Promise}
 */
async function updateChannelPolicy (chanPoint, feeRate, { client }) {
  return new Promise((resolve, reject) => {
    client.updateChannelPolicy({ chanPoint, feeRate }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}

module.exports = updateChannelPolicy
