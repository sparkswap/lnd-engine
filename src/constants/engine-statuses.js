/**
 * List of statuses for an lnd-engine. Each status represents a step in an engine's
 * lifecycle
 *
 * @constant
 * @type {Object<key, String>}
 * @default
 */
const ENGINE_STATUSES = Object.freeze({
  UNKNOWN: 'UNKNOWN', // Default state of the engine
  UNAVAILABLE: 'UNAVAILABLE', // LightningRpc (lnrpc) is unavailable, WalletUnlocker rpc is unavailable
  NEEDS_WALLET: 'NEEDS_WALLET', // Wallet does not exist, LightningRpc is UNIMPLEMENTED, genSeeds does not throw
  LOCKED: 'LOCKED', // LightningRpc (lnrpc) is UNIMPLEMENTED, genSeeds throws "wallet already exists"
  UNLOCKED: 'UNLOCKED', // LightningRpc (lnrpc) getInfo does not throw an error
  NOT_SYNCED: 'NOT_SYNCED', // LightningRpc (lnrpc) getInfo synced_to_chain boolean is false
  VALIDATED: 'VALIDATED' // LightningRpc (lnrpc) getInfo matches the engines configuration
})

module.exports = ENGINE_STATUSES
