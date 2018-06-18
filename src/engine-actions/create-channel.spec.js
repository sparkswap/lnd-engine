const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const createChannel = rewire(path.resolve(__dirname, 'create-channel'))

describe('createChannel', () => {
  let host
  let pubKey
  let fundingAmount
  let connectPeerStub
  let openChannelStub
  let updateChannelStub
  let channelPoint
  let clientStub
  let loggerStub
  let symbol
  let res
  let feeRateStub
  let fee
  let generateStub

  beforeEach(() => {
    host = '127.0.0.1:10111'
    pubKey = '1234'
    fundingAmount = '100'
    symbol = 'BTC'
    fee = 100
    channelPoint = sinon.stub()
    connectPeerStub = sinon.stub()
    openChannelStub = sinon.stub().returns(channelPoint)
    updateChannelStub = sinon.stub()
    clientStub = sinon.stub()
    loggerStub = {
      debug: sinon.stub(),
      error: sinon.stub()
    }
    feeRateStub = sinon.stub().returns(fee)
    generateStub = sinon.stub().returns(channelPoint)

    createChannel.__set__('connectPeer', connectPeerStub)
    createChannel.__set__('openChannel', openChannelStub)
    createChannel.__set__('updateChannelPolicy', updateChannelStub)
    createChannel.__set__('feeRateFromSymbol', feeRateStub)
    createChannel.__set__('generateChanPointFromChannelInfo', generateStub)
    createChannel.__set__('client', clientStub)
    createChannel.__set__('logger', loggerStub)
    createChannel.__set__('process', {
      env: {
        NODE_ENV: 'production'
      }
    })
  })

  describe('creating a channel', () => {
    beforeEach(async () => {
      res = await createChannel(host, pubKey, fundingAmount, symbol)
    })

    it('connects to a lnd host', () => {
      expect(connectPeerStub).to.have.been.calledWith(pubKey, host, sinon.match({ client: clientStub, logger: loggerStub }))
    })

    it('opens a channel', () => {
      expect(openChannelStub).to.have.been.calledWith(pubKey, fundingAmount, sinon.match({ client: clientStub }))
    })

    it('generates a fee', () => {
      expect(feeRateStub).to.have.been.calledWith(symbol)
    })

    it('generates a channel point', () => {
      expect(generateStub).to.have.been.calledWith(channelPoint)
    })

    it('returns true for successful channel creation', () => {
      expect(res).to.be.true()
    })
  })

  it('throws an error if symbol is not supported', () => {
    return expect(createChannel(host, pubKey, fundingAmount, 'DAN')).to.eventually.be.rejectedWith('Symbol is not currently supported')
  })
})
