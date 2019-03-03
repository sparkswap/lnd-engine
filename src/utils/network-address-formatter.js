
/**
 * Payment Channel Network Type delimiter
 * @constant
 * @type {string}
 * @default
 */
const DELIMITER = ':'

/**
 * Network type for payment channel networks compatible with BOLT
 * @constant
 * @type {string}
 * @default
 */
const NETWORK_TYPE = 'bolt'

/**
 * Parse a given payment channel network address string into a public key and host
 * @param {string} paymentChannelNetworkAddress
 * @returns {Object}
 * @throws {Error} If network type is not `bolt`
 */
function parse (paymentChannelNetworkAddress) {
  const delimiterIndex = paymentChannelNetworkAddress.indexOf(DELIMITER)
  const [ networkType, networkAddress ] = [ paymentChannelNetworkAddress.slice(0, delimiterIndex), paymentChannelNetworkAddress.slice(delimiterIndex + 1) ]

  if (networkType !== NETWORK_TYPE) {
    throw new Error(`Unable to parse address for payment channel network type of '${networkType}'`)
  }

  const [ publicKey, host ] = networkAddress.split('@')

  const parsed = { publicKey }

  if (host) {
    parsed.host = host
  }

  return parsed
}

/**
 * Serialize a public key and host into a standard payment channel network address
 * @param {Object} args
 * @param  {string} args.publicKey - public key of the node
 * @param  {string} args.host      - host of the node - if omitted, it will be ommitted from the address
 * @returns {string} serialized payment channel network address
 */
function serialize ({ publicKey, host }) {
  let address = `${NETWORK_TYPE}${DELIMITER}${publicKey}`

  if (host) {
    address = `${address}@${host}`
  }

  return address
}

module.exports = {
  parse,
  deserialize: parse,
  serialize
}
