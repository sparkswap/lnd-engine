/**
 * @constant
 * @type {Number}
 * @default
 */
const DEFAULT_TIMELOCK_DELTA = 9

/**
 *
 * @param {Object} channelPoint
 * @param {String} channelPoint.fundingTxidBytes
 * @param {String} channelPoint.fundingTxidStr
 * @param {String} channelPoint.outputIndex
 * @param {String} baseFeeMsat Base fee in millisatoshis expressed as an int64 string
 * @returns {Promise}
 */
async function updateChannelPolicy (chanPoint, baseFeeMsat, { client }) {
  return new Promise((resolve, reject) =>
    client.updateChannelPolicy({ chanPoint, baseFeeMsat, feeRate: 1, timeLockDelta: DEFAULT_TIMELOCK_DELTA }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  )
}

module.exports = updateChannelPolicy
