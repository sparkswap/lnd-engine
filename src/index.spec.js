const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const LndEngine = rewire(path.resolve('src', 'index'))

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
        symbol: 'BTC'
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
    it('sets a host', () => expect(engine.host).to.eql(host))
    it('sets a logger', () => expect(engine.logger).to.eql(logger))
    it('sets a tlsCertPath', () => expect(engine.tlsCertPath).to.eql(customTlsCertPath))
    it('sets a macaroonPath', () => expect(engine.macaroonPath).to.eql(customMacaroonPath))
    it('sets validated to false by default', () => expect(engine.validated).to.be.eql(false))

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

  describe('#validateEngine', () => {
    const symbol = 'BTC'
    const host = 'CUSTOM_HOST:1337'
    const customTlsCertPath = '/custom/cert/path'
    const customMacaroonPath = '/custom/macaroon/path'

    let engine
    let exponentialStub
    let logger

    beforeEach(() => {
      exponentialStub = sinon.stub()
      logger = {
        info: sinon.stub(),
        error: sinon.stub()
      }

      LndEngine.__set__('exponentialBackoff', exponentialStub)

      engine = new LndEngine(host, symbol, { logger, tlsCertPath: customTlsCertPath, macaroonPath: customMacaroonPath, validations: false })
    })

    it('wraps a function in exponential backoff', async () => {
      await engine.validateEngine()
      expect(exponentialStub).to.have.been.calledWith(sinon.match.func, { symbol }, { debugName: 'validateEngine', logger })
    })

    it('logs if validation is successful', async () => {
      await engine.validateEngine()
      expect(logger.info).to.have.been.calledWith(sinon.match('Validated engine'))
    })

    it('logs error if exponentialBackoff fails', async () => {
      exponentialStub.throws()
      await engine.validateEngine()
      expect(logger.error).to.have.been.calledWith(sinon.match('Failed to validate engine'))
    })

    describe('get validated', () => {
      it('returns false if engines status is not validated', () => {
        const { UNKNOWN } = LndEngine.__get__('ENGINE_STATUSES')
        engine.status = UNKNOWN
        expect(engine.validated).to.be.false()
      })

      it('returns true if engines status is validated', () => {
        const { VALIDATED } = LndEngine.__get__('ENGINE_STATUSES')
        engine.status = VALIDATED
        expect(engine.validated).to.be.true()
      })
    })

    describe('validationCall', () => {
      let validationCall
      let getStatusStub

      beforeEach(async () => {
        const { VALIDATED } = LndEngine.__get__('ENGINE_STATUSES')
        getStatusStub = sinon.stub().resolves(VALIDATED)
        engine.getStatus = getStatusStub
        await engine.validateEngine()

        validationCall = exponentialStub.args[0][0]
      })

      it('generates a lightning client', async () => {
        await validationCall()
        expect(clientStub).to.have.been.calledTwice()
      })

      it('sets a status on the engine', async () => {
        const { VALIDATED } = LndEngine.__get__('ENGINE_STATUSES')
        await validationCall()
        expect(engine.status).to.be.eql(VALIDATED)
      })

      it('throws an error if engine failed to validate', () => {
        const { UNLOCKED } = LndEngine.__get__('ENGINE_STATUSES')
        getStatusStub.resolves(UNLOCKED)
        expect(validationCall()).to.eventually.be.rejectedWith('Engine failed to validate')
      })

      it('throws an error if the validation call fails', async () => {
        const { UNKNOWN } = LndEngine.__get__('ENGINE_STATUSES')
        exponentialStub.throws('BAD')

        try {
          await validationCall()
        } catch (e) {
          expect(logger.error).to.have.been.called()
          expect(engine.status).to.be.eql(UNKNOWN)
        }
      })
    })
  })
})
