const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const createChannel = rewire(path.resolve(__dirname, 'create-channel'))

describe('createChannel', () => {
  let fundingAmount
  let connectPeerStub
  let openChannelStub
  let clientStub
  let loggerStub
  let res
  let networkAddressStub
  let publicKey
  let host
  let paymentChannelNetworkAddress

  beforeEach(() => {
    publicKey = 'asdf1234'
    host = '127.0.0.1'
    paymentChannelNetworkAddress = `bolt:${publicKey}@${host}`
    clientStub = sinon.stub()
    networkAddressStub = {
      parse: sinon.stub().returns({ publicKey, host })
    }
    fundingAmount = '100'
    connectPeerStub = sinon.stub()
    openChannelStub = sinon.stub()
    clientStub = sinon.stub()
    loggerStub = {
      debug: sinon.stub(),
      error: sinon.stub()
    }
    createChannel.__set__('connectPeer', connectPeerStub)
    createChannel.__set__('openChannel', openChannelStub)
    createChannel.__set__('client', clientStub)
    createChannel.__set__('logger', loggerStub)
    createChannel.__set__('networkAddressFormatter', networkAddressStub)
  })

  describe('creating a channel', () => {
    beforeEach(async () => {
      res = await createChannel(paymentChannelNetworkAddress, fundingAmount)
    })

    it('parses the paymentChannelNetworkAddress', () => {
      expect(networkAddressStub.parse).to.have.been.calledWith(paymentChannelNetworkAddress)
    })

    it('connects to a lnd host', () => {
      expect(connectPeerStub).to.have.been.calledWith(publicKey, host, sinon.match({ client: clientStub, logger: loggerStub }))
    })

    it('opens a channel', () => {
      expect(openChannelStub).to.have.been.calledWith(publicKey, fundingAmount, sinon.match({ client: clientStub }))
    })

    it('returns void for successful channel creation', () => {
      expect(res).to.eql(undefined)
    })
  })
})
