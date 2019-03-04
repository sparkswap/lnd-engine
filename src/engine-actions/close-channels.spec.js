const path = require('path')
const { expect, rewire, sinon, delay } = require('test/test-helper')

const closeChannels = rewire(path.resolve(__dirname, 'close-channels'))

describe('close-channels', () => {
  describe('closeChannels', () => {
    const reverts = []

    let activeChannel
    let openChannels
    let listChannelsStub
    let listPendingChannelsStub
    let logger
    let closeStub
    let engine

    beforeEach(() => {
      activeChannel = { active: true, channelPoint: 'asdf:1234' }
      openChannels = [activeChannel]
      listChannelsStub = sinon.stub().resolves({ channels: openChannels })
      listPendingChannelsStub = sinon.stub().resolves()
      closeStub = sinon.stub()
      logger = {
        debug: sinon.stub(),
        info: sinon.stub()
      }
      engine = {
        client: sinon.stub(),
        logger
      }

      reverts.push(closeChannels.__set__('listChannels', listChannelsStub))
      reverts.push(closeChannels.__set__('listPendingChannels', listPendingChannelsStub))
      reverts.push(closeChannels.__set__('close', closeStub))
    })

    afterEach(() => {
      reverts.forEach(r => r())
    })

    it('grabs all active and inactive channels', async () => {
      await closeChannels.call(engine)
      expect(listChannelsStub).to.have.been.calledWith({ client: engine.client })
    })

    it('grabs all pending channels', async () => {
      await closeChannels.call(engine)
      expect(listPendingChannelsStub).to.have.been.calledWith({ client: engine.client })
    })

    it('returns an empty array if no channels exist', async () => {
      listChannelsStub.resolves({})
      listPendingChannelsStub.resolves({})
      await closeChannels.call(engine)
      expect(logger.debug).to.have.been.calledWith(sinon.match('No channels exist'))
    })

    it('closes active channels', async () => {
      await closeChannels.call(engine)
      expect(closeStub).to.have.been.calledWith(activeChannel, false, engine.client, engine.logger)
    })

    context('force is set to false', () => {
      it('errors if there are inactive channels', () => {
        const inactiveChannel = { active: false, channelPoint: 'lol' }
        openChannels = [activeChannel, inactiveChannel]
        listChannelsStub.resolves({ channels: openChannels })
        return expect(closeChannels.call(engine)).to.eventually.be.rejectedWith('Inactive/pending channels exist')
      })

      it('errors if there are pending channels', () => {
        const pendingChannel = { channel: { channelPoint: 'lol' } }
        listPendingChannelsStub.resolves({ pendingOpenChannels: [pendingChannel] })
        return expect(closeChannels.call(engine)).to.eventually.be.rejectedWith('Inactive/pending channels exist')
      })
    })

    context('force closing channels', () => {
      const force = true

      let inactiveChannel
      let pendingChannel
      let pendingOpenChannels

      beforeEach(async () => {
        inactiveChannel = { active: false, channelPoint: 'lol' }
        pendingChannel = { channel: { channelPoint: 'lol' } }
        openChannels = [activeChannel, inactiveChannel]
        pendingOpenChannels = [pendingChannel]

        listPendingChannelsStub.resolves({ pendingOpenChannels })
        listChannelsStub.resolves({ channels: openChannels })

        await closeChannels.call(engine, { force })
      })

      it('includes inactive channels', () => {
        expect(closeStub).to.have.been.calledWith(inactiveChannel, force, sinon.match.any, sinon.match.any)
      })

      it('includes pending open channels', () => {
        expect(closeStub).to.have.been.calledWith(pendingChannel.channel, force, sinon.match.any, sinon.match.any)
      })

      it('force closes channels', () => {
        expect(closeStub).to.have.been.calledWith(sinon.match.any, force, sinon.match.any, sinon.match.any)
      })
    })
  })

  describe('close', () => {
    const close = closeChannels.__get__('close')

    let clientStub
    let closeChannelStub
    let logger
    let closeChannelStream
    let channel
    let force

    function streamReturnsClosedChannel (stream, channelInfo, sequence = 0) {
      stream.on
        .withArgs('data')
        .onCall(sequence)
        .callsFake(async (evt, listener) => {
          await delay(10)
          listener(channelInfo)
        })
    }

    function streamErrors (stream, error) {
      stream.on.withArgs('error').callsFake(async (evt, listener) => {
        await delay(10)
        listener(error)
      })
    }

    function streamCloses (stream) {
      stream.on.withArgs('end').callsFake(async (evt, listener) => {
        await delay(10)
        listener()
      })
    }

    beforeEach(() => {
      force = false
      closeChannelStream = {
        on: sinon.stub(),
        removeListener: sinon.stub()
      }
      channel = { active: true, channelPoint: 'asdf:1234' }
      closeChannelStub = sinon.stub().returns(closeChannelStream)
      clientStub = sinon.stub()
      logger = {
        debug: sinon.stub(),
        error: sinon.stub(),
        info: sinon.stub()
      }
      closeChannels.__set__('closeChannel', closeChannelStub)
      closeChannels.__set__('logger', logger)
    })

    it('closes channels on the engine', async () => {
      streamReturnsClosedChannel(closeChannelStream, [ channel ])
      await close(channel, force, clientStub, logger)

      expect(closeChannelStub).to.have.been.calledOnce()
      expect(closeChannelStub).to.have.been.calledWith({ fundingTxidStr: 'asdf', outputIndex: 1234 }, false, { client: clientStub })
    })

    it('throws if the stream errors', () => {
      streamErrors(closeChannelStream, new Error('Error from closeChannel stream'))

      return expect(close(channel, force, clientStub, logger)).to.eventually.be.rejectedWith('Error from closeChannel stream')
    })

    it('throws if the stream closes early', () => {
      streamCloses(closeChannelStream)

      return expect(close(channel, force, clientStub, logger)).to.eventually.be.rejectedWith('LND closed closeChannel stream before returning our value')
    })

    it('removes listeners', async () => {
      streamReturnsClosedChannel(closeChannelStream, channel)

      await close(channel, force, clientStub, logger)

      const dataListener = closeChannelStream.on.withArgs('data').args[0][1]
      const endListener = closeChannelStream.on.withArgs('end').args[0][1]
      const errorListener = closeChannelStream.on.withArgs('error').args[0][1]

      expect(closeChannelStream.removeListener).to.have.been.calledThrice()
      expect(closeChannelStream.removeListener).to.have.been.calledWith('data', dataListener)
      expect(closeChannelStream.removeListener).to.have.been.calledWith('end', endListener)
      expect(closeChannelStream.removeListener).to.have.been.calledWith('error', errorListener)
    })

    context('force closing channels', () => {
      it('closes channels on the engine', async () => {
        streamReturnsClosedChannel(closeChannelStream, [ channel ])
        force = true
        await close(channel, force, clientStub, logger)

        expect(closeChannelStub).to.have.been.calledOnce()
        expect(closeChannelStub).to.have.been.calledWith({ fundingTxidStr: 'asdf', outputIndex: 1234 }, true, { client: clientStub })
      })
    })
  })
})
