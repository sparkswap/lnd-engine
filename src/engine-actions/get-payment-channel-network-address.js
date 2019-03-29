const { getInfo } = require('../lnd-actions')
const { networkAddressFormatter } = require('../utils')

/**
 * @constant
 * @type {string}
 * @default
 */
const HOST_DELIMITER = '@'

/**
 * Returns the payment channel network address for this node
 *
 * @returns {string}
 */
async function getPaymentChannelNetworkAddress () {
  const {
    identityPubkey,
    uris = []
  } = await getInfo({ client: this.client })

  // The uri will only exist if a user has set the `--external-ip` flag on the
  // LND instance. If this uri does not exist, we will simply use the lnd public key
  if (!uris.length) {
    return networkAddressFormatter.serialize({ publicKey: identityPubkey })
  }

  const uri = uris[0]
  const [ publicKey, host ] = uri.split(HOST_DELIMITER)

  return networkAddressFormatter.serialize({ publicKey, host })
}

module.exports = getPaymentChannelNetworkAddress
