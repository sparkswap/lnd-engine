/**
 * Resizes an LND pubkey to log
 *
 * @param   {string} pubKey - LND identity pubkey
 * @returns {?string} string snippet of public key (length 15)
 */
function loggablePubKey (pubKey) {
  if (!pubKey) {
    return null
  }
  return `${pubKey.slice(0, 15)}...`
}

module.exports = loggablePubKey
