const path = require('path')
const { chai, rewire, sinon } = require('test/test-helper')
const { expect } = chai

const lndPath = path.resolve('src', 'lnd-engine')
const LndEngine = rewire(lndPath)

describe('lnd-engine', () => {
  let host
  let tlsCertPath
  let macaroonPath
  let engine
  let logger

  const credSpy = sinon.spy()

  let lightning = sinon.stub()

  beforeEach(() => {
    host = 'fakehost'
    tlsCertPath = '/certpath/tls.cert'
    macaroonPath = '/macaroonpath/admin.macaroon'
    logger = 'logger'

    LndEngine.__set__('path', { resolve: (param) => param })
    LndEngine.__set__('fs', { existsSync: (param) => true })
    LndEngine.__set__('loadService', (param) => {
      expect(param).to.include('.proto')
      return { lnrpc: { Lightning: lightning } }
    })
    LndEngine.__set__('generateCredentials', credSpy)

    engine = new LndEngine(host, { logger, tlsCertPath, macaroonPath })
  })

  describe('properties', () => {
    it('resolves a path for the engine proto file', () => {
      expect(engine.protoPath).to.include('.proto')
    })

    it('generates credentials', () => {
      expect(credSpy).to.have.been.calledWith(tlsCertPath, macaroonPath)
    })

    it('sets service options', () => {
      expect(engine.serviceOptions).to.not.be.null()
      expect(engine.serviceOptions).to.not.be.undefined()
    })
  })

  describe('defaults', () => {
    beforeEach(function () {
      sinon.stub(process, 'env').value({
        LND_HOST: host,
        TLS_CERT_PATH: tlsCertPath,
        MACAROON_PATH: macaroonPath
      })

      engine = new LndEngine()
    })

    it('sets a host', () => {
      expect(engine.host).to.eql(host)
    })

    it('sets a logger', () => {
      expect(engine.logger).to.eql(console)
    })

    it('sets a tlsCertPath', () => {
      expect(engine.tlsCertPath).to.eql(tlsCertPath)
    })

    it('sets a macaroonPath', () => {
      expect(engine.macaroonPath).to.eql(macaroonPath)
    })
  })

  describe('missing values', () => {
    it('throws an error for a missing proto file', () => {
      LndEngine.__set__('fs', { existsSync: (param) => false })
      expect(() => new LndEngine()).to.throw('LND-ENGINE error: Proto file not found')
    })

    it('throws an error for a missing LND_HOST', () => {
      sinon.stub(process, 'env').value({ LND_HOST: undefined })
      expect(() => new LndEngine()).to.throw('LND_ENGINE error: no host is specified')
    })
  })
})
