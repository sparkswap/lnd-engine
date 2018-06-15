const path = require('path')
const Big = require('big.js')
const { expect, rewire, sinon } = require('test/test-helper')

const getChannelBalances = rewire(path.resolve(__dirname, 'get-channel-balances'))

describe('get-channel-balances', () => {
  describe('getChannelBalances', () => {
    let listChannelsStub
    let channel
    let channels
    let feeToSymbolStub
    let balancesStub
    let reverts

    beforeEach(() => {
      feeToSymbolStub = sinon.stub().returns('BTC')
      balancesStub = sinon.stub()
      channel = { feePerKw: 100, localBalance: 400 }
      channels = [channel, channel]
      listChannelsStub = sinon.stub().returns({ channels })

      reverts = []
      reverts.push(getChannelBalances.__set__('listChannels', listChannelsStub))
      reverts.push(getChannelBalances.__set__('feeToSymbol', feeToSymbolStub))
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

  describe('feeToSymbol', () => {
    let btcFee
    let ltcFee

    const feeToSymbol = getChannelBalances.__get__('feeToSymbol')

    beforeEach(() => {
      btcFee = new Big(100)
      ltcFee = new Big(200)

      getChannelBalances.__set__('LTC_FEE_PER_KW', ltcFee)
      getChannelBalances.__set__('BTC_FEE_PER_KW', btcFee)
    })

    it('returns BTC if the fee matches BTC', () => {
      expect(feeToSymbol(btcFee)).to.eql('BTC')
    })

    it('returns LTC if the fee matches LTC', () => {
      expect(feeToSymbol(ltcFee)).to.eql('LTC')
    })

    it('throws an error if no fee matches supported fees', () => {
      expect(() => feeToSymbol(new Big(10000))).to.throw()
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
