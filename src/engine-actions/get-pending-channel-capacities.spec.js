const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getPendingChannelCapacities = rewire(path.resolve(__dirname, 'get-pending-channel-capacities'))

describe('getPendingChannelCapacities', () => {
  let pendingOpenChannels
  let listChannelsStub
  let logger

  beforeEach(() => {
    pendingOpenChannels = [
      { channel: { localBalance: '10', remoteBalance: '300' } },
      { channel: { localBalance: '0', remoteBalance: '100' } }
    ]

    logger = {
      debug: sinon.stub()
    }

    getPendingChannelCapacities.__set__('logger', logger)
  })

  it('returns 0 for active and inactive if no channels exist', async () => {
    const expectedRes = { localBalance: '0', remoteBalance: '0' }
    listChannelsStub = sinon.stub().resolves({})
    getPendingChannelCapacities.__set__('listPendingChannels', listChannelsStub)
    return expect(await getPendingChannelCapacities()).to.eql(expectedRes)
  })

  it('returns the total balance of all channels on a daemon', async () => {
    const expectedRes = { localBalance: '10', remoteBalance: '400' }
    listChannelsStub = sinon.stub().resolves({ pendingOpenChannels })
    getPendingChannelCapacities.__set__('listPendingChannels', listChannelsStub)
    return expect(await getPendingChannelCapacities()).to.eql(expectedRes)
  })
})
