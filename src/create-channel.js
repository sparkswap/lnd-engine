const { connectPeer, openChannel } = require('./lnd-actions')

async function createChannel (host, publicKey, fundingAmount) {
  const res = await connectPeer(publicKey, host, { client: this.client })
}

module.exports = createChannel
