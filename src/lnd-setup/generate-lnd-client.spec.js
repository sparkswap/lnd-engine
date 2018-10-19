const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const LndEngine = rewire(path.resolve('src', 'lnd-setup', 'generate-lnd-client'))

describe('lnd-engine index', () => {
  let grpcLoadStub
  let loadPackageStub
  let protoDefinition

  let reverts = []

  beforeEach(() => {
    protoDefinition = sinon.stub()
    grpcLoadStub = sinon.stub().returns(protoDefinition)
    loadPackageStub = sinon.stub()

    reverts.push(LndEngine.__set__('grpcProtoLoader', { loadSync: grpcLoadStub }))
    reverts.push(LndEngine.__set__('grpc', { loadPackageDefinition: loadPackageStub }))
  })

  afterEach(() => {
    reverts.forEach(r => r())
  })

  describe('loadProto', () => {
    const grpcOptions = LndEngine.__get__('GRPC_OPTIONS')

    let loadProto

    beforeEach(() => {
      loadProto = LndEngine.__get__('loadProto')
    })

    it('throws an error if a path doesn\'t exist', () => {
      expect(() => loadProto()).to.throw('LND-ENGINE error - Proto file not found at path: undefined')
    })

    it('creates a package definition', () => {
      const protoPath = 'localhost:1337'
      const revert = LndEngine.__set__('fs', { existsSync: sinon.stub().returns(true) })
      loadProto(protoPath)
      expect(grpcLoadStub).to.have.been.calledWith(protoPath, grpcOptions)
      revert()
    })

    it('loads a proto file', () => {
      const protoPath = 'localhost:1337'
      const revert = LndEngine.__set__('fs', { existsSync: sinon.stub().returns(true) })
      loadProto(protoPath)
      expect(loadPackageStub).to.have.been.calledWith(protoDefinition)
      revert()
    })
  })
})
