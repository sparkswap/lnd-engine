/**
 * Prevents code execution for a designated amount of milliseconds
 *
 * @param {number} ms - milleseconds of delay
 * @returns {Promise}
 */
function delay (ms) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms)
  })
}

module.exports = delay
