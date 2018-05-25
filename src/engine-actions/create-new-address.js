const { newAddress } = require('../lnd-actions')

/**
 * Creates a new wallet address
 *
 * @return {String} address
 */
async function createNewAddress () {
  const { address } = await newAddress({ client: this.client })
  return address
}

module.exports = createNewAddress
