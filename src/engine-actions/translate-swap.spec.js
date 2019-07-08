const path = require('path')
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

    beforeEach(() => {
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

      translateSwapModule.__set__('networkAddressFormatter', networkAddressFormatter)
      translateSwapModule.__set__('sendPayment', sendPayment)

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
          feeLimit: '0'
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
          feeLimit: '0'
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
