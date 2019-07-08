const path = require('path')
const EventEmitter = require('events')
const {
  expect,
  rewire,
  sinon,
  timekeeper
} = require('test/test-helper')

const translateSwapModule = rewire(path.resolve(__dirname, 'translate-swap'))
const {
  translateSwap,
  PermanentSwapError
} = translateSwapModule

describe('translate-swap', () => {
  describe('translateSwap', () => {
    let reverts
    let networkAddressFormatter
    let sendPayment
    let client
    let engine
    let pubKey
    let address
    let swapHash
    let preimage
    let maxTime
    let amount
    let getPreimageIfPaymentExists

    beforeEach(() => {
      reverts = []
      address = 'fake address'
      pubKey = 'fake pubkey'
      swapHash = '9283479q8asfjsdfjoji=='
      preimage = 'as9fd8uas9df8ya98sfy=='
      amount = '100000'
      timekeeper.freeze(new Date('2019-06-25T00:58:25.638Z'))
      maxTime = new Date('2019-06-27T00:58:26.638Z')

      networkAddressFormatter = {
        parse: sinon.stub().withArgs(address).returns({ publicKey: pubKey })
      }

      sendPayment = sinon.stub().resolves({ paymentPreimage: preimage })

      getPreimageIfPaymentExists = sinon.stub().resolves(preimage)

      reverts.push(translateSwapModule.__set__('networkAddressFormatter', networkAddressFormatter))
      reverts.push(translateSwapModule.__set__('sendPayment', sendPayment))
      reverts.push(translateSwapModule.__set__('getPreimageIfPaymentExists', getPreimageIfPaymentExists))

      client = 'fakeclient'
      engine = {
        client,
        secondsPerBlock: 600,
        logger: {
          info: sinon.stub(),
          error: sinon.stub(),
          debug: sinon.stub()
        }
      }
    })

    afterEach(() => {
      timekeeper.reset()
      reverts.forEach(revert => revert())
    })

    context('existing payment', () => {
      it('gets the preimage if it exists', async () => {
        const result = await translateSwap.call(engine, address, swapHash, amount, maxTime)

        expect(getPreimageIfPaymentExists).to.have.been.calledOnce()
        expect(getPreimageIfPaymentExists).to.have.been.calledWith(swapHash, { client: engine.client, logger: engine.logger })
        expect(result).to.be.eql(preimage)
      })
    })

    context('no existing payment', () => {
      beforeEach(() => {
        const error = new Error()
        error.code = 5 // gRPC NOT FOUND status code
        getPreimageIfPaymentExists.rejects(error)
      })

      it('throws an error for any error other than NOT FOUND', () => {
        getPreimageIfPaymentExists.rejects()

        return expect(translateSwap.call(engine, address, swapHash, amount, maxTime)).to.eventually.be.rejectedWith(Error)
      })

      it('throws a permanent error if the maxTime is in the past', () => {
        timekeeper.travel(new Date('2019-07-04T00:58:25.638Z'))
        maxTime = new Date('2019-07-01T00:58:26.638Z')

        return expect(translateSwap.call(engine, address, swapHash, amount, maxTime))
          .to.eventually.be.rejectedWith(PermanentSwapError)
      })

      it('throws a permanent error if the final hop is longer than total timelock', () => {
        timekeeper.travel(new Date('2019-07-04T00:58:25.638Z'))
        maxTime = new Date('2019-07-04T05:58:26.638Z')
        const finalCltvDeltaSecs = 600 * 40

        return expect(translateSwap.call(engine, address, swapHash, amount, maxTime, finalCltvDeltaSecs))
          .to.eventually.be.rejectedWith('Timelock for total swap is shorter than final hop of payment')
      })

      it('sends a payment using the maximum time lock', async () => {
        await translateSwap.call(engine, address, swapHash, amount, maxTime)

        expect(sendPayment).to.have.been.calledOnce()
        expect(sendPayment).to.have.been.calledWith(
          {
            paymentHash: swapHash,
            destString: pubKey,
            amt: amount,
            finalCltvDelta: 144,
            cltvLimit: 288,
            feeLimit: 0
          },
          { client })
      })

      it('sends a payment using a custom final delta', async () => {
        await translateSwap.call(engine, address, swapHash, amount, maxTime, '85000')

        expect(sendPayment).to.have.been.calledOnce()
        expect(sendPayment).to.have.been.calledWith(
          {
            paymentHash: swapHash,
            destString: pubKey,
            amt: amount,
            finalCltvDelta: 142,
            cltvLimit: 288,
            feeLimit: 0
          },
          { client })
      })

      it('throws a permanent error if there is a payment error', () => {
        sendPayment.resolves({ paymentError: 'fake error' })
        expect(translateSwap.call(engine, address, swapHash, amount, maxTime)).to.eventually.be.rejectedWith(PermanentSwapError)
      })

      it('returns the payment preiamge', async () => {
        expect(await translateSwap.call(engine, address, swapHash, amount, maxTime)).to.be.eql(preimage)
      })
    })
  })

  describe('getPreimageIfPaymentExists', () => {
    let reverts
    let getPreimageIfPaymentExists
    let trackPaymentStub
    let stream
    let paymentHash
    let client
    let logger

    beforeEach(() => {
      reverts = []
      getPreimageIfPaymentExists = translateSwapModule.__get__('getPreimageIfPaymentExists')
      paymentHash = 'a-hash'

      client = sinon.stub()
      logger = {
        debug: sinon.stub(),
        error: sinon.stub()
      }

      stream = new EventEmitter()
      trackPaymentStub = sinon.stub().returns(stream)
      reverts.push(translateSwapModule.__set__('trackPayment', trackPaymentStub))
    })

    it('throws if the paymentHash is not defined', () => {
      paymentHash = null
      expect(getPreimageIfPaymentExists(paymentHash, { client, logger })).to.eventually.be.rejectedWith('paymentHash must be defined')
    })

    it('tracks a payment', async () => {
      const stateThatResolves = {
        state: 'SUCCEEDED',
        preimage: 'a-preimage'
      }
      setTimeout(() => stream.emit('data', stateThatResolves), 1)

      await getPreimageIfPaymentExists(paymentHash, { client, logger })
      expect(trackPaymentStub).to.have.been.calledOnce()
      expect(trackPaymentStub).to.have.been.calledWith(paymentHash, { client })
    })

    it('rejects if trackPayment returns gRPC NOT FOUND', () => {
      const error = new Error()
      error.code = 5 // gRPC NOT FOUND
      setTimeout(() => stream.emit('error', error))

      return expect(getPreimageIfPaymentExists(paymentHash, { client, logger }))
        .to.eventually.be.rejectedWith(error)
    })

    context('payment exists', () => {
      let inFlightPayment
      let succeededPayment
      let succeededWithoutPreimage
      let failedTimeoutPayment
      let failedNoRoutePayment
      let unknownPaymentState

      beforeEach(() => {
        inFlightPayment = {
          state: 'IN_FLIGHT'
        }

        succeededPayment = {
          state: 'SUCCEEDED',
          preimage: 'a-preimage'
        }

        succeededWithoutPreimage = {
          state: 'SUCCEEDED'
        }

        failedTimeoutPayment = {
          state: 'FAILED_TIMEOUT'
        }

        failedNoRoutePayment = {
          state: 'FAILED_NO_ROUTE'
        }

        unknownPaymentState = {
          state: 'unknown'
        }
      })

      it('waits if the payment is in-flight', async () => {
        setTimeout(() => stream.emit('data', inFlightPayment), 1)
        setTimeout(() => stream.emit('data', succeededPayment), 2)

        const preimage = await getPreimageIfPaymentExists(paymentHash, { client, logger })
        expect(preimage).to.be.eql(succeededPayment.preimage)
      })

      it('rejects if payment is `succeeded` without a preimage', () => {
        setTimeout(() => stream.emit('data', succeededWithoutPreimage), 1)
        return expect(getPreimageIfPaymentExists(paymentHash, { client, logger }))
          .to.eventually.be.rejectedWith('No preimage associated with successful payment')
      })

      it('resolves with the preimage if the payment succeeded', async () => {
        setTimeout(() => stream.emit('data', succeededPayment), 1)
        const preimage = await getPreimageIfPaymentExists(paymentHash, { client, logger })

        expect(preimage).to.be.eql(succeededPayment.preimage)
      })

      it('rejects if payment failed from a timeout', () => {
        setTimeout(() => stream.emit('data', failedTimeoutPayment), 1)

        return expect(getPreimageIfPaymentExists(paymentHash, { client, logger }))
          .to.eventually.be.rejectedWith(`Payment failed for paymentHash: ${paymentHash}`)
      })

      it('rejects if payment failed with no route', () => {
        setTimeout(() => stream.emit('data', failedNoRoutePayment), 1)

        return expect(getPreimageIfPaymentExists(paymentHash, { client, logger }))
          .to.eventually.be.rejectedWith(`Payment failed for paymentHash: ${paymentHash}`)
      })

      it('rejects if the payment is in an unknown state', () => {
        setTimeout(() => stream.emit('data', unknownPaymentState), 1)

        return expect(getPreimageIfPaymentExists(paymentHash, { client, logger }))
          .to.eventually.be.rejectedWith('Unknown payment status')
      })

      it('rejects with an error if stream errors', () => {
        const error = new Error()
        setTimeout(() => stream.emit('error', error), 1)

        return expect(getPreimageIfPaymentExists(paymentHash, { client, logger }))
          .to.eventually.be.rejectedWith(error)
      })

      it('rejects with an error if stream closes early', () => {
        setTimeout(() => stream.emit('end'), 1)

        return expect(getPreimageIfPaymentExists(paymentHash, { client, logger }))
          .to.eventually.be.rejectedWith('LND closed stream to track payment')
      })

      describe('removes listeners', () => {
        function getAllListernersCount () {
          const errorListernerCount = stream.listenerCount('error')
          const endListenerCount = stream.listenerCount('end')
          const dataListenerCount = stream.listenerCount('data')

          return [errorListernerCount, endListenerCount, dataListenerCount]
            .reduce((a, b) => a + b, 0)
        }

        it('removes on success', async () => {
          setTimeout(() => stream.emit('data', succeededPayment), 1)
          await getPreimageIfPaymentExists(paymentHash, { client, logger })

          const listenerCount = getAllListernersCount()
          expect(listenerCount).to.be.eql(0)
        })

        it('removes if success state without preimage', async () => {
          setTimeout(() => stream.emit('data', succeededWithoutPreimage), 1)
          try {
            await getPreimageIfPaymentExists(paymentHash, { client, logger })
          } catch (e) {
            const listenerCount = getAllListernersCount()
            expect(listenerCount).to.be.eql(0)
          }
        })

        it('removes if payment failed from a timeout', async () => {
          setTimeout(() => stream.emit('data', failedTimeoutPayment), 1)
          try {
            await getPreimageIfPaymentExists(paymentHash, { client, logger })
          } catch (e) {
            const listenerCount = getAllListernersCount()
            expect(listenerCount).to.be.eql(0)
          }
        })

        it('removes if payment failed with no route', async () => {
          setTimeout(() => stream.emit('data', failedNoRoutePayment), 1)
          try {
            await getPreimageIfPaymentExists(paymentHash, { client, logger })
          } catch (e) {
            const listenerCount = getAllListernersCount()
            expect(listenerCount).to.be.eql(0)
          }
        })

        it('removes if payment is in an unknown state', async () => {
          setTimeout(() => stream.emit('data', unknownPaymentState), 1)
          try {
            await getPreimageIfPaymentExists(paymentHash, { client, logger })
          } catch (e) {
            const listenerCount = getAllListernersCount()
            expect(listenerCount).to.be.eql(0)
          }
        })

        it('removes if stream errors', async () => {
          setTimeout(() => stream.emit('error', new Error()), 1)
          try {
            await getPreimageIfPaymentExists(paymentHash, { client, logger })
          } catch (e) {
            const listenerCount = getAllListernersCount()
            expect(listenerCount).to.be.eql(0)
          }
        })

        it('removes if stream ends', async () => {
          setTimeout(() => stream.emit('end'), 1)
          try {
            await getPreimageIfPaymentExists(paymentHash, { client, logger })
          } catch (e) {
            const listenerCount = getAllListernersCount()
            expect(listenerCount).to.be.eql(0)
          }
        })
      })
    })
  })

  describe('integration tests', () => {
    let reverts
    let engine
    let address
    let swapHash
    let amount
    let maxTime
    let client
    let stream
    let trackPaymentStub
    let succeededPayment
    let failedTimeoutPayment
    let failedNoRoutePayment
    let unknownPaymentState
    let sendPaymentStub
    let preimage
    let networkAddressFormatter
    let pubKey

    beforeEach(() => {
      reverts = []
      address = 'fake address'
      pubKey = 'fake pubkey'
      swapHash = '9283479q8asfjsdfjoji=='
      preimage = 'as9fd8uas9df8ya98sfy=='
      amount = '100000'
      timekeeper.freeze(new Date('2019-06-25T00:58:25.638Z'))
      maxTime = new Date('2019-06-27T00:58:26.638Z')

      client = 'fakeclient'
      engine = {
        client,
        secondsPerBlock: 600,
        logger: {
          info: sinon.stub(),
          error: sinon.stub(),
          debug: sinon.stub()
        }
      }

      succeededPayment = {
        state: 'SUCCEEDED',
        preimage: 'a-preimage'
      }

      failedTimeoutPayment = {
        state: 'FAILED_TIMEOUT'
      }

      failedNoRoutePayment = {
        state: 'FAILED_NO_ROUTE'
      }

      unknownPaymentState = {
        state: 'unknown'
      }

      networkAddressFormatter = {
        parse: sinon.stub().withArgs(address).returns({ publicKey: pubKey })
      }

      sendPaymentStub = sinon.stub().resolves({ paymentPreimage: preimage })

      stream = new EventEmitter()
      trackPaymentStub = sinon.stub().returns(stream)

      reverts.push(translateSwapModule.__set__('networkAddressFormatter', networkAddressFormatter))
      reverts.push(translateSwapModule.__set__('trackPayment', trackPaymentStub))
      reverts.push(translateSwapModule.__set__('sendPayment', sendPaymentStub))
    })

    afterEach(() => {
      reverts.forEach(revert => revert())
    })

    it('returns the preimage if the payment exists', async () => {
      setTimeout(() => stream.emit('data', succeededPayment), 1)
      const result = await translateSwap.call(engine, address, swapHash, amount, maxTime)

      expect(result).to.be.eql(succeededPayment.preimage)
    })

    it('throws a permanent error if the payment exists and failed from timeout', () => {
      setTimeout(() => stream.emit('data', failedTimeoutPayment), 1)

      return expect(translateSwap.call(engine, address, swapHash, amount, maxTime))
        .to.eventually.be.rejectedWith(`Payment failed for paymentHash`)
    })

    it('throws a permanent error if the payment exists and failed from no route', () => {
      setTimeout(() => stream.emit('data', failedNoRoutePayment), 1)

      return expect(translateSwap.call(engine, address, swapHash, amount, maxTime))
        .to.eventually.be.rejectedWith(`Payment failed for paymentHash`)
    })

    it('throws an error for unknown states', () => {
      setTimeout(() => stream.emit('data', unknownPaymentState), 1)

      return expect(translateSwap.call(engine, address, swapHash, amount, maxTime))
        .to.eventually.be.rejectedWith('Unknown payment status')
    })

    it('calls sendPayment for gRPC NOT FOUND errors', async () => {
      const error = new Error()
      error.code = 5 // gRPC NOT FOUND
      setTimeout(() => stream.emit('error', error), 1)

      await translateSwap.call(engine, address, swapHash, amount, maxTime)
      expect(sendPaymentStub).to.have.been.calledOnce()
      expect(sendPaymentStub).to.have.been.calledWith(
        {
          paymentHash: swapHash,
          destString: pubKey,
          amt: amount,
          finalCltvDelta: 144,
          cltvLimit: 288,
          feeLimit: 0
        },
        { client })
    })
  })
})
