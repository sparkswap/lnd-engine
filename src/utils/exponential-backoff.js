const delay = require('./delay')

/**
 * Delay milliseconds multiplier - Value in milliseconds on How much to delay each retry by
 *
 * @constant
 * @type {Integer} milliseconds
 * @default
 */
const DELAY_MULTIPLIER = 1.5

/**
 * Calls a function repeatedly until success or throws if it fails on final retry
 *
 * @param {Function} callFunction - function to be called
 * @param {Integer} attempts - attempts left
 * @param {Integer} delayTime - delay in milliseconds between calls
 * @param {Object} payload - information to log in the error log for backoff
 * @return {Promise}
 */
async function exponentialBackoff (callFunction, attempts, delayTime, payload = {}) {
  try {
    var res = await callFunction()
  } catch (error) {
    if (attempts > 0) {
      const attemptsLeft = attempts - 1
      this.logger.error(`Error calling ${callFunction}. Retrying in ${delayTime / 1000} seconds, attempts left: ${attemptsLeft}`, payload)
      await delay(delayTime)
      res = await exponentialBackoff.call(this, callFunction, attemptsLeft, delayTime * DELAY_MULTIPLIER, payload)
    } else {
      throw new Error(error, `Error with ${callFunction}, no retry attempts left`)
    }
  }
  return res
}

module.exports = exponentialBackoff
