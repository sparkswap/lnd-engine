const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const generateLightningClient = rewire(path.resolve('src', 'lnd-setup', 'generate-lightning-client'))

describe('generateLightningClient', () => {
  const host = 'host'
  const protoPath = 'protopath'
  const tlsCertPath = 'tlscertpath'
  const macaroonPath = 'macaroonpath'

  let status
  let loggerStub
  let engineStub
  let loadProtoStub
  let lightningStub
  let invoicesStub
  let routerStub
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

    status = 'UNKNOWN'
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
      status,
      logger: loggerStub
    }
    lightningStub = sinon.stub()
    invoicesStub = sinon.stub()
    routerStub = sinon.stub()
    loadProtoStub = sinon.stub().returns({
      lnrpc: {
        Lightning: lightningStub
      },
      invoicesrpc: {
        Invoices: invoicesStub
      },
      routerrpc: {
        Router: routerStub
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
    const Invoices = invoicesStub
    const Router = routerStub

    const client = generateLightningClient(engineStub)
    expect(client.invoices).to.be.eql(new Invoices())
    expect(client.router).to.be.eql(new Router())
    expect(loadProtoStub).to.have.been.calledWith(
      sinon.match(protoPath), sinon.match.array.contains(['rpc.proto', 'invoicesrpc/invoices.proto', 'routerrpc/router.proto']))
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

    it('does not log a warning if the engine status is unknown', () => {
      generateLightningClient(engineStub)
      expect(loggerWarnStub).to.not.have.been.called()
    })

    it('does not log a warning if the engine needs a wallet', () => {
      engineStub.status = 'NEEDS_WALLET'
      generateLightningClient(engineStub)
      expect(loggerWarnStub).to.not.have.been.called()
    })

    it('logs a warning if macaroon was not found and the engine is locked', () => {
      engineStub.status = 'LOCKED'
      generateLightningClient(engineStub)
      expect(loggerWarnStub).to.have.been.calledWith(sinon.match('macaroon not found'))
    })

    it('logs a warning if macaroon was not found and the engine is unlocked', () => {
      engineStub.status = 'UNLOCKED'
      generateLightningClient(engineStub)
      expect(loggerWarnStub).to.have.been.calledWith(sinon.match('macaroon not found'))
    })

    it('logs a warning if macaroon was not found and the engine is not synced', () => {
      engineStub.status = 'NOT_SYNCED'
      generateLightningClient(engineStub)
      expect(loggerWarnStub).to.have.been.calledWith(sinon.match('macaroon not found'))
    })

    it('logs a warning if macaroon was not found and the engine is validated', () => {
      engineStub.status = 'VALIDATED'
      generateLightningClient(engineStub)
      expect(loggerWarnStub).to.have.been.calledWith(sinon.match('macaroon not found'))
    })

    it('it only uses ssl credentials', () => {
      generateLightningClient(engineStub)
      expect(metaDataGeneratorStub).to.not.have.been.called()
      expect(combineCredentialsStub).to.not.have.been.called()
    })
  })
})
