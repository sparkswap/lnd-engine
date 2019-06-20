const path = require('path')
const { rewire, sinon, expect } = require('test/test-helper')

const loadProto = rewire(path.resolve('src', 'utils', 'load-proto'))

describe('loadProto', () => {
  let existsSyncStub
  let loadSyncStub
  let packageDefinition
  let loadPackageStub

  beforeEach(() => {
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

  it('creates a grpc package definition', () => {
    existsSyncStub.returns(true)
    const getGrpcOptions = loadProto.__get__('getGrpcOptions')
    const basePath = '/tmp/'
    const goodFile = 'myfile.good'
    const options = getGrpcOptions(basePath)
    loadProto(basePath, goodFile)
    expect(loadSyncStub).to.be.calledWith(goodFile, options)
  })

  it('loads a grpc package definition', () => {
    existsSyncStub.returns(true)
    const goodFile = 'myfile.good'
    loadProto('/tmp', goodFile)
    expect(loadPackageStub).to.be.calledWith(packageDefinition)
  })
})
