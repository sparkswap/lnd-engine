const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const LndEngine = rewire(path.resolve('src', 'index'))

describe('lnd-engine index', () => {
  const protoFilePath = LndEngine.__get__('LND_PROTO_FILE_PATH')
  const lndHost = LndEngine.__get__('LND_HOST')
  const tlsPath = LndEngine.__get__('TLS_CERT_PATH')
  const macaroonPath = LndEngine.__get__('MACAROON_PATH')

  let clientStub

  beforeEach(() => {
    clientStub = sinon.stub()

    LndEngine.__set__('actions', {})
    LndEngine.__set__('generateLndClient', clientStub)
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
    const host = 'CUSTOM_HOST:1337'
    const logger = 'CUSTOM_LOGGER'
    const customTlsCertPath = '/custom/cert/path'
    const customMacaroonPath = '/custom/macaroon/path'

    let engine

    beforeEach(() => {
      engine = new LndEngine(host, { logger, tlsCertPath: customTlsCertPath, macaroonPath: customMacaroonPath })
    })

    it('sets a host', () => expect(engine.host).to.eql(host))
    it('sets a logger', () => expect(engine.logger).to.eql(logger))
    it('sets a tlsCertPath', () => expect(engine.tlsCertPath).to.eql(customTlsCertPath))
    it('sets a macaroonPath', () => expect(engine.macaroonPath).to.eql(customMacaroonPath))
  })
})
