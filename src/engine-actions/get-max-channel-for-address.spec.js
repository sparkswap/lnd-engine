const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getMaxChannelForAddress = rewire(path.resolve(__dirname, 'get-max-channel-for-address'))

describe('getMaxChannelForAddress', () => {
  let channels
  let getChannelsForRemoteAddressStub
  let address
  let logger
  let revertChannels

  beforeEach(() => {
    address = 'bolt:asdf@localhost'
    channels = [
      { localBalance: '10', remoteBalance: '300' },
      { localBalance: '0', remoteBalance: '100' },
      { localBalance: '20', remoteBalance: '1000' },
      { localBalance: '10', remoteBalance: '15' },
      { localBalance: '50', remoteBalance: '30' },
      { localBalance: '0', remoteBalance: '100' }
    ]

    logger = {
      debug: sinon.stub()
    }

    getChannelsForRemoteAddressStub = sinon.stub().resolves(channels)

    getMaxChannelForAddress.__set__('logger', logger)
    revertChannels = getMaxChannelForAddress.__set__('getChannelsForRemoteAddress', getChannelsForRemoteAddressStub)
  })

  afterEach(() => {
    revertChannels()
  })

  it('gets all channels for the given address', async () => {
    await getMaxChannelForAddress(address)
    expect(getChannelsForRemoteAddressStub).to.have.been.called()
    expect(getChannelsForRemoteAddressStub).to.have.been.calledWith(address)
  })

  it('returns empty if no channels exist', async () => {
    getChannelsForRemoteAddressStub.resolves({})

    const expectedRes = {}
    const res = await getMaxChannelForAddress(address)
    expect(logger.debug).to.have.been.calledWith('getMaxChannelForAddress: No open or pending channels exist')
    expect(res).to.eql(expectedRes)
  })

  context('checking outbound channels', () => {
    it('returns max balance of all pending and open channels', async () => {
      const res = await getMaxChannelForAddress(address)
      const expectedRes = { maxBalance: '50' }
      return expect(res).to.eql(expectedRes)
    })
  })

  context('checking inbound channels', () => {
    it('returns max balance of both open and pending channels if open and pending channels exist', async () => {
      const res = await getMaxChannelForAddress(address, { outbound: false })
      const expectedRes = { maxBalance: '1000' }
      return expect(res).to.eql(expectedRes)
    })
  })
})
