const path = require('path')
const { expect, rewire, sinon, delay } = require('test/test-helper')

const translateSwap = rewire(path.resolve(__dirname, 'translate-swap'))

describe('translate-swap', () => {
  describe('calculateTimeLock', () => {
    let extendedTimeLockDelta
    let secondsPerBlock
    let blockHeight
    let calculateTimeLock

    beforeEach(() => {
      calculateTimeLock = translateSwap.__get__('calculateTimeLock')
      extendedTimeLockDelta = '146400'
      secondsPerBlock = 600
      blockHeight = 100
    })

    it('removes the default forwarding policy from the time lock', () => {
      expect(calculateTimeLock(extendedTimeLockDelta, secondsPerBlock, blockHeight)).to.be.eql('200')
    })

    it('throws if there is not enough time lock for the forwarding policy', () => {
      extendedTimeLockDelta = '86300'

      return expect(() => calculateTimeLock(extendedTimeLockDelta, secondsPerBlock, blockHeight)).to.throw('Insufficient time lock')
    })

    it('can use different block times for different block chains', () => {
      secondsPerBlock = 150
      expect(calculateTimeLock(extendedTimeLockDelta, secondsPerBlock, blockHeight)).to.be.eql('500')
    })
  })

  describe('sendToRouteSync', () => {
    let sendToRouteStream
    let sendToRouteStub
    let sendToRouteSync
    let paymentHash
    let routes
    let client
    let logger

    function streamReturns (stream, response) {
      stream.on.withArgs('data').callsFake(async (evt, listener) => {
        await delay(5)
        listener(response)
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
      sendToRouteStream = {
        on: sinon.stub(),
        write: sinon.stub(),
        removeListener: sinon.stub(),
        cancel: sinon.stub()
      }
      sendToRouteStub = sinon.stub().returns(sendToRouteStream)
      translateSwap.__set__('sendToRoute', sendToRouteStub)

      sendToRouteSync = translateSwap.__get__('sendToRouteSync')

      client = 'fakeclient'
      logger = {
        info: sinon.stub(),
        error: sinon.stub(),
        debug: sinon.stub()
      }
      routes = []
      paymentHash = 'fakehash'
    })

    it('sets up a sendToRoute stream on the client', () => {
      sendToRouteSync(paymentHash, routes, { client, logger })

      expect(sendToRouteStub).to.have.been.calledOnce()
      expect(sendToRouteStub).to.have.been.calledWith(sinon.match({ client }))
    })

    it('writes a message to the stream', () => {
      sendToRouteSync(paymentHash, routes, { client, logger })

      expect(sendToRouteStream.write).to.have.been.calledOnce()
      expect(sendToRouteStream.write).to.have.been.calledWith(sinon.match({ paymentHash, routes }))
    })

    it('rejects on error while setting up the stream', () => {
      sendToRouteStub.throws(new Error('fake error'))

      return expect(sendToRouteSync(paymentHash, routes, { client, logger })).to.eventually.be.rejectedWith('fake error')
    })

    it('throws if the stream errors', () => {
      streamErrors(sendToRouteStream, new Error('fake error'))

      return expect(sendToRouteSync(paymentHash, routes, { client, logger })).to.eventually.be.rejectedWith('fake error')
    })

    it('throws if the stream closes early', () => {
      streamCloses(sendToRouteStream)

      return expect(sendToRouteSync(paymentHash, routes, { client, logger })).to.eventually.be.rejectedWith('closed stream')
    })

    it('returns the response from the subscription', async () => {
      streamReturns(sendToRouteStream, { paymentPreimage: 'fakePreimage', paymentError: null })

      const { paymentPreimage, paymentError } = await sendToRouteSync(paymentHash, routes, { client, logger })

      expect(paymentPreimage).to.be.eql('fakePreimage')
      expect(paymentError).to.be.null()
    })

    it('cancels the stream if we got what we wanted', async () => {
      streamReturns(sendToRouteStream, { paymentPreimage: 'fakePreimage', paymentError: null })

      await sendToRouteSync(paymentHash, routes, { client, logger })

      expect(sendToRouteStream.cancel).to.have.been.calledOnce()
    })

    it('cleans up without throwing if we initiated a cancel', async () => {
      streamReturns(sendToRouteStream, { paymentPreimage: 'fakePreimage' })
      const cancelledError = new Error('CANCELLED')
      cancelledError.code = 1
      streamErrors(sendToRouteStream, cancelledError)

      const { paymentPreimage } = await sendToRouteSync(paymentHash, routes, { client, logger })

      await delay(10)

      const dataListener = sendToRouteStream.on.withArgs('data').args[0][1]
      const endListener = sendToRouteStream.on.withArgs('end').args[0][1]
      const errorListener = sendToRouteStream.on.withArgs('error').args[0][1]

      expect(paymentPreimage).to.be.eql('fakePreimage')
      expect(sendToRouteStream.removeListener).to.have.been.calledThrice()
      expect(sendToRouteStream.removeListener).to.have.been.calledWith('data', dataListener)
      expect(sendToRouteStream.removeListener).to.have.been.calledWith('end', endListener)
      expect(sendToRouteStream.removeListener).to.have.been.calledWith('error', errorListener)
    })
  })

  describe('translateSwap', () => {
    let networkAddressFormatter
    let queryRoutes
    let sendToRouteSync
    let getInfo
    let client
    let engine
    let pubKey
    let address
    let swapHash
    let preimage
    let blockHeight
    let extendedTimeLock
    let amount
    let routes

    beforeEach(() => {
      address = 'fake address'
      pubKey = 'fake pubkey'
      swapHash = '9283479q8asfjsdfjoji=='
      preimage = 'as9fd8uas9df8ya98sfy=='
      amount = '100000'
      extendedTimeLock = '146400'
      blockHeight = 100

      routes = [
        { totalTimeLock: 150 },
        { totalTimeLock: 200 },
        { totalTimeLock: 201 }
      ]

      networkAddressFormatter = {
        parse: sinon.stub().withArgs(address).returns({ publicKey: pubKey })
      }
      queryRoutes = sinon.stub().resolves({ routes })
      sendToRouteSync = sinon.stub().resolves({ paymentPreimage: preimage })
      getInfo = sinon.stub().resolves({ blockHeight })

      translateSwap.__set__('networkAddressFormatter', networkAddressFormatter)
      translateSwap.__set__('queryRoutes', queryRoutes)
      translateSwap.__set__('sendToRouteSync', sendToRouteSync)
      translateSwap.__set__('getInfo', getInfo)

      client = 'fakeclient'
      engine = {
        client,
        currencyConfig: {
          secondsPerBlock: 600
        },
        logger: {
          info: sinon.stub(),
          error: sinon.stub(),
          debug: sinon.stub()
        }
      }
    })

    it('finds routes to the taker for the given amount', async () => {
      await translateSwap.call(engine, address, swapHash, amount, extendedTimeLock)

      const finalCltvDelta = translateSwap.__get__('DEFAULT_MAKER_FWD_DELTA') / engine.currencyConfig.secondsPerBlock
      const numRoutes = translateSwap.__get__('NUM_OF_ROUTES')

      expect(networkAddressFormatter.parse).to.have.been.calledOnce()
      expect(networkAddressFormatter.parse).to.have.been.calledWith(address)
      expect(queryRoutes).to.have.been.calledOnce()
      expect(queryRoutes).to.have.been.calledWith({ pubKey, amt: amount, finalCltvDelta, numRoutes }, { client })
    })

    it('returns permanent error if no routes are available', async () => {
      // remove all routes
      routes.splice(0, 3)
      const res = await translateSwap.call(engine, address, swapHash, amount, extendedTimeLock)
      expect(res).to.have.property('permanentError')
      expect(res.permanentError).to.contain('No route')
    })

    it('returns permanent error if a call to queryRoutes fails', async () => {
      const error = 'TARGET NOT FOUND'
      queryRoutes.rejects(new Error(error))
      const res = await translateSwap.call(engine, address, swapHash, amount, extendedTimeLock)
      expect(res).to.have.property('permanentError')
      expect(res.permanentError).to.contain(error)
    })

    it('returns permanent error if the extended time lock is insufficient', async () => {
      extendedTimeLock = '76400'

      const res = await translateSwap.call(engine, address, swapHash, amount, extendedTimeLock)
      expect(res).to.have.property('permanentError')
      expect(res.permanentError).to.contain('Insufficient time lock')
    })

    it('sends to routes that are below the maximum time lock', async () => {
      await translateSwap.call(engine, address, swapHash, amount, extendedTimeLock)

      expect(sendToRouteSync).to.have.been.calledOnce()
      expect(sendToRouteSync).to.have.been.calledWith(swapHash, routes.slice(0, 2), { client, logger: engine.logger })
    })

    it('returns permanent error if there are no routes below the maximum time lock', async () => {
      // remove the fast routes
      routes.splice(0, 2)
      const res = await translateSwap.call(engine, address, swapHash, amount, extendedTimeLock)
      expect(res).to.have.property('permanentError')
      expect(res.permanentError).to.contain('No route')
    })

    it('returns permanent error if there is a payment error', async () => {
      sendToRouteSync.resolves({ paymentError: 'fake error' })
      expect(await translateSwap.call(engine, address, swapHash, amount, extendedTimeLock)).to.be.eql({ permanentError: 'fake error' })
    })

    it('returns the payment preiamge', async () => {
      expect(await translateSwap.call(engine, address, swapHash, amount, extendedTimeLock)).to.be.eql({ paymentPreimage: preimage })
    })
  })
})
