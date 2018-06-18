const path = require('path')
const Big = require('big.js')
const { expect, rewire, sinon } = require('test/test-helper')

const getChannelBalances = rewire(path.resolve(__dirname, 'get-channel-balances'))

describe('get-channel-balances', () => {
  describe('getChannelBalances', () => {
    let listChannelsStub
    let channel
    let channels
    let getChannelTypeFromIdStub
    let balancesStub
    let reverts

    beforeEach(() => {
      getChannelTypeFromIdStub = sinon.stub().returns('BTC')
      balancesStub = sinon.stub()
      channel = { feePerKw: 100, localBalance: 400 }
      channels = [channel, channel]
      listChannelsStub = sinon.stub().returns({ channels })

      reverts = []
      reverts.push(getChannelBalances.__set__('listChannels', listChannelsStub))
      reverts.push(getChannelBalances.__set__('getChannelTypeFromId', getChannelTypeFromIdStub))
      reverts.push(getChannelBalances.__set__('balancesToHash', balancesStub))
      reverts.push(getChannelBalances.__set__('SUPPORTED_SYMBOLS', { BTC: 'BTC' }))
    })

    beforeEach(async () => {
      await getChannelBalances()
    })

    afterEach(() => {
      reverts.forEach(r => r())
    })

    it('gets all available channels', () => {
      expect(listChannelsStub).to.have.been.called()
    })

    it('creates an updated balance hash', () => {
      const expectedResponse = { BTC: new Big(channels.reduce((acc, k) => (acc += k.localBalance), 0)) }
      expect(balancesStub).to.have.been.calledWith(sinon.match(expectedResponse))
    })
  })

  describe('getChannelTypeFromId', () => {
    let channelInfoStub
    let node1Policy
    let node2Policy
    let clientStub
    let chanId

    const getChannelTypeFromId = getChannelBalances.__get__('getChannelTypeFromId')

    beforeEach(() => {
      clientStub = sinon.stub()
      node1Policy = { feeRateMilliMsat: 100 }
      node2Policy = { feeRateMilliMsat: 100 }
      channelInfoStub = sinon.stub().returns({ node1Policy, node2Policy })

      getChannelBalances.__set__('getChanInfo', channelInfoStub)
    })

    it('gets channel info for an id', async () => {
      await getChannelTypeFromId(chanId, clientStub)
      expect(channelInfoStub).to.have.been.calledWith(chanId, { client: clientStub })
    })

    it('returns false if fees were not matched to a symbol', async () => {
      const res = await getChannelTypeFromId(chanId, clientStub)
      expect(res).to.be.eql(false)
    })

    it('returns BTC if fees were matched to BTC', async () => {
      const btcFee = getChannelBalances.__get__('BTC_FEE_MILLI_MSAT')
      const newPolicy = { feeRateMilliMsat: btcFee }
      channelInfoStub = sinon.stub().returns({ node1Policy: newPolicy, node2Policy })
      getChannelBalances.__set__('getChanInfo', channelInfoStub)
      const res = await getChannelTypeFromId(chanId, clientStub)
      const { BTC: btc } = getChannelBalances.__get__('SUPPORTED_SYMBOLS')
      expect(res).to.be.eql(btc)
    })

    it('returns LTC if fees were matched to LTC', async () => {
      const ltcFee = getChannelBalances.__get__('LTC_FEE_MILLI_MSAT')
      const newPolicy = { feeRateMilliMsat: ltcFee }
      channelInfoStub = sinon.stub().returns({ node1Policy: newPolicy, node2Policy })
      getChannelBalances.__set__('getChanInfo', channelInfoStub)
      const res = await getChannelTypeFromId(chanId, clientStub)
      const { LTC: ltc } = getChannelBalances.__get__('SUPPORTED_SYMBOLS')
      expect(res).to.be.eql(ltc)
    })
  })

  describe('balancesToHash', () => {
    let balances
    let BTC
    let LTC
    let res

    const balancesToHash = getChannelBalances.__get__('balancesToHash')

    beforeEach(() => {
      BTC = 100
      LTC = 200
      balances = { BTC, LTC }
    })

    beforeEach(() => {
      res = balancesToHash(balances)
    })

    it('converts an object to a hash in symbol/value format', () => {
      console.log(res)
      expect(res).to.eql([
        { symbol: 'BTC', value: BTC },
        { symbol: 'LTC', value: LTC }
      ])
    })
  })
})
