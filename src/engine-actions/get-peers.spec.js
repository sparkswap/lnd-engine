const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getPeers = rewire(path.resolve(__dirname, 'get-peers'))

describe('get-peers', () => {
  let listPeersStub
  let peers
  let client

  beforeEach(() => {
    peers = [
      { pubKey: '1234', address: '192.168.0.1:10009', inbound: false },
      { pubKey: '5678', address: '192.168.0.2:10009', inbound: false }
    ]
    client = sinon.stub()
    listPeersStub = sinon.stub().resolves({ peers })
    getPeers.__set__('listPeers', listPeersStub)
  })

  it('gets peers from lnd', async () => {
    await getPeers.call({ client })
    expect(listPeersStub).to.have.been.calledWith({ client })
  })

  it('formats peers', async () => {
    const expectedRes = [
      { pubKey: '1234', address: '192.168.0.1:10009' },
      { pubKey: '5678', address: '192.168.0.2:10009' }
    ]
    const res = await getPeers.call({ client })
    expect(res).to.eql(expectedRes)
    expect(res).to.not.eql(sinon.match(peers))
  })

  it('returns an empty array if no peers are available', async () => {
    listPeersStub.resolves({})
    const res = await getPeers.call({ client })
    expect(res).to.be.eql([])
  })
})
