const delay = require('./delay')

/**
 * Delay in each retry attempt to validating an engine
 *
 * @constant
 * @type {number} milliseconds
 * @default
 */
const RETRY_DELAY = 10000

/**
 * Calls a function repeatedly until success
 *
 * @param {Function} callFunction
 * @param {Object} [payload={}] - information for error log during backoff failures
 * @param {Object} opts
 * @param {string} [opts.debugName=null]
 * @param {number} [opts.delayTime=RETRY_DELAY] - delay in milliseconds between calls
 * @param {Logger} [opts.logger=console]
 * @returns {Promise}
 */
async function retry (callFunction, payload = {}, { debugName = null, delayTime = RETRY_DELAY, logger = console }) {
  try {
    var res = await callFunction()
  } catch (error) {
    if (debugName) {
      logger.error(`Error calling ${debugName}. Retrying in ${Math.round(delayTime / 1000)} seconds`, { payload, error: error.message })
    } else {
      logger.error(`Error calling ${callFunction}. Retrying in ${Math.round(delayTime / 1000)} seconds`, { payload, error: error.message })
    }

    await delay(delayTime)
    res = await retry(callFunction, payload, { debugName, delayTime, logger })
  }

  return res
}

module.exports = retry
