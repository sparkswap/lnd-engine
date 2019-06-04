const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getTotalBalanceForAddress = rewire(path.resolve(__dirname, 'get-total-balance-for-address'))

describe('getTotalBalanceForAddress', () => {
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

    getTotalBalanceForAddress.__set__('logger', logger)
    revertChannels = getTotalBalanceForAddress.__set__('getChannelsForRemoteAddress', getChannelsForRemoteAddressStub)
  })

  afterEach(() => {
    revertChannels()
  })

  it('gets all channels for the given address', async () => {
    const ctx = { fake: 'context' }
    await getTotalBalanceForAddress.call(ctx, address)
    expect(getChannelsForRemoteAddressStub).to.have.been.called()
    expect(getChannelsForRemoteAddressStub).to.have.been.calledOn(ctx)
    expect(getChannelsForRemoteAddressStub).to.have.been.calledWith(address)
  })

  it('returns 0 if no channels exist', async () => {
    getChannelsForRemoteAddressStub.resolves([])

    const expectedRes = '0'
    const res = await getTotalBalanceForAddress(address)
    expect(logger.debug).to.have.been.calledWith('getTotalBalanceForAddress: No open or pending channels exist')
    expect(res).to.eql(expectedRes)
  })

  it('returns total local balance of all pending and open channels', async () => {
    const res = await getTotalBalanceForAddress(address)
    const expectedRes = '90'
    return expect(res).to.eql(expectedRes)
  })
})
