const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const LndEngine = rewire(path.resolve('src', 'index'))

describe('lnd-engine index', () => {
  let clientStub
  let walletStub
  let currencies

  beforeEach(() => {
    clientStub = sinon.stub()
    walletStub = sinon.stub()
    currencies = [
      {
        symbol: 'BTC'
      }
    ]

    LndEngine.__set__('actions', {})
    LndEngine.__set__('generateLightningClient', clientStub)
    LndEngine.__set__('generateWalletUnlockerClient', walletStub)
    LndEngine.__set__('currencies', currencies)
  })

  describe('constructor values', () => {
    const symbol = 'BTC'
    const host = 'CUSTOM_HOST:1337'
    const logger = 'CUSTOM_LOGGER'
    const customTlsCertPath = '/custom/cert/path'
    const customMacaroonPath = '/custom/macaroon/path'

    let engine

    beforeEach(() => {
      engine = new LndEngine(host, symbol, { logger, tlsCertPath: customTlsCertPath, macaroonPath: customMacaroonPath })
    })

    it('sets a symbol', () => expect(engine.symbol).to.eql(symbol))
    it('retrieves currency config', () => expect(engine.currencyConfig).to.eql(currencies[0]))
    it('sets a host', () => expect(engine.host).to.eql(host))
    it('sets a logger', () => expect(engine.logger).to.eql(logger))
    it('sets a tlsCertPath', () => expect(engine.tlsCertPath).to.eql(customTlsCertPath))
    it('sets a macaroonPath', () => expect(engine.macaroonPath).to.eql(customMacaroonPath))

    it('generates an lnd lightning client', () => {
      expect(clientStub).to.have.been.calledWith(engine)
    })

    it('generates an lnd wallet unlocker client', () => {
      expect(walletStub).to.have.been.calledWith(engine)
    })

    it('throws if the currency is not in available configuration', () => {
      expect(() => { new LndEngine(host, 'XYZ') }).to.throw('not a valid symbol') // eslint-disable-line
    })
    it('fails if no host is specified', () => {
      expect(() => new LndEngine(null, symbol)).to.throw('Host is required')
    })
  })

  describe('isUnlocked', () => {
    const symbol = 'BTC'
    const host = 'CUSTOM_HOST:1337'
    const logger = 'CUSTOM_LOGGER'
    const customTlsCertPath = '/custom/cert/path'
    const customMacaroonPath = '/custom/macaroon/path'

    let engine

    beforeEach(() => {
      engine = new LndEngine(host, symbol, { logger, tlsCertPath: customTlsCertPath, macaroonPath: customMacaroonPath })
    })

    it('returns false if client is not set on an engine', () => {
      engine.client = {}
      expect(engine.isUnlocked).to.be.false()
    })

    it('returns true if client is configured', () => {
      const lightningStub = sinon.stub()
      engine.client = { Lightning: lightningStub }
      expect(engine.isUnlocked).to.be.true()
    })
  })
})
