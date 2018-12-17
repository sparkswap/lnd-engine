/**
 * The current states of an lnd-engine
 *
 * UNKNOWN - Default state
 * UNAVAILABLE - lnrpc UNAVAILABLE, wallet unlocker rpc UNAVAILABLE
 * NEEDS_WALLET - Wallet does not exist,	lnrpc UNIMPLEMENTED, genSeeds does not throw
 * LOCKED - lnrpc UNIMPLEMENTED, genSeeds throws "wallet exists"
 * UNLOCKED - lnrpc getInfo does not throw
 * VALIDATED - lnrpc getInfo matches our configuration
 *
 * @constant
 * @type {Object<key, String>}
 * @default
 */
const ENGINE_STATUS = Object.freeze({
  UNKNOWN: 'UNKNOWN',
  UNAVAILABLE: 'UNAVAILABLE',
  NEEDS_WALLET: 'NEEDS_WALLET',
  LOCKED: 'LOCKED',
  UNLOCKED: 'UNLOCKED',
  VALIDATED: 'VALIDATED'
})

module.exports = ENGINE_STATUS
