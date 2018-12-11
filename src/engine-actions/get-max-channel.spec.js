const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getMaxChannel = rewire(path.resolve(__dirname, 'get-max-channel'))

describe('getMaxChannel', () => {
  let channels
  let listChannelsStub
  let pendingChannels
  let listPendingChannelsStub
  let logger
  let revertChannels
  let revertPendingChannels

  beforeEach(() => {
    channels = [
      { localBalance: '10', remoteBalance: '300' },
      { localBalance: '0', remoteBalance: '100' },
      { localBalance: '20', remoteBalance: '1000' },
      { localBalance: '10', remoteBalance: '15' }
    ]

    pendingChannels = [
      { channel: { localBalance: '50', remoteBalance: '30' } },
      { channel: { localBalance: '0', remoteBalance: '100' } }
    ]

    logger = {
      debug: sinon.stub()
    }

    listChannelsStub = sinon.stub().resolves({channels})
    listPendingChannelsStub = sinon.stub().resolves({pendingOpenChannels: pendingChannels})

    getMaxChannel.__set__('logger', logger)
    revertChannels = getMaxChannel.__set__('listChannels', listChannelsStub)
    revertPendingChannels = getMaxChannel.__set__('listPendingChannels', listPendingChannelsStub)
  })

  afterEach(() => {
    revertChannels()
    revertPendingChannels()
  })

  it('returns empty if no channels exist', async () => {
    listChannelsStub.resolves({})
    listPendingChannelsStub.resolves({})

    const expectedRes = {}
    const res = await getMaxChannel()
    expect(logger.debug).to.have.been.calledWith('getMaxChannel: No open or pending channels exist')
    expect(res).to.eql(expectedRes)
  })

  context('checking outbound channels', () => {
    it('returns max balance of open channels if there are open channels only', async () => {
      listPendingChannelsStub.resolves({})
      const res = await getMaxChannel()
      const expectedRes = { maxBalance: '20' }
      return expect(res).to.eql(expectedRes)
    })

    it('returns max pending balance of pending channels if there are pending channels only', async () => {
      listChannelsStub.resolves({})
      const res = await getMaxChannel()
      const expectedRes = { maxBalance: '50' }
      return expect(res).to.eql(expectedRes)
    })

    it('returns max balance of both open and pending channels if open and pending channels exist', async () => {
      const res = await getMaxChannel()
      const expectedRes = { maxBalance: '50' }
      return expect(res).to.eql(expectedRes)
    })
  })

  context('checking inbound channels', () => {
    it('returns max balance of open channels if there are open channels only', async () => {
      listPendingChannelsStub.resolves({})
      const res = await getMaxChannel({outbound: false})
      const expectedRes = { maxBalance: '1000' }
      return expect(res).to.eql(expectedRes)
    })

    it('returns max pending balance of pending channels if there are pending channels only', async () => {
      listChannelsStub.resolves({})
      const res = await getMaxChannel({outbound: false})
      const expectedRes = { maxBalance: '100' }
      return expect(res).to.eql(expectedRes)
    })

    it('returns max balance of both open and pending channels if open and pending channels exist', async () => {
      const res = await getMaxChannel({outbound: false})
      const expectedRes = { maxBalance: '1000' }
      return expect(res).to.eql(expectedRes)
    })
  })
})
