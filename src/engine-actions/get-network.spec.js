const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getNetwork = rewire(path.resolve(__dirname, 'get-network'))

describe.only('getPublicKey', () => {
  let getInfoResponse
  let getInfoStub
  let clientStub
  let res

  beforeEach(() => {
    getInfoResponse = {
      chains: [{
        chain: 'bitcoin',
        network: 'mainnet'
      }]
    }
    getInfoStub = sinon.stub().returns(getInfoResponse)
    clientStub = sinon.stub()

    getNetwork.__set__('getInfo', getInfoStub)
    getNetwork.__set__('client', clientStub)
  })

  beforeEach(async () => {
    res = await getNetwork()
  })

  it('gets info on a specified lnd instance', () => {
    expect(getInfoStub).to.have.been.calledWith(sinon.match({ client: clientStub }))
  })

  it('returns the identity_publickey', () => {
    expect(res).to.be.eql('mainnet')
  })
})
