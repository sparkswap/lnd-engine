const { connectPeer } = require('../lnd-actions')
const { networkAddressFormatter } = require('../utils')

function connectUser (paymentChannelNetworkAddress) {
  const { publicKey, host } = networkAddressFormatter.parse(paymentChannelNetworkAddress)
  return connectPeer(publicKey, host, { client: this.client, logger: this.logger })
}

module.exports = connectUser
