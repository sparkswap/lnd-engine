const delay = require('./delay')

/**
 * Delay multiplier - Value in milliseconds
 *
 * @constant
 * @type {number} milliseconds
 * @default
 */
const DELAY_MULTIPLIER = 1.5

/**
 * Attempts to retry validating an engine
 *
 * @constant
 * @type {number}
 * @default
 */
const EXPONENTIAL_BACKOFF_ATTEMPTS = 24

/**
 * Delay in each retry attempt to validating an engine
 *
 * @constant
 * @type {number} milliseconds
 * @default
 */
const EXPONENTIAL_BACKOFF_DELAY = 5000

/**
 * Calls a function repeatedly until success or throws if it fails on final retry
 *
 * @param {Function} callFunction
 * @param {Object} [payload={}] - information for error log during backoff failures
 * @param {Object} opts
 * @param {string} [opts.debugName=null]
 * @param {number} [opts.attempts=EXPONENTIAL_BACKOFF_ATTEMPTS] - attempts left
 * @param {number} [opts.delayTime=EXPONENTIAL_BACKOFF_DELAY] - delay in milliseconds between calls
 * @param {Logger} [opts.logger=console]
 * @returns {Promise}
 */
async function exponentialBackoff (callFunction, payload = {}, { debugName = null, attempts = EXPONENTIAL_BACKOFF_ATTEMPTS, delayTime = EXPONENTIAL_BACKOFF_DELAY, logger = console }) {
  try {
    var res = await callFunction()
  } catch (error) {
    if (attempts > 0) {
      const attemptsLeft = attempts - 1
      const nextDelayTime = delayTime * DELAY_MULTIPLIER

      if (debugName) {
        logger.error(`Error calling ${debugName}. Retrying in ${Math.round(delayTime / 1000)} seconds, attempts left: ${attemptsLeft}`, { payload, error: error.message })
      } else {
        logger.error(`Error calling ${callFunction}. Retrying in ${Math.round(delayTime / 1000)} seconds, attempts left: ${attemptsLeft}`, { payload, error: error.message })
      }

      await delay(delayTime)
      res = await exponentialBackoff(callFunction, payload, { debugName, attempts: attemptsLeft, delayTime: nextDelayTime, logger })
    } else {
      throw new Error(error, `Error with ${callFunction}, no retry attempts left`)
    }
  }

  return res
}

module.exports = exponentialBackoff
