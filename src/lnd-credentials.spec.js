const path = require('path')
const { chai, rewire, sinon } = require('test/test-helper')
const { expect } = chai

const lndCredentialsPath = path.resolve('src', 'lnd-credentials')
const LndCredentials = rewire(lndCredentialsPath)

describe('lnd-credentials', () => {
  const { generateCredentials } = LndCredentials

  let metaDataStub
  let metaDataAddSpy
  let grpcRevert
  let fsRevert
  let metaGeneratorSpy
  let sslSpy
  let credSpy

  beforeEach(() => {
    metaGeneratorSpy = sinon.spy()
    sslSpy = sinon.spy()
    credSpy = sinon.spy()
    metaDataAddSpy = sinon.spy()
    metaDataStub = sinon.stub()
    metaDataStub.prototype.add = metaDataAddSpy

    grpcRevert = LndCredentials.__set__('grpc', {
      Metadata: metaDataStub,
      credentials: {
        createFromMetadataGenerator: metaGeneratorSpy,
        createSsl: sslSpy,
        combineChannelCredentials: credSpy
      }
    })
    fsRevert = LndCredentials.__set__('fs', {
      readFileSync: (filePath) => filePath
    })
  })

  afterEach(() => {
    grpcRevert()
    fsRevert()
  })

  describe('generateCredentials', () => {
    const tlsCertPath = 'tlscertpath'
    const macaroonPath = 'macaroonPath'

    it('throws an error for a missing tlsCertPath', () => {
      expect(() => generateCredentials()).to.throw()
    })

    it('throws an error for a missing macaroonPath', () => {
      expect(() => generateCredentials(tlsCertPath)).to.throw()
    })

    it('creates metadata w/ a macaroon hex string', () => {
      generateCredentials(tlsCertPath, macaroonPath)
      expect(metaDataAddSpy).to.have.been.calledWith('macaroon', macaroonPath.toString('hex'))
    })

    it('creates macaroon grpc credentials', () => {
      generateCredentials(tlsCertPath, macaroonPath)
      expect(metaGeneratorSpy).to.have.been.calledOnce()
    })

    it('creates ssl grpc credentials', () => {
      generateCredentials(tlsCertPath, macaroonPath)
      expect(sslSpy).to.have.been.calledWith(tlsCertPath)
    })

    it('combines channel credentials', () => {
      generateCredentials(tlsCertPath, macaroonPath)
      expect(credSpy).to.have.been.calledOnce()
    })
  })
})
