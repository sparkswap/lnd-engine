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
 * @param {Number} channelPoint.outputIndex
 * @param {Double} feeRate  number up to 6 decimal places
 * @returns {Promise<Object>} res
 */
async function updateChannelPolicy (chanPoint, feeRate, timeLockDelta = DEFAULT_TIMELOCK_DELTA, { client }) {
  return new Promise((resolve, reject) =>
    client.updateChannelPolicy({ chanPoint, feeRate, timeLockDelta }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  )
}

module.exports = updateChannelPolicy
