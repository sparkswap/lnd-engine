const path = require('path')
const { rewire, sinon, expect } = require('test/test-helper')

const loadProto = rewire(path.resolve('src', 'utils', 'load-proto'))

describe('loadProto', () => {
  let existsSyncStub
  let badFilePath
  let loadSyncStub
  let packageDefinition
  let loadPackageStub

  beforeEach(() => {
    badFilePath = 'badfile.path'
    existsSyncStub = sinon.stub()
    packageDefinition = sinon.stub()
    loadSyncStub = sinon.stub()
    loadPackageStub = sinon.stub()

    loadProto.__set__('fs', {
      existsSync: existsSyncStub
    })
    loadProto.__set__('grpcProtoLoader', {
      loadSync: loadSyncStub.returns(packageDefinition)
    })
    loadProto.__set__('grpc', {
      loadPackageDefinition: loadPackageStub
    })
  })

  it('throws an error if proto file is not found', () => {
    existsSyncStub.withArgs(badFilePath).returns(false)
    expect(() => loadProto(badFilePath)).to.throw('LND-ENGINE error')
  })

  it('creates a grpc package definition', () => {
    existsSyncStub.returns(true)
    const options = loadProto.__get__('GRPC_OPTIONS')
    const goodFile = 'myfile.good'
    loadProto(goodFile)
    expect(loadSyncStub).to.be.calledWith(goodFile, options)
  })

  it('loads a grpc package definition', () => {
    existsSyncStub.returns(true)
    const goodFile = 'myfile.good'
    loadProto(goodFile)
    expect(loadPackageStub).to.be.calledWith(packageDefinition)
  })
})
