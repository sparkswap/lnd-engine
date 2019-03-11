const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getChannelsForRemoteAddress = rewire(path.resolve(__dirname, 'get-channels-for-remote-address'))

describe('getChannelsForRemoteAddress', () => {
  let listChannelsStub
  let listPendingChannelsStub
  let channel
  let channels
  let pendingOpenChannels
  let pendingChannel
  let reverts
  let address
  let loggerStub
  let networkAddressFormatterStub

  beforeEach(() => {
    address = 'bolt:asdf@localhost'
    channel = { remotePubkey: 'asdf' }
    channels = [channel, channel]
    pendingChannel = { channel: { remoteNodePub: 'asdf' } }
    pendingOpenChannels = [pendingChannel]
    listChannelsStub = sinon.stub().returns({ channels })
    listPendingChannelsStub = sinon.stub().returns({ pendingOpenChannels })
    loggerStub = {
      debug: sinon.stub(),
      error: sinon.stub()
    }
    networkAddressFormatterStub = {
      parse: sinon.stub().returns({ publicKey: 'asdf' })
    }

    reverts = []
    reverts.push(getChannelsForRemoteAddress.__set__('listChannels', listChannelsStub))
    reverts.push(getChannelsForRemoteAddress.__set__('listPendingChannels', listPendingChannelsStub))
    reverts.push(getChannelsForRemoteAddress.__set__('logger', loggerStub))
    reverts.push(getChannelsForRemoteAddress.__set__('networkAddressFormatter', networkAddressFormatterStub))
  })

  afterEach(() => {
    reverts.forEach(r => r())
  })

  it('gets all available channels', async () => {
    await getChannelsForRemoteAddress(address)
    expect(listChannelsStub).to.have.been.called()
  })

  it('gets all pending channels', async () => {
    await getChannelsForRemoteAddress(address)
    expect(listPendingChannelsStub).to.have.been.called()
  })

  it('parses the publickey out of the network address', async () => {
    await getChannelsForRemoteAddress(address)
    expect(networkAddressFormatterStub.parse).to.have.been.called()
    expect(networkAddressFormatterStub.parse).to.have.been.calledWith(address)
  })

  it('returns the number of active and pending channels for the given pubkey', async () => {
    const res = await getChannelsForRemoteAddress(address)
    expect(res.length).to.eql(3)
  })

  it('filters out channels that do not have the pubkey', async () => {
    const anotherChannel = { remotePubkey: 'differentpubkey' }
    channels = [channel, anotherChannel]
    listChannelsStub.returns({ channels })
    const res = await getChannelsForRemoteAddress(address)
    expect(res.length).to.eql(2)
  })

  it('returns early if there are no active or pending channels', async () => {
    channels = []
    pendingOpenChannels = []
    listChannelsStub.returns({ channels })
    listPendingChannelsStub.returns({ pendingOpenChannels })
    const res = await getChannelsForRemoteAddress(address)
    expect(networkAddressFormatterStub.parse).to.not.have.been.called()
    expect(res.length).to.eql(0)
    expect(loggerStub.debug).to.have.been.calledWith('getChannelsForRemoteAddress: No channels exist')
  })
})
