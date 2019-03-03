/**
 * @constant
 * @type {number}
 * @default
 */
const DEFAULT_TIMELOCK_DELTA = 9

/**
 *
 * @param {Object} chanPoint
 * @param {string} feeRate - number up to 6 decimal places
 * @param {number} [timeLockDelta=DEFAULT_TIMELOCK_DELTA]
 * @param {Object} opts
 * @param {LndClient} opts.client
 * @returns {Promise} res
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
