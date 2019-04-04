const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getPeers = rewire(path.resolve(__dirname, 'get-peers'))

describe('get-peers', () => {
  let listPeersStub
  let res
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

  beforeEach(async () => {
    res = await getPeers.call({ client })
  })

  it('gets peers from lnd', () => {
    expect(listPeersStub).to.have.been.calledWith({ client })
  })

  it('formats peers', () => {
    const expectedRes = [
      { pubKey: '1234', address: '192.168.0.1:10009' },
      { pubKey: '5678', address: '192.168.0.2:10009' }
    ]
    expect(res).to.eql(expectedRes)
    expect(res).to.not.eql(sinon.match(peers))
  })
})
