const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const connectUser = rewire(path.resolve(__dirname, 'connect-user'))

describe('connect-user', () => {
  let addressFormatterStub
  let paymentChannelNetworkAddress
  let host
  let publicKey
  let connectPeerStub
  let client
  let logger

  beforeEach(() => {
    client = sinon.stub()
    logger = sinon.stub()
    publicKey = '1234'
    host = 'localhost'
    paymentChannelNetworkAddress = 'bolt:1234@localhost'

    connectPeerStub = sinon.stub()
    addressFormatterStub = {
      parse: sinon.stub().returns({ publicKey, host })
    }

    connectUser.__set__('networkAddressFormatter', addressFormatterStub)
    connectUser.__set__('connectPeer', connectPeerStub)
  })

  beforeEach(async () => {
    await connectUser.call({ client, logger }, paymentChannelNetworkAddress)
  })

  it('parses a network address', () => {
    expect(addressFormatterStub.parse).to.have.been.calledWith(paymentChannelNetworkAddress)
  })

  it('connects to a peer', () => {
    expect(connectPeerStub).to.have.been.calledWith(publicKey, host, { client, logger })
  })
})
