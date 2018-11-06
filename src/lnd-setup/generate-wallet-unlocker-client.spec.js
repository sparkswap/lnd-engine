const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const generateWalletUnlockerClient = rewire(path.resolve('src', 'lnd-setup', 'generate-wallet-unlocker-client'))

describe('generateWalletUnlockerClient', () => {
  const host = 'host'
  const protoPath = 'protopath'
  const tlsCertPath = 'tlscert'

  let engine
  let loadProtoStub
  let lnrpcProto
  let loggerErrorStub
  let logger
  let readFileSyncStub
  let existsSyncStub
  let tlsCert
  let createSslStub
  let tlsCreds

  beforeEach(() => {
    tlsCert = Buffer.from('cert')
    loggerErrorStub = sinon.stub()
    tlsCreds = sinon.stub()
    createSslStub = sinon.stub().returns(tlsCreds)
    logger = {
      error: loggerErrorStub
    }
    engine = {
      host,
      protoPath,
      tlsCertPath,
      logger
    }
    lnrpcProto = sinon.stub()
    loadProtoStub = sinon.stub().returns({
      lnrpc: {
        WalletUnlocker: lnrpcProto
      }
    })
    readFileSyncStub = sinon.stub().returns(tlsCert)
    existsSyncStub = sinon.stub().returns(true)

    generateWalletUnlockerClient.__set__('loadProto', loadProtoStub)
    generateWalletUnlockerClient.__set__('fs', {
      readFileSync: readFileSyncStub,
      existsSync: existsSyncStub
    })
    generateWalletUnlockerClient.__set__('grpc', {
      credentials: {
        createSsl: createSslStub
      }
    })
  })

  it('loads a proto file from protoPath', () => {
    generateWalletUnlockerClient(engine)
    expect(loadProtoStub).to.have.been.calledWith(protoPath)
  })

  it('throws an error if tls cert is not found', () => {
    existsSyncStub.returns(false)
    expect(() => generateWalletUnlockerClient(engine)).to.throw('tls cert file not found')
  })

  it('reads a tls file', () => {
    generateWalletUnlockerClient(engine)
    expect(readFileSyncStub).to.have.been.calledWith(tlsCertPath)
  })

  it('creates tls credentials', () => {
    generateWalletUnlockerClient(engine)
    expect(createSslStub).to.have.been.calledWith(tlsCert)
  })

  it('returns a new WalletUnlocker rpc', () => {
    generateWalletUnlockerClient(engine)
    expect(lnrpcProto).to.have.been.calledWith(host, tlsCreds)
  })

  context('daemon is already initialized', () => {
    beforeEach(() => {
      loadProtoStub.returns({ lnrpc: {} })
    })

    it('returns null', () => {
      expect(generateWalletUnlockerClient(engine)).to.be.eql(null)
    })

    it('logs an error', () => {
      generateWalletUnlockerClient(engine)
      expect(loggerErrorStub).to.have.been.calledWith('Unable to create WalletUnlocker')
    })
  })
})
