/**
 * The default amount of time, in seconds, that the Maker will use in forwarding this transaction.
 * LND's default value announced on its channels is 24 hours (144 Bitcoin blocks)
 *
 * @todo Make this amount dynamic and determined with the price/amount or determined from the channel graph
 * @type {Number}
 * @constant
 */
const DEFAULT_MAKER_FWD_DELTA = 86400

/**
 * The default amount of time, in seconds, that the Relayer will use in forwarding this transaction.
 * LND's default value announced on its channels is 24 hours (144 Bitcoin blocks)
 *
 * @todo Make this amount dynamic and published by the Relayer or determined from the channel graph
 * @type {Number}
 * @constant
 */
const DEFAULT_RELAYER_FWD_DELTA = 86400

/**
 * The default amoumt of time, in seconds, that the Taker (this node) expects to receive when settling a swap.
 * BOLT-11 states it as 90 minutes (9 Bitcoin blocks), but LND's default is 144 blocks to align to the forwarding
 * policy.
 *
 * @see {@link https://github.com/lightningnetwork/lightning-rfc/blob/master/11-payment-encoding.md}
 * @todo Make this amount dynamic and set by the broker/user
 * @type {Number}
 * @constant
 */
const DEFAULT_MIN_FINAL_DELTA = 86400

/**
 * The amount of time, in seconds, that we'd like to buffer any output timelock by to account for block ticks during a swap
 * This is especially problematic on simnet where we mine blocks every 10 seconds and is a known issue on mainnet.
 *
 * @see {@link https://github.com/lightningnetwork/lnd/issues/535}
 * @type {Number}
 * @constant
 */
const BLOCK_BUFFER = 1800

module.exports = {
  DEFAULT_MAKER_FWD_DELTA,
  DEFAULT_MIN_FINAL_DELTA,
  DEFAULT_RELAYER_FWD_DELTA,
  BLOCK_BUFFER
}
