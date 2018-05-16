
// Segregated Witness address type
// nested-pay-to-witness-key-hash (np2wkh)
//
const DEFAULT_ADDRESS_TYPE = 0 // np2wkh

/**
 * @return {String} address
 */
function newAddress () {
  return new Promise((resolve, reject) => {
    this.client.newAddress({ type: DEFAULT_ADDRESS_TYPE }, (err, res) => {
      if (err) return reject(err)

      console.log('received response from lnd: ', res)

      const { address } = res

      return resolve(address)
    })
  })
}

module.exports = newAddress
