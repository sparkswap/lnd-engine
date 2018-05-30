const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const createChannel = rewire(path.resolve(__dirname, 'create-channel'))

describe('createChannel', () => {
  let host
  let pubKey
  let fundingAmount
  let connectPeerStub
  let openChannelStub
  let clientStub
  let loggerStub
  let res

  beforeEach(() => {
    host = '127.0.0.1:10111'
    pubKey = '1234'
    fundingAmount = '100'
    connectPeerStub = sinon.stub()
    openChannelStub = sinon.stub()
    clientStub = sinon.stub()
    loggerStub = { info: sinon.stub() }

    createChannel.__set__('connectPeer', connectPeerStub)
    createChannel.__set__('openChannel', openChannelStub)
    createChannel.__set__('client', clientStub)
    createChannel.__set__('logger', loggerStub)
  })

  beforeEach(async () => {
    res = await createChannel(host, pubKey, fundingAmount)
  })

  it('connects to a lnd host', () => {
    expect(connectPeerStub).to.have.been.calledWith(pubKey, host, sinon.match({ client: clientStub, logger: loggerStub }))
  })

  it('opens a channel', () => {
    expect(openChannelStub).to.have.been.calledWith(pubKey, fundingAmount, sinon.match({ client: clientStub }))
  })

  it('returns true for successful channel creation', () => {
    expect(res).to.be.true()
  })
})
