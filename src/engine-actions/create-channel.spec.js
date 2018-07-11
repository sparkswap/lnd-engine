const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const createChannel = rewire(path.resolve(__dirname, 'create-channel'))

describe('createChannel', () => {
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
    symbol = 'BTC'
    fee = 100
    channelPoint = {
      fundingTxidStr: 'asfasfjas09fj09fj',
      outputIndex: 0
    }
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
    createChannel.__set__('feeRateForSymbol', feeRateStub)
    createChannel.__set__('generateChanPointFromChannelInfo', generateStub)
    createChannel.__set__('client', clientStub)
    createChannel.__set__('logger', loggerStub)
    createChannel.__set__('networkAddressFormatter', networkAddressStub)
  })

  describe('creating a channel in production', () => {
    let revert

    beforeEach(async () => {
      revert = createChannel.__set__('process', {
        env: {
          NODE_ENV: 'production'
        }
      })
      res = await createChannel(paymentChannelNetworkAddress, fundingAmount, symbol)
    })

    afterEach(() => {
      revert()
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

    it('generates a fee', () => {
      expect(feeRateStub).to.have.been.calledWith(symbol)
    })

    it('generates a channel point', () => {
      expect(generateStub).to.have.been.calledWith(channelPoint)
    })

    it('does not update the channel policy', () => {
      expect(updateChannelStub).to.not.have.been.calledOnce()
    })

    it('returns true for successful channel creation', () => {
      expect(res).to.be.true()
    })
  })

  describe('creating a channel in dev', () => {
    let revert
    let delay
    let feeRate

    beforeEach(async () => {
      revert = createChannel.__set__('process', {
        env: {
          NODE_ENV: 'development'
        }
      })
      delay = sinon.stub().resolves()
      createChannel.__set__('delay', delay)
      feeRate = 0.0001
      createChannel.__set__('feeRatePerSatoshiFromSymbol', sinon.stub().returns(feeRate))
      res = await createChannel(paymentChannelNetworkAddress, fundingAmount, symbol)
    })

    afterEach(() => {
      revert()
    })

    it('updates the channel policy', () => {
      expect(delay).to.have.been.calledOnce()
      expect(delay).to.have.been.calledWith(120000)
      expect(updateChannelStub).to.have.been.calledOnce()
      expect(updateChannelStub).to.have.been.calledWith(channelPoint, feeRate)
    })
  })

  it('throws an error if symbol is not supported', () => {
    return expect(createChannel(paymentChannelNetworkAddress, fundingAmount, 'DAN')).to.eventually.be.rejectedWith('Symbol is not currently supported')
  })
})
