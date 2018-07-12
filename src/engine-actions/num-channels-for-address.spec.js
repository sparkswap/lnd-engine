const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const numChannelsForAddress = rewire(path.resolve(__dirname, 'num-channels-for-address'))

describe('numChannelsForAddress', () => {
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
    reverts.push(numChannelsForAddress.__set__('listChannels', listChannelsStub))
    reverts.push(numChannelsForAddress.__set__('listPendingChannels', listPendingChannelsStub))
    reverts.push(numChannelsForAddress.__set__('logger', loggerStub))
  })

  afterEach(() => {
    reverts.forEach(r => r())
  })

  it('gets all available channels', async () => {
    await numChannelsForAddress(address)
    expect(listChannelsStub).to.have.been.called()
  })

  it('gets all pending channels', async () => {
    await numChannelsForAddress(address)
    expect(listPendingChannelsStub).to.have.been.called()
  })

  it('returns the number of active and pending channels for the given pubkey', async () => {
    const res = await numChannelsForAddress(address)
    expect(res).to.eql(3)
  })

  it('filters out channels that do not have the pubkey', async () => {
    const anotherChannel = { remotePubkey: 'differentpubkey' }
    channels = [channel, anotherChannel]
    listChannelsStub.returns({ channels })
    const res = await numChannelsForAddress(address)
    expect(res).to.eql(2)
  })

  it('returns 0 if there are no active or pending channels', async () => {
    channels = []
    pendingOpenChannels = []
    listChannelsStub.returns({ channels })
    listPendingChannelsStub.returns({ pendingOpenChannels })
    const res = await numChannelsForAddress(address)
    expect(res).to.eql(0)
    expect(loggerStub.debug).to.have.been.calledWith('numChannelsForAddress: No channels exist')
  })
})
