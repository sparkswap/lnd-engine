/**
 * List of rounding behaviors when opening multiple channels and encountering a channel that
 * would be uneconomically small.
 *
 * @constant
 * @type {Object<string, string>}
 * @default
 */
const CHANNEL_ROUNDING = Object.freeze({
  ERROR: 'ERROR', // throw an error if we encounter a channel that is too small
  DOWN: 'DOWN', // drop the extra amount if we enounter a channel that is too small
  UP: 'UP' // round up to the minimum channel size if we encounter a channel that is too small
})

module.exports = CHANNEL_ROUNDING
