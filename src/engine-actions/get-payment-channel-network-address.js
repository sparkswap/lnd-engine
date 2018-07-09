const { getInfo } = require('../lnd-actions')
const { networkAddressFormatter } = require('../utils')

const HOST_DELIMITER = '@'

/**
 * Returns the payment channel network address for this node
 *
 * @function
 * @return {PaymentChannelNetworkAddress}
 */
async function getPaymentChannelNetworkAddress ({ includeHost = true } = {}) {
  const { uris = [] } = await getInfo({ client: this.client })
  const uri = uris[0]

  if (!uri) {
    throw new Error(`LND has no uri avaialble`)
  }

  const [ publicKey, host ] = uri.split(HOST_DELIMITER)

  const networkInfo = { publicKey }

  if (includeHost) {
    networkInfo.host = host
  }

  return networkAddressFormatter.serialize(networkInfo)
}

module.exports = getPaymentChannelNetworkAddress
