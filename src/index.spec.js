const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const LndEngine = rewire(path.resolve('src', 'index'))

describe('lnd-engine index', () => {
  const protoFilePath = LndEngine.__get__('LND_PROTO_FILE_PATH')
  let clientStub
  let currencies
  let validationIndependentActions
  let validationDependentActions

  beforeEach(() => {
    clientStub = sinon.stub()
    currencies = [
      {
        symbol: 'BTC'
      }
    ]

    validationDependentActions = {
      getInvoices: sinon.stub().resolves()
    }

    validationIndependentActions = {
      validateNodeConfig: sinon.stub()
    }

    LndEngine.__set__('validationDependentActions', validationDependentActions)
    LndEngine.__set__('validationIndependentActions', validationIndependentActions)
    LndEngine.__set__('generateLndClient', clientStub)
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

    it('generates an lnd client', () => expect(clientStub).to.have.been.calledWith(host, protoFilePath, customTlsCertPath, customMacaroonPath))
    it('sets a symbol', () => expect(engine.symbol).to.eql(symbol))
    it('retrieves currency config', () => expect(engine.currencyConfig).to.eql(currencies[0]))
    it('sets a host', () => expect(engine.host).to.eql(host))
    it('sets a logger', () => expect(engine.logger).to.eql(logger))
    it('sets a tlsCertPath', () => expect(engine.tlsCertPath).to.eql(customTlsCertPath))
    it('sets a macaroonPath', () => expect(engine.macaroonPath).to.eql(customMacaroonPath))

    it('throws if the currency is not in available configuration', () => {
      expect(() => { new LndEngine(host, 'XYZ') }).to.throw('not a valid symbol') // eslint-disable-line
    })
    it('fails if no host is specified', () => {
      expect(() => new LndEngine(null, symbol)).to.throw('Host is required')
    })

    it('assigns actions', () => {
      expect(engine.validateNodeConfig).to.not.be.undefined()
      expect(engine.getInvoices).to.not.be.undefined()
    })

    it('throws an error if a validation dependent action is called and the engine is not validated', () => {
      return expect(() => engine.getInvoices()).to.throw()
    })

    it('does not throw an error if a validation dependent action is called and the engine is not validated', () => {
      return expect(() => engine.validateNodeConfig()).to.not.throw()
    })

    it('calls the action if the engine is validated', () => {
      engine.validated = true
      engine.getInvoices('test', 'args')
      return expect(validationDependentActions.getInvoices).to.be.calledWith('test', 'args')
    })
  })

  describe('#validateEngines', () => {
    let attempts
    let delay
    let btcEngine
    let ltcEngine

    beforeEach(() => {
      brokerDaemon = new BrokerDaemon(brokerDaemonOptions)

      btcEngine = {
        validateNodeConfig: sinon.stub().resolves()
      }
      ltcEngine = {
        validateNodeConfig: sinon.stub().resolves()
      }
      brokerDaemon.engines = new Map([
        [ 'BTC', btcEngine ],
        [ 'LTC', ltcEngine ]
      ])

      attempts = BrokerDaemon.__get__('EXPONENTIAL_BACKOFF_ATTEMPTS')
      delay = BrokerDaemon.__get__('EXPONENTIAL_BACKOFF_DELAY')
    })

    it('validates the node config on each engine', () => {
      brokerDaemon.validateEngines()

      const validateBtcEngine = exponentialBackoff.args[0][0]
      const btcEngineRes = validateBtcEngine()

      expect(btcEngine.validateNodeConfig).to.have.been.called()
      expect(btcEngineRes).to.be.instanceOf(Promise)

      const validateLtcEngine = exponentialBackoff.args[1][0]
      const ltcEngineRes = validateLtcEngine()

      expect(ltcEngine.validateNodeConfig).to.have.been.called()
      expect(ltcEngineRes).to.be.instanceOf(Promise)
    })

    it('validates the engines in exponentialBackoff to allow for retries', () => {
      brokerDaemon.validateEngines()

      expect(exponentialBackoff).to.have.been.calledTwice()
      expect(exponentialBackoff).to.have.been.calledWith(
        sinon.match.func,
        attempts,
        delay,
        {symbol: 'BTC'}
      )

      expect(exponentialBackoff).to.have.been.calledWith(
        sinon.match.func,
        attempts,
        delay,
        {symbol: 'LTC'}
      )
    })
  })
})
