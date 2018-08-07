const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getOpenChannelCapacities = rewire(path.resolve(__dirname, 'get-open-channel-capacities'))

describe('getOpenChannelCapacities', () => {
  let channels
  let listChannelsStub
  let logger

  beforeEach(() => {
    channels = [
      { localBalance: '10', remoteBalance: '300', active: true },
      { localBalance: '0', remoteBalance: '100', active: true },
      { localBalance: '20', remoteBalance: '1000', active: false },
      { localBalance: '10', remoteBalance: '15', active: true }
    ]

    logger = {
      debug: sinon.stub()
    }

    getOpenChannelCapacities.__set__('logger', logger)
  })

  it('returns 0 for active and inactive if no channels exist', async () => {
    const expectedRes = { active: { localBalance: '0', remoteBalance: '0' }, inactive: { localBalance: '0', remoteBalance: '0' } }
    listChannelsStub = sinon.stub().returns({})
    getOpenChannelCapacities.__set__('listChannels', listChannelsStub)
    return expect(await getOpenChannelCapacities()).to.eql(expectedRes)
  })

  it('returns the total balance of all channels on a daemon', async () => {
    const expectedRes = { active: { localBalance: '20', remoteBalance: '415' }, inactive: { localBalance: '20', remoteBalance: '1000' } }
    listChannelsStub = sinon.stub().returns({ channels })
    getOpenChannelCapacities.__set__('listChannels', listChannelsStub)
    return expect(await getOpenChannelCapacities()).to.eql(expectedRes)
  })
})
