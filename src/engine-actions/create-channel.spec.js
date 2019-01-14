const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const { Big } = require('../utils')

const createChannel = rewire(path.resolve(__dirname, 'create-channel'))

describe('createChannel', () => {
  let fundingAmount
  let connectPeerStub
  let openChannelStub
  let engine
  let clientStub
  let loggerStub
  let networkAddressStub
  let publicKey
  let host
  let paymentChannelNetworkAddress
  let balanceStub
  let balance

  beforeEach(() => {
    balance = '10000000000000'
    publicKey = 'asdf1234'
    host = '127.0.0.1'
    paymentChannelNetworkAddress = `bolt:${publicKey}@${host}`
    networkAddressStub = {
      parse: sinon.stub().returns({ publicKey, host })
    }
    fundingAmount = '10000000'
    connectPeerStub = sinon.stub()
    openChannelStub = sinon.stub()
    balanceStub = sinon.stub().resolves(balance)

    loggerStub = {
      debug: sinon.stub(),
      error: sinon.stub()
    }
    clientStub = sinon.stub()
    engine = {
      client: clientStub,
      feeEstimate: '1000',
      maxChannelBalance: '20000000',
      logger: loggerStub
    }

    createChannel.__set__('connectPeer', connectPeerStub)
    createChannel.__set__('openChannel', openChannelStub)
    createChannel.__set__('networkAddressFormatter', networkAddressStub)
    createChannel.__set__('getUncommittedBalance', balanceStub)
  })

  describe('creating a channel', () => {
    it('parses the paymentChannelNetworkAddress', async () => {
      await createChannel.call(engine, paymentChannelNetworkAddress, fundingAmount)
      expect(networkAddressStub.parse).to.have.been.calledWith(paymentChannelNetworkAddress)
    })

    it('connects to a lnd host', async () => {
      await createChannel.call(engine, paymentChannelNetworkAddress, fundingAmount)
      expect(connectPeerStub).to.have.been.calledWith(publicKey, host, sinon.match({ client: clientStub, logger: loggerStub }))
    })

    it('opens a channel', async () => {
      await createChannel.call(engine, paymentChannelNetworkAddress, fundingAmount)
      expect(openChannelStub).to.have.been.calledWith(publicKey, fundingAmount, sinon.match({ client: clientStub }))
    })

    it('gets a engines current balance', async () => {
      await createChannel.call(engine, paymentChannelNetworkAddress, fundingAmount)
      expect(balanceStub).to.have.been.calledOnce()
    })

    it('returns void for successful channel creation', async () => {
      const res = await createChannel.call(engine, paymentChannelNetworkAddress, fundingAmount)
      expect(res).to.eql(undefined)
    })

    it('errors if the funding amount exceeds the max channel balance', () => {
      fundingAmount = '30000000'
      return expect(createChannel.call(engine, paymentChannelNetworkAddress, fundingAmount)).to.eventually.be.rejectedWith('exceeds max channel balance')
    })
  })

  context('balance is too large', () => {

  })

  context('balance does not cover fees', () => {
    it('opens a channel with a fee estimated funding amount', async () => {
      balance = '1670000'
      balanceStub.resolves(balance)

      await createChannel.call(engine, paymentChannelNetworkAddress, fundingAmount)

      const fundingAmountWithFeeEstimate = Big(fundingAmount).minus(engine.feeEstimate).toString()
      expect(openChannelStub).to.have.been.calledWith(publicKey, fundingAmountWithFeeEstimate, sinon.match.any)
    })

    it('errors if funding amount doesnt cover estimated fees', () => {
      balance = '1670000'
      fundingAmount = '1000000'
      balanceStub.resolves(balance)
      engine.feeEstimate = '10000000'
      engine.maxChannelBalance = '20000000'

      return expect(createChannel.call(engine, paymentChannelNetworkAddress, fundingAmount)).to.have.been.rejectedWith('fundingAmount does not cover')
    })
  })
})
