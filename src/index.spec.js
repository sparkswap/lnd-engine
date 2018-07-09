const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const LndEngine = rewire(path.resolve('src', 'index'))

describe('lnd-engine index', () => {
  const protoFilePath = LndEngine.__get__('LND_PROTO_FILE_PATH')
  const lndHost = LndEngine.__get__('LND_HOST')
  const tlsPath = LndEngine.__get__('TLS_CERT_PATH')
  const macaroonPath = LndEngine.__get__('MACAROON_PATH')

  let clientStub
  let currencies

  beforeEach(() => {
    clientStub = sinon.stub()
    currencies = [
      {
        symbol: 'BTC'
      }
    ]

    LndEngine.__set__('actions', {})
    LndEngine.__set__('generateLndClient', clientStub)
    LndEngine.__set__('currencies', currencies)
  })

  describe('default', () => {
    let engine

    beforeEach(() => {
      engine = new LndEngine()
    })

    it('sets a default host', () => expect(engine.host).to.eql(lndHost))
    it('sets a default logger', () => expect(engine.logger).to.eql(console))
    it('sets a default tlsCertPath', () => expect(engine.tlsCertPath).to.eql(tlsPath))
    it('sets a default macaroonPath', () => expect(engine.macaroonPath).to.eql(macaroonPath))
    it('sets a default protoPath', () => expect(engine.protoPath).to.eql(protoFilePath))
    it('generates an lnd client', () => expect(clientStub).to.have.been.calledWith(lndHost, protoFilePath, tlsPath, macaroonPath))
  })

  describe('constructor values', () => {
    const symbol = 'BTC'
    const host = 'CUSTOM_HOST:1337'
    const logger = 'CUSTOM_LOGGER'
    const customTlsCertPath = '/custom/cert/path'
    const customMacaroonPath = '/custom/macaroon/path'

    let engine

    beforeEach(() => {
      engine = new LndEngine(symbol, host, { logger, tlsCertPath: customTlsCertPath, macaroonPath: customMacaroonPath })
    })

    it('sets a symbol', () => expect(engine.symbol).to.eql(symbol))
    it('retrieves currency config', () => expect(engine.currencyConfig).to.eql(currencies[0]))
    it('sets a host', () => expect(engine.host).to.eql(host))
    it('sets a logger', () => expect(engine.logger).to.eql(logger))
    it('sets a tlsCertPath', () => expect(engine.tlsCertPath).to.eql(customTlsCertPath))
    it('sets a macaroonPath', () => expect(engine.macaroonPath).to.eql(customMacaroonPath))

    it('throws if the currency is not in available configuration', () => {
      expect(() => { new LndEngine('XYZ') }).to.throw('not a valid symbol') // eslint-disable-line
    })
  })

  describe('#initialize', () => {
    const symbol = 'BTC'
    const host = 'CUSTOM_HOST:1337'
    const logger = 'CUSTOM_LOGGER'
    const customTlsCertPath = '/custom/cert/path'
    const customMacaroonPath = '/custom/macaroon/path'
    let engine

    beforeEach(() => {
      engine = new LndEngine(symbol, host, { logger, tlsCertPath: customTlsCertPath, macaroonPath: customMacaroonPath })

      engine.validateNodeConfig = sinon.stub().resolves()
    })

    it('returns a promise', () => {
      expect(engine.initialize()).to.be.a('promise')
    })

    it('validates the node config', async () => {
      await engine.initialize()

      expect(engine.validateNodeConfig).to.have.been.calledOnce()
    })

    it('throws if validation fails', () => {
      engine.validateNodeConfig.rejects(new Error('fake error'))
      return expect(engine.initialize()).to.eventually.be.rejectedWith('fake error')
    })
  })
})
