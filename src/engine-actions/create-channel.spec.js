const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const { Big } = require('../utils')

const createChannel = rewire(path.resolve(__dirname, 'create-channel'))

describe('createChannel', () => {
  let fundingAmount
  let connectPeerStub
  let openChannelStub
  let clientStub
  let loggerStub
  let networkAddressStub
  let publicKey
  let host
  let paymentChannelNetworkAddress
  let balanceStub
  let balance
  let currencyConfigStub

  beforeEach(() => {
    balance = '10000000000000'
    publicKey = 'asdf1234'
    host = '127.0.0.1'
    paymentChannelNetworkAddress = `bolt:${publicKey}@${host}`
    clientStub = sinon.stub()
    networkAddressStub = {
      parse: sinon.stub().returns({ publicKey, host })
    }
    fundingAmount = '10000000'
    connectPeerStub = sinon.stub()
    openChannelStub = sinon.stub()
    clientStub = sinon.stub()
    balanceStub = sinon.stub().resolves(balance)
    loggerStub = {
      debug: sinon.stub(),
      error: sinon.stub()
    }
    currencyConfigStub = {
      feeEstimate: '1000'
    }

    createChannel.__set__('connectPeer', connectPeerStub)
    createChannel.__set__('openChannel', openChannelStub)
    createChannel.__set__('client', clientStub)
    createChannel.__set__('logger', loggerStub)
    createChannel.__set__('networkAddressFormatter', networkAddressStub)
    createChannel.__set__('getUncommittedBalance', balanceStub)
    createChannel.__set__('currencyConfig', currencyConfigStub)
  })

  describe('creating a channel', () => {
    it('parses the paymentChannelNetworkAddress', async () => {
      await createChannel(paymentChannelNetworkAddress, fundingAmount)
      expect(networkAddressStub.parse).to.have.been.calledWith(paymentChannelNetworkAddress)
    })

    it('connects to a lnd host', async () => {
      await createChannel(paymentChannelNetworkAddress, fundingAmount)
      expect(connectPeerStub).to.have.been.calledWith(publicKey, host, sinon.match({ client: clientStub, logger: loggerStub }))
    })

    it('opens a channel', async () => {
      await createChannel(paymentChannelNetworkAddress, fundingAmount)
      expect(openChannelStub).to.have.been.calledWith(publicKey, fundingAmount, sinon.match({ client: clientStub }))
    })

    it('gets a engines current balance', async () => {
      await createChannel(paymentChannelNetworkAddress, fundingAmount)
      expect(balanceStub).to.have.been.calledOnce()
    })

    it('returns void for successful channel creation', async () => {
      const res = await createChannel(paymentChannelNetworkAddress, fundingAmount)
      expect(res).to.eql(undefined)
    })
  })

  context('balance does not cover fees', () => {
    it('opens a channel with a fee estimated funding amount', async () => {
      balance = '1670000'
      balanceStub.resolves(balance)

      await createChannel(paymentChannelNetworkAddress, fundingAmount)

      const fundingAmountWithFeeEstimate = Big(fundingAmount).minus(currencyConfigStub.feeEstimate).toString()
      expect(openChannelStub).to.have.been.calledWith(publicKey, fundingAmountWithFeeEstimate, sinon.match.any)
    })

    it('errors if funding amount doesnt cover estimated fees', () => {
      balance = '1670000'
      fundingAmount = '1000000'
      balanceStub.resolves(balance)
      createChannel.__set__('currencyConfig', {
        feeEstimate: '10000000'
      })

      return expect(createChannel(paymentChannelNetworkAddress, fundingAmount)).to.have.been.rejectedWith('fundingAmount does not cover')
    })
  })
})
