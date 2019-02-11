const path = require('path')
const { rewire, sinon, expect } = require('test/test-helper')

const getChannels = rewire(path.resolve(__dirname, 'get-channels'))

describe('get-channels', () => {
  let listChannels
  let listClosedChannels
  let client

  beforeEach(() => {
    listChannels = sinon.stub()
    listClosedChannels = sinon.stub()
    client = { fake: 'client' }

    getChannels.__set__('listChannels', listChannels)
    getChannels.__set__('listClosedChannels', listClosedChannels)
  })

  describe('getChannels', () => {
    let getOpenChannels
    let getClosedChannels
    let openChannels
    let closedChannels

    beforeEach(() => {
      openChannels = new Map([['1', 'one'], ['2', 'two']])
      closedChannels = new Map([['2', 'dos'], ['3', 'three']])

      getOpenChannels = sinon.stub().resolves(openChannels)
      getClosedChannels = sinon.stub().resolves(closedChannels)

      getChannels.__set__('getOpenChannels', getOpenChannels)
      getChannels.__set__('getClosedChannels', getClosedChannels)
    })

    it('gets open channels', async () => {
      await getChannels.call({ client })

      expect(getOpenChannels).to.have.been.calledOnce()
      expect(getOpenChannels).to.have.been.calledWith({ client })
    })

    it('gets closed channels', async () => {
      await getChannels.call({ client })

      expect(getClosedChannels).to.have.been.calledOnce()
      expect(getClosedChannels).to.have.been.calledWith({ client })
    })

    it('merges open and closed channels and returns them', async () => {
      const channels = await getChannels.call({ client })

      expect(channels).to.be.an('array')
      expect(channels).to.have.lengthOf(3)
      expect(channels[0]).to.be.eql(openChannels.get('1'))
      expect(channels[1]).to.be.eql(closedChannels.get('2'))
      expect(channels[2]).to.be.eql(closedChannels.get('3'))
    })
  })

  describe('getOpenChannels', () => {
    const getOpenChannels = getChannels.__get__('getOpenChannels')
    let normalizeChannels
    let channels
    let normalizedChannels

    beforeEach(() => {
      channels = ['fake channel 1', 'fake channel 2']
      listChannels.resolves({ channels })

      normalizedChannels = new Map([['1', 'fake'], ['2', 'faker']])
      normalizeChannels = sinon.stub().returns(normalizedChannels)

      getChannels.__set__('normalizeChannels', normalizeChannels)
    })

    it('gets the open channels from LND', async () => {
      await getOpenChannels({ client })

      expect(listChannels).to.have.been.calledOnce()
      expect(listChannels).to.have.been.calledWith({ client })
    })

    it('normalizes channels and returns them', async () => {
      expect(await getOpenChannels({ client })).to.be.eql(normalizedChannels)
      expect(normalizeChannels).to.have.been.calledOnce()
      expect(normalizeChannels).to.have.been.calledWith(channels)
    })
  })

  describe('getClosedChannels', () => {
    const getClosedChannels = getChannels.__get__('getClosedChannels')
    let normalizeChannels
    let channels
    let normalizedChannels

    beforeEach(() => {
      channels = ['fake channel 1', 'fake channel 2']
      listClosedChannels.resolves({ channels })

      normalizedChannels = new Map([['1', 'fake'], ['2', 'faker']])
      normalizeChannels = sinon.stub().returns(normalizedChannels)

      getChannels.__set__('normalizeChannels', normalizeChannels)
    })

    it('gets the open channels from LND', async () => {
      await getClosedChannels({ client })

      expect(listClosedChannels).to.have.been.calledOnce()
      expect(listClosedChannels).to.have.been.calledWith({ client })
    })

    it('normalizes channels and returns them', async () => {
      expect(await getClosedChannels({ client })).to.be.eql(normalizedChannels)
      expect(normalizeChannels).to.have.been.calledOnce()
      expect(normalizeChannels).to.have.been.calledWith(channels)
    })
  })

  describe('normalizeChannels', () => {
    const normalizeChannels = getChannels.__get__('normalizeChannels')
    let channels
    let normalizeChannel
    let normalizedChannels

    beforeEach(() => {
      channels = ['fake channel 1', 'fake channel 2']
      normalizedChannels = [
        {
          channelId: '1'
        },
        {
          channelId: '2'
        }
      ]

      normalizeChannel = sinon.stub()
      normalizeChannel.withArgs(channels[0]).returns(normalizedChannels[0])
      normalizeChannel.withArgs(channels[1]).returns(normalizedChannels[1])

      getChannels.__set__('normalizeChannel', normalizeChannel)
    })

    it('normalizes each channel', () => {
      normalizeChannels(channels)

      expect(normalizeChannel).to.have.been.calledTwice()
      expect(normalizeChannel).to.have.been.calledWith(channels[0])
      expect(normalizeChannel).to.have.been.calledWith(channels[1])
    })

    it('returns a map keyed by channel id', () => {
      const normalized = normalizeChannels(channels)

      expect(normalized).to.be.instanceOf(Map)
      expect(normalized.size).to.be.eql(2)
      expect(normalized.get(normalizedChannels[0].channelId)).to.be.equal(normalizedChannels[0])
      expect(normalized.get(normalizedChannels[1].channelId)).to.be.equal(normalizedChannels[1])
    })
  })

  describe('normalizeChannel', () => {
    const normalizeChannel = getChannels.__get__('normalizeChannel')

    it('normalizes an open channel', () => {
      const normalized = normalizeChannel({
        chanId: '1',
        active: true,
        remotePubkey: 'as89df9as8d7f',
        channelPoint: 'asdf89uas9fuasdfoij:0',
        capacity: '1000000'
      })

      expect(normalized).to.be.an('object')
      expect(normalized).to.have.property('channelId', '1')
      expect(normalized).to.have.property('active', true)
      expect(normalized).to.have.property('remoteAddress', 'bolt:as89df9as8d7f')
      expect(normalized).to.have.property('openTransaction', 'asdf89uas9fuasdfoij:0')
      expect(normalized).to.have.property('closeTransaction', undefined)
      expect(normalized).to.have.property('capacity', '1000000')
    })

    it('normalizes a closed channel', () => {
      const normalized = normalizeChannel({
        chanId: '1',
        remotePubkey: 'as89df9as8d7f',
        channelPoint: 'asdf89uas9fuasdfoij:0',
        closingTxHash: 'asdf8asf098098f',
        capacity: '1000000'
      })

      expect(normalized).to.be.an('object')
      expect(normalized).to.have.property('channelId', '1')
      expect(normalized).to.have.property('active', undefined)
      expect(normalized).to.have.property('remoteAddress', 'bolt:as89df9as8d7f')
      expect(normalized).to.have.property('openTransaction', 'asdf89uas9fuasdfoij:0')
      expect(normalized).to.have.property('closeTransaction', 'asdf8asf098098f')
      expect(normalized).to.have.property('capacity', '1000000')
    })
  })
})
