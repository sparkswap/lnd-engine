const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getChannelsforAddress = rewire(path.resolve(__dirname, 'get-channels-for-address'))

describe('getChannelsforAddress', () => {
  let listChannelsStub
  let listPendingChannelsStub
  let channel
  let channels
  let pendingOpenChannels
  let pendingChannel
  let reverts
  let address
  let loggerStub

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

    reverts = []
    reverts.push(getChannelsforAddress.__set__('listChannels', listChannelsStub))
    reverts.push(getChannelsforAddress.__set__('listPendingChannels', listPendingChannelsStub))
    reverts.push(getChannelsforAddress.__set__('logger', loggerStub))
  })

  afterEach(() => {
    reverts.forEach(r => r())
  })

  it('gets all available channels', async () => {
    await getChannelsforAddress(address)
    expect(listChannelsStub).to.have.been.called()
  })

  it('gets all pending channels', async () => {
    await getChannelsforAddress(address)
    expect(listPendingChannelsStub).to.have.been.called()
  })

  it('returns the number of active and pending channels for the given pubkey', async () => {
    const res = await getChannelsforAddress(address)
    expect(res.length).to.eql(3)
  })

  it('filters out channels that do not have the pubkey', async () => {
    const anotherChannel = { remotePubkey: 'differentpubkey' }
    channels = [channel, anotherChannel]
    listChannelsStub.returns({ channels })
    const res = await getChannelsforAddress(address)
    expect(res.length).to.eql(2)
  })

  it('returns no channels if there are no active or pending channels', async () => {
    channels = []
    pendingOpenChannels = []
    listChannelsStub.returns({ channels })
    listPendingChannelsStub.returns({ pendingOpenChannels })
    const res = await getChannelsforAddress(address)
    expect(res.length).to.eql(0)
    expect(loggerStub.debug).to.have.been.calledWith('getChannelsForAddress: No channels exist')
  })
})
