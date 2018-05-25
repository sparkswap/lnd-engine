const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getPublicKey = rewire(path.resolve(__dirname, 'get-public-key'))

describe('getPublicKey', () => {
  let getInfoResponse
  let getInfoStub
  let clientStub
  let res

  beforeEach(() => {
    getInfoResponse = { identityPubkey: '1234' }
    getInfoStub = sinon.stub().returns(getInfoResponse)
    clientStub = sinon.stub()

    getPublicKey.__set__('getInfo', getInfoStub)
    getPublicKey.__set__('client', clientStub)
  })

  beforeEach(async () => {
    res = await getPublicKey()
  })

  it('gets info on a specified lnd instance', () => {
    expect(getInfoStub).to.have.been.calledWith(sinon.match({ client: clientStub }))
  })

  it('returns the identity_publickey', () => {
    expect(res).to.be.eql(getInfoResponse.identityPubkey)
  })
})
