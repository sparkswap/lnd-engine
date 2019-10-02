const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const LndEngine = rewire(path.resolve('src', 'index'))
const { CHANNEL_ROUNDING } = require('./constants')

describe('lnd-engine index', () => {
  let clientStub
  let walletStub
  let currencies
  let validationIndependentActions
  let validationDependentActions

  beforeEach(() => {
    clientStub = sinon.stub()
    walletStub = sinon.stub()
    currencies = [
      {
        symbol: 'BTC',
        chainName: 'bitcoin',
        quantumsPerCommon: '100000000',
        secondsPerBlock: 600,
        feeEstimate: '20000',
        maxChannelBalance: '16777215',
        minChannelBalance: '250000',
        maxPaymentSize: '4294967'
      }
    ]
    validationDependentActions = {
      getInvoices: sinon.stub().resolves()
    }

    validationIndependentActions = {
      getStatus: sinon.stub()
    }

    LndEngine.__set__('generateLightningClient', clientStub)
    LndEngine.__set__('generateWalletUnlockerClient', walletStub)
    LndEngine.__set__('validationDependentActions', validationDependentActions)
    LndEngine.__set__('validationIndependentActions', validationIndependentActions)
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
      engine = new LndEngine(host, symbol, { logger, tlsCertPath: customTlsCertPath, macaroonPath: customMacaroonPath, validations: false })
    })

    it('sets a symbol', () => expect(engine.symbol).to.eql(symbol))
    it('retrieves currency config', () => expect(engine.currencyConfig).to.eql(currencies[0]))
    it('assigns the chainName', () => expect(engine.chainName).to.be.eql(currencies[0].chainName))
    it('assigns the quantumsPerCommon', () => expect(engine.quantumsPerCommon).to.be.eql(currencies[0].quantumsPerCommon))
    it('assigns the secondsPerBlock', () => expect(engine.secondsPerBlock).to.be.eql(currencies[0].secondsPerBlock))
    it('assigns the feeEstimate', () => expect(engine.feeEstimate).to.be.eql(currencies[0].feeEstimate))
    it('assigns the maxChannelBalance', () => expect(engine.maxChannelBalance).to.be.eql(currencies[0].maxChannelBalance))
    it('assigns the minChannelBalance', () => expect(engine.minChannelBalance).to.be.eql(currencies[0].minChannelBalance))
    it('assigns the maxPaymentSize', () => expect(engine.maxPaymentSize).to.be.eql(currencies[0].maxPaymentSize))
    it('sets a host', () => expect(engine.host).to.eql(host))
    it('sets a logger', () => expect(engine.logger).to.eql(logger))
    it('sets a tlsCertPath', () => expect(engine.tlsCertPath).to.eql(customTlsCertPath))
    it('sets a macaroonPath', () => expect(engine.macaroonPath).to.eql(customMacaroonPath))
    it('sets validated to false by default', () => expect(engine.validated).to.be.eql(false))
    it('assigns the channel rounding', () => {
      expect(engine.CHANNEL_ROUNDING).to.be.eql(LndEngine.CHANNEL_ROUNDING)
      expect(engine.CHANNEL_ROUNDING).to.be.eql(CHANNEL_ROUNDING)
    })

    it('generates an lnd lightning client', () => {
      expect(clientStub).to.have.been.calledWith(engine)
    })

    it('generates an lnd wallet unlocker client', () => {
      expect(walletStub).to.have.been.calledWith(engine)
    })

    it('throws if the currency is not in available configuration', () => {
      // eslint-disable-next-line
      expect(() => { new LndEngine(host, 'XYZ') }).to.throw('not a valid symbol')
    })

    it('throws if chainName is missing from the configuration', () => {
      delete currencies[0].chainName
      // eslint-disable-next-line
      expect(() => { new LndEngine(host, symbol) }).to.throw(`Currency config for ${symbol} is missing for 'chainName'`)
    })

    it('throws if quantumsPerCommon is missing from the configuration', () => {
      delete currencies[0].quantumsPerCommon
      // eslint-disable-next-line
      expect(() => { new LndEngine(host, symbol) }).to.throw(`Currency config for ${symbol} is missing for 'quantumsPerCommon'`)
    })

    it('throws if secondsPerBlock is missing from the configuration', () => {
      delete currencies[0].secondsPerBlock
      // eslint-disable-next-line
      expect(() => { new LndEngine(host, symbol) }).to.throw(`Currency config for ${symbol} is missing for 'secondsPerBlock'`)
    })

    it('throws if feeEstimate is missing from the configuration', () => {
      delete currencies[0].feeEstimate
      // eslint-disable-next-line
      expect(() => { new LndEngine(host, symbol) }).to.throw(`Currency config for ${symbol} is missing for 'feeEstimate'`)
    })

    it('throws if maxChannelBalance is missing from the configuration', () => {
      delete currencies[0].maxChannelBalance
      // eslint-disable-next-line
      expect(() => { new LndEngine(host, symbol) }).to.throw(`Currency config for ${symbol} is missing for 'maxChannelBalance'`)
    })

    it('throws if minChannelBalance is missing from the configuration', () => {
      delete currencies[0].minChannelBalance
      // eslint-disable-next-line
      expect(() => { new LndEngine(host, symbol) }).to.throw(`Currency config for ${symbol} is missing for 'minChannelBalance'`)
    })

    it('throws if maxPaymentSize is missing from the configuration', () => {
      delete currencies[0].maxPaymentSize
      // eslint-disable-next-line
      expect(() => { new LndEngine(host, symbol) }).to.throw(`Currency config for ${symbol} is missing for 'maxPaymentSize'`)
    })

    it('fails if no host is specified', () => {
      // eslint-disable-next-line
      expect(() => new LndEngine(null, symbol)).to.throw('Host is required')
    })

    it('assigns actions', () => {
      expect(engine.getInvoices).to.not.be.undefined()
      expect(engine.getStatus).to.not.be.undefined()
    })

    it('throws an error if a validation dependent action is called and the engine is not validated', () => {
      return expect(() => engine.getInvoices()).to.throw('is not validated')
    })

    it('does not throw an error if a validation dependent action is called and the engine is not validated', () => {
      return expect(() => engine.getStatus()).to.not.throw()
    })

    it('defaults to an UNKNOWN status', () => {
      const { UNKNOWN } = LndEngine.__get__('ENGINE_STATUSES')
      expect(engine.status).to.be.eql(UNKNOWN)
    })

    it('calls the action', () => {
      const { VALIDATED } = LndEngine.__get__('ENGINE_STATUSES')
      engine.status = VALIDATED
      engine.getInvoices('test', 'args')
      return expect(validationDependentActions.getInvoices).to.be.calledWith('test', 'args')
    })
  })
})
