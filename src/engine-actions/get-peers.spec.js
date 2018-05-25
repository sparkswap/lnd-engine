const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getPeers = rewire(path.resolve(__dirname, 'get-peers'))

describe('getPeers', () => {
  let peersResponse
  let listPeersStub
  let clientStub
  let res

  beforeEach(() => {
    peersResponse = { peers: ['1234'] }
    listPeersStub = sinon.stub().returns(peersResponse)
    clientStub = sinon.stub()

    getPeers.__set__('listPeers', listPeersStub)
    getPeers.__set__('client', clientStub)
  })

  beforeEach(async () => {
    res = await getPeers()
  })

  it('gets a peer list from lnd', () => {
    expect(listPeersStub).to.have.been.calledWith(sinon.match({ client: clientStub }))
  })

  it('returns the result', () => {
    expect(res).to.be.eql(peersResponse.peers)
  })
})
