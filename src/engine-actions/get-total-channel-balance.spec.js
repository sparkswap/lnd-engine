const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getTotalChannelBalance = rewire(path.resolve(__dirname, 'get-total-channel-balance'))

describe('getTotalChannelBalance', () => {
  let listChannelsStub
  let listPendingChannelsStub
  let channel
  let channels
  let pendingChannels
  let pendingChannel
  let reverts
  let remotePubKey

  beforeEach(() => {
    remotePubKey = 'asdf'
    channel = { remotePubKey, remoteBalance: 500 }
    channels = [channel, channel]
    pendingChannel = { channel: { remoteNodePub: remotePubKey, remoteBalance: 400 } }
    pendingChannels = [pendingChannel]
    listChannelsStub = sinon.stub().returns({ channels })
    listPendingChannelsStub = sinon.stub().returns({ pendingChannels })

    reverts = []
    reverts.push(getTotalChannelBalance.__set__('listChannels', listChannelsStub))
    reverts.push(getTotalChannelBalance.__set__('listPendingChannels', listPendingChannelsStub))
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
    expect(res).to.eql({activeBalance: '500', pendingBalance: '400'})
  })

  it('filters out channels that do not have the remotePubKey', async () => {
    const anotherChannel = { remotePubKey: 'differentpubkey', remoteBalance: 500 }
    channels = [channel, anotherChannel]
    const res = await getTotalChannelBalance(remotePubKey)
    expect(res).to.eql({activeBalance: '500', pendingBalance: '400'})
  })
})
