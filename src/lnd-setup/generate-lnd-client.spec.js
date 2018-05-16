const path = require('path')
const { chai, rewire, sinon } = require('test/test-helper')
const { expect } = chai

const LndEngine = rewire(path.resolve('src', 'lnd-setup', 'generate-lnd-client'))

describe('lnd-engine index', () => {
  let revertGrpc
  let grpcLoadStub

  beforeEach(() => {
    grpcLoadStub = sinon.stub()

    revertGrpc = LndEngine.__set__('grpc', {
      load: grpcLoadStub
    })
  })

  afterEach(() => {
    revertGrpc()
  })

  describe('loadProto', () => {
    const grpcFileType = LndEngine.__get__('GRPC_FILE_TYPE')
    const grpcOptions = LndEngine.__get__('GRPC_OPTIONS')

    let loadProto

    beforeEach(() => {
      loadProto = LndEngine.__get__('loadProto')
    })

    it('throws an error if a path doesn\'t exist', () => {
      expect(() => loadProto()).to.throw('LND-ENGINE error: Proto file not found')
    })

    it('loads a proto file', () => {
      const host = 'localhost:1337'
      const revert = LndEngine.__set__('fs', { existsSync: sinon.stub().returns(true) })
      loadProto(host)
      expect(grpcLoadStub).to.have.been.calledWith(host, grpcFileType, grpcOptions)
      revert()
    })
  })
})
