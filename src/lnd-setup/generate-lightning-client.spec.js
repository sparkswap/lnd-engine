const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const generateLightningClient = rewire(path.resolve('src', 'lnd-setup', 'generate-lightning-client'))

describe('generateLightningClient', () => {
  const host = 'host'
  const protoPath = 'protopath'
  const tlsCertPath = 'tlscertpath'
  const macaroonPath = 'macaroonpath'

  let loggerStub
  let engineStub
  let loadProtoStub
  let lightningStub
  let metaDataStub
  let existsSyncStub
  let metaDataGeneratorStub
  let readFileSyncStub
  let tlsCert
  let createSslStub
  let combineCredentialsStub
  let sslCreds
  let macaroonCreds
  let combinedCreds
  let loggerErrorStub
  let loggerWarnStub
  let macaroon

  beforeEach(() => {
    macaroonCreds = 'macaroon'
    sslCreds = 'sslcredentials'
    tlsCert = 'tlscert'
    combinedCreds = 'combined'
    macaroon = 'macaroon'
    loggerErrorStub = sinon.stub()
    loggerWarnStub = sinon.stub()
    loggerStub = {
      warn: loggerWarnStub,
      info: sinon.stub(),
      error: loggerErrorStub
    }
    engineStub = {
      host,
      protoPath,
      tlsCertPath,
      macaroonPath,
      logger: loggerStub
    }
    lightningStub = sinon.stub()
    loadProtoStub = sinon.stub().returns({
      lnrpc: {
        Lightning: lightningStub
      }
    })
    metaDataStub = sinon.stub()
    metaDataStub.prototype.add = sinon.stub()
    existsSyncStub = sinon.stub().returns(true)
    existsSyncStub.withArgs(tlsCertPath)
    metaDataGeneratorStub = sinon.stub().returns(macaroonCreds)
    createSslStub = sinon.stub().returns(sslCreds)
    readFileSyncStub = sinon.stub()
    readFileSyncStub.withArgs(tlsCertPath).returns(tlsCert)
    readFileSyncStub.withArgs(macaroonPath).returns(macaroon)
    combineCredentialsStub = sinon.stub().returns(combinedCreds)

    generateLightningClient.__set__('loadProto', loadProtoStub)
    generateLightningClient.__set__('fs', {
      existsSync: existsSyncStub,
      readFileSync: readFileSyncStub
    })
    generateLightningClient.__set__('grpc', {
      Metadata: metaDataStub,
      credentials: {
        createFromMetadataGenerator: metaDataGeneratorStub,
        createSsl: createSslStub,
        combineChannelCredentials: combineCredentialsStub
      }
    })
  })

  it('loads a proto file', () => {
    generateLightningClient(engineStub)
    expect(loadProtoStub).to.have.been.calledWith(protoPath)
  })

  it('errors if a tls cert is not on disk', () => {
    existsSyncStub.withArgs(tlsCertPath).returns(false)
    expect(() => generateLightningClient(engineStub)).to.throw('LND-ENGINE error - tls cert file not found')
  })

  it('creates macaroon metadata', () => {
    generateLightningClient(engineStub)
    const callback = metaDataGeneratorStub.args[0][0]
    const callBackStub = sinon.stub()
    callback(null, callBackStub)
    expect(callBackStub).to.have.been.calledWith(null, new metaDataStub()) // eslint-disable-line
  })

  it('creates tls credentials', () => {
    generateLightningClient(engineStub)
    expect(createSslStub).to.have.been.calledWith(tlsCert)
  })

  it('combines tls and macaroon credentials', () => {
    generateLightningClient(engineStub)
    expect(combineCredentialsStub).to.have.been.calledWith(sslCreds, macaroonCreds)
  })

  it('creates a new lightning rpc client', () => {
    generateLightningClient(engineStub)
    expect(lightningStub).to.have.been.calledWith(host, combinedCreds)
  })

  context('macaroon not found', () => {
    beforeEach(() => {
      existsSyncStub.withArgs(macaroonPath).returns(false)
    })

    it('logs a warning if macaroon was not found', () => {
      generateLightningClient(engineStub)
      expect(loggerWarnStub).to.have.been.calledWith(sinon.match('macaroon path not found'))
    })

    it('it only uses ssl credentials', () => {
      generateLightningClient(engineStub)
      expect(metaDataGeneratorStub).to.not.have.been.called()
      expect(combineCredentialsStub).to.not.have.been.called()
    })
  })
})
