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
 * @param {Object} policy
 * @param {String} policy.baseFeeMsat Base fee in millisatoshis expressed as an int64 string
 * @param {Number} policy.feeRate Fee rate in millisatoshis per million satoshis
 * @param {Number} policy.timeLockDelta Time lock delta required to pass through the channel
 * @returns {Promise}
 */
async function updateChannelPolicy (chanPoint, { baseFeeMsat = '0', feeRate = 0, timeLockDelta = DEFAULT_TIMELOCK_DELTA }, { client }) {
  return new Promise((resolve, reject) =>
    client.updateChannelPolicy({ chanPoint, baseFeeMsat, feeRate, timeLockDelta }, (err, res) => {
      if (err) return reject(err)
      return resolve(res)
    })
  )
}

module.exports = updateChannelPolicy
