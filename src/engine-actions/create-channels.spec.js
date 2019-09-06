const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const { Big } = require('../utils')
const { CHANNEL_ROUNDING } = require('../constants')

const createChannels = rewire(path.resolve(__dirname, 'create-channels'))

describe('createChannels', () => {
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
  let resets

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
      info: sinon.stub(),
      debug: sinon.stub(),
      error: sinon.stub()
    }
    clientStub = sinon.stub()
    engine = {
      client: clientStub,
      feeEstimate: '1000',
      maxChannelBalance: '20000000',
      minChannelBalance: '10000',
      quantumsPerCommon: '100000000',
      secondsPerBlock: 600,
      logger: loggerStub,
      symbol: 'LTC'
    }

    resets = []
    resets.push(createChannels.__set__('connectPeer', connectPeerStub))
    resets.push(createChannels.__set__('openChannel', openChannelStub))
    resets.push(createChannels.__set__('networkAddressFormatter', networkAddressStub))
    resets.push(createChannels.__set__('getUncommittedBalance', balanceStub))
  })

  afterEach(() => {
    resets.forEach(reset => reset())
  })

  describe('creating a channel', () => {
    let assertBalanceIsSufficientStub
    let getAmountForChannelsStub

    beforeEach(() => {
      getAmountForChannelsStub = sinon.stub().returns(Big(fundingAmount))
      assertBalanceIsSufficientStub = sinon.stub().resolves()

      resets.push(createChannels.__set__('getAmountForChannels', getAmountForChannelsStub))
      resets.push(createChannels.__set__('assertBalanceIsSufficient', assertBalanceIsSufficientStub))
    })

    it('errors if the rounding behavior is invalid', () => {
      return expect(createChannels.call(engine, paymentChannelNetworkAddress, fundingAmount, { roundBehavior: 'INVALID' })).to.eventually.be.rejectedWith('Invalid round behavior')
    })

    it('errors if the feeEstimate is not defined', () => {
      engine.feeEstimate = undefined
      return expect(
        createChannels.call(engine, paymentChannelNetworkAddress, fundingAmount)
      ).to.eventually.be.rejectedWith(`Currency configuration for LTC has not been setup with a fee estimate`)
    })

    it('errors if the maxChannelBalance is not defined', () => {
      engine.maxChannelBalance = undefined
      return expect(
        createChannels.call(engine, paymentChannelNetworkAddress, fundingAmount)
      ).to.eventually.be.rejectedWith(`Currency configuration for LTC has not been setup with a max channel balance`)
    })

    it('errors if the minChannelBalance is not defined', () => {
      engine.minChannelBalance = undefined
      return expect(
        createChannels.call(engine, paymentChannelNetworkAddress, fundingAmount)
      ).to.eventually.be.rejectedWith(`Currency configuration for LTC has not been setup with a min channel balance`)
    })

    it('calculcates the amount to open with default rounding behavior', async () => {
      await createChannels.call(engine, paymentChannelNetworkAddress, fundingAmount)

      expect(getAmountForChannelsStub).to.have.been.calledOnce()
      expect(getAmountForChannelsStub).to.have.been.calledWith(engine, fundingAmount, CHANNEL_ROUNDING.DOWN)
    })

    it('calculcates the amount to open with specified rounding behavior', async () => {
      await createChannels.call(engine, paymentChannelNetworkAddress, fundingAmount, { roundBehavior: CHANNEL_ROUNDING.UP })

      expect(getAmountForChannelsStub).to.have.been.calledOnce()
      expect(getAmountForChannelsStub).to.have.been.calledWith(engine, fundingAmount, CHANNEL_ROUNDING.UP)
    })

    it('uses a custom target confirmation time', async () => {
      await createChannels.call(engine, paymentChannelNetworkAddress, fundingAmount, { targetTime: 600 })

      expect(openChannelStub).to.have.been.calledWith(sinon.match({ targetConf: 1 }))
    })

    it('uses a custom privacy setting', async () => {
      await createChannels.call(engine, paymentChannelNetworkAddress, fundingAmount, { privateChan: true })

      expect(openChannelStub).to.have.been.calledWith(sinon.match({ 'private': true }))
    })

    it('ensures sufficient balance', async () => {
      await createChannels.call(engine, paymentChannelNetworkAddress, fundingAmount)

      expect(assertBalanceIsSufficientStub).to.have.been.calledOnce()
      expect(assertBalanceIsSufficientStub).to.have.been.calledWith(engine)
      expect(assertBalanceIsSufficientStub.args[0][1].toString()).to.be.eql(fundingAmount)
    })

    it('parses the paymentChannelNetworkAddress', async () => {
      await createChannels.call(engine, paymentChannelNetworkAddress, fundingAmount)
      expect(networkAddressStub.parse).to.have.been.calledWith(paymentChannelNetworkAddress)
    })

    it('connects to a lnd host', async () => {
      await createChannels.call(engine, paymentChannelNetworkAddress, fundingAmount)
      expect(connectPeerStub).to.have.been.calledOnce()
      expect(connectPeerStub).to.have.been.calledWith(publicKey, host, sinon.match({ client: clientStub, logger: loggerStub }))
    })

    it('opens a channel', async () => {
      await createChannels.call(engine, paymentChannelNetworkAddress, fundingAmount)
      expect(openChannelStub).to.have.been.calledOnce()
      expect(openChannelStub).to.have.been.calledWith({ nodePubkey: publicKey, localFundingAmount: fundingAmount, targetConf: 3, private: false }, sinon.match({ client: clientStub }))
    })

    it('opens multiple channels', async () => {
      getAmountForChannelsStub.returns(Big('30000000'))

      await createChannels.call(engine, paymentChannelNetworkAddress, fundingAmount)
      expect(connectPeerStub).to.have.been.calledOnce()
      expect(openChannelStub).to.have.been.calledTwice()
      expect(openChannelStub).to.have.been.calledWith({ nodePubkey: publicKey, localFundingAmount: '20000000', targetConf: 3, private: false }, sinon.match({ client: clientStub }))
      expect(openChannelStub).to.have.been.calledWith({ nodePubkey: publicKey, localFundingAmount: '10000000', targetConf: 3, private: false }, sinon.match({ client: clientStub }))
    })

    it('returns void for successful channel creation', async () => {
      const res = await createChannels.call(engine, paymentChannelNetworkAddress, fundingAmount)
      expect(res).to.eql(undefined)
    })
  })

  describe('getAmountForChannels', () => {
    let getAmountForChannels

    beforeEach(() => {
      getAmountForChannels = createChannels.__get__('getAmountForChannels')
    })

    it('throws if the amount is zero', () => {
      return expect(() => {
        getAmountForChannels(engine, 0)
      }).to.throw('Funding amount of 0 LTC is invalid.')
    })

    it('returns a Big', () => {
      expect(getAmountForChannels(engine, fundingAmount).constructor.name).to.be.eql('Big')
    })

    it('returns the amount if it is a single channel', () => {
      expect(getAmountForChannels(engine, fundingAmount).toString()).to.be.eql(fundingAmount)
    })

    it('returns the amount if multiple channels are greater than the minimum', () => {
      fundingAmount = '30000000'
      expect(getAmountForChannels(engine, fundingAmount).toString()).to.be.eql(fundingAmount)
    })

    context('small channel would be created', () => {
      beforeEach(() => {
        fundingAmount = '20000010'
      })

      context('round behavior is ERROR', () => {
        it('throws if a small channel would be created', () => {
          return expect(() => {
            getAmountForChannels(engine, fundingAmount, CHANNEL_ROUNDING.ERROR)
          }).to.throw('Funding amount would result in an uneconomic channel balance')
        })
      })

      context('round behavior is UP', () => {
        it('increases the amount if a small channel would be created', () => {
          expect(getAmountForChannels(engine, fundingAmount, CHANNEL_ROUNDING.UP).toString()).to.be.eql('20010000')
        })
      })

      context('round behavior is DOWN', () => {
        it('decreases the amount if a small channel would be created', () => {
          expect(getAmountForChannels(engine, fundingAmount, CHANNEL_ROUNDING.DOWN).toString()).to.be.eql('20000000')
        })

        it('errors if no channels would be created', () => {
          expect(() => {
            getAmountForChannels(engine, '10', CHANNEL_ROUNDING.DOWN)
          }).to.throw('too small')
        })
      })

      context('round behavior is unknown', () => {
        it('throws if a small channel would be created', () => {
          return expect(() => {
            getAmountForChannels(engine, fundingAmount)
          }).to.throw('Invalid round behavior')
        })
      })
    })
  })

  describe('assertBalanceIsSufficient', () => {
    let assertBalanceIsSufficient

    beforeEach(() => {
      assertBalanceIsSufficient = createChannels.__get__('assertBalanceIsSufficient')
    })

    it('gets a engines current balance', async () => {
      await assertBalanceIsSufficient(engine, fundingAmount)
      expect(balanceStub).to.have.been.calledOnce()
      expect(balanceStub).to.have.been.calledOn(engine)
    })

    it('throws if the balance is insufficient', () => {
      balanceStub.resolves('10000000')

      return expect(assertBalanceIsSufficient(engine, fundingAmount)).to.eventually.be.rejectedWith(
        'Requested funding amount exceeds available balance (0.1 LTC). Maximum estimated funding amount: 0.09999 LTC.'
      )
    })
  })
})
