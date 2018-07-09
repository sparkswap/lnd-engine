const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getTotalChannelBalance = rewire(path.resolve(__dirname, 'get-total-channel-balance'))

describe('getTotalChannelBalance', () => {
  let listChannelsStub
  let listPendingChannelsStub
  let channel
  let channels
  let pendingOpenChannels
  let pendingChannel
  let reverts
  let remotePubKey
  let loggerStub

  beforeEach(() => {
    remotePubKey = 'asdf'
    channel = { remotePubkey: remotePubKey, remoteBalance: '500' }
    channels = [channel, channel]
    pendingChannel = { channel: { remoteNodePub: remotePubKey, remoteBalance: '400' } }
    pendingOpenChannels = [pendingChannel]
    listChannelsStub = sinon.stub().returns({ channels })
    listPendingChannelsStub = sinon.stub().returns({ pendingOpenChannels })
    loggerStub = {
      debug: sinon.stub(),
      error: sinon.stub()
    }

    reverts = []
    reverts.push(getTotalChannelBalance.__set__('listChannels', listChannelsStub))
    reverts.push(getTotalChannelBalance.__set__('listPendingChannels', listPendingChannelsStub))
    reverts.push(getTotalChannelBalance.__set__('logger', loggerStub))
  })

  afterEach(() => {
    reverts.forEach(r => r())
  })

  it('gets all available channels', async () => {
    await getTotalChannelBalance(remotePubKey)
    expect(listChannelsStub).to.have.been.called()
  })

  it('gets all pending channels', async () => {
    await getTotalChannelBalance(remotePubKey)
    expect(listPendingChannelsStub).to.have.been.called()
  })

  it('returns the added balance of the active and pending channels', async () => {
    const res = await getTotalChannelBalance(remotePubKey)
    expect(res).to.eql({activeBalance: '1000', pendingBalance: '400'})
  })

  it('filters out channels that do not have the remotePubKey', async () => {
    const anotherChannel = { remotePubkey: 'differentpubkey', remoteBalance: '500' }
    channels = [channel, anotherChannel]
    listChannelsStub.returns({ channels })
    const res = await getTotalChannelBalance(remotePubKey)
    expect(res).to.eql({activeBalance: '500', pendingBalance: '400'})
  })

  it('returns empty values if there are no active or pending channels', async () => {
    channels = []
    pendingOpenChannels = []
    listChannelsStub.returns({ channels })
    listPendingChannelsStub.returns({ pendingOpenChannels })
    const res = await getTotalChannelBalance(remotePubKey)
    expect(res).to.eql({activeBalance: '0', pendingBalance: '0'})
    expect(loggerStub.debug).to.have.been.calledWith('getTotalChannelBalance: No channels exist')
  })
})
