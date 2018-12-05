const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getPaymentPreimage = rewire(path.resolve(__dirname, 'get-payment-preimage'))

describe('get-payment-preimage', () => {
  let lookupPaymentStatusStub
  let listPaymentsStub
  let engine
  let client
  let logger
  let status
  let payments
  let paymentHash
  let preimage
  let reverts

  beforeEach(() => {
    reverts = []

    status = 'COMPLETE'
    lookupPaymentStatusStub = sinon.stub().resolves({ status })
    reverts.push(getPaymentPreimage.__set__('lookupPaymentStatus', lookupPaymentStatusStub))

    paymentHash = 'aGVsbG8gd29ybGQ='
    preimage = 'dGhlaW1hZ2ViZWZvcmV0aGVpbWFnZQ=='
    payments = [
      {
        paymentHash: '112983471902879087aefef',
        paymentPreimage: 'yeahright'
      },
      {
        paymentHash: Buffer.from(paymentHash, 'base64').toString('hex'),
        paymentPreimage: Buffer.from(preimage, 'base64').toString('hex')
      }
    ]
    listPaymentsStub = sinon.stub().resolves({ payments })
    reverts.push(getPaymentPreimage.__set__('listPayments', listPaymentsStub))

    client = {}
    logger = {
      debug: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      info: sinon.stub()
    }
    engine = {
      client,
      logger
    }
  })

  afterEach(() => {
    reverts.forEach(r => r())
  })

  describe('getPaymentPreimage', () => {
    let getCompletedPreimageStub
    let delayStub

    beforeEach(() => {
      getCompletedPreimageStub = sinon.stub().resolves(preimage)
      reverts.push(getPaymentPreimage.__set__('getCompletedPreimage', getCompletedPreimageStub))

      delayStub = sinon.stub().resolves()
      reverts.push(getPaymentPreimage.__set__('delay', delayStub))
    })

    it('gets the payment status', () => {
      getPaymentPreimage.call(engine, paymentHash)

      expect(lookupPaymentStatusStub).to.have.been.calledOnce()
      expect(lookupPaymentStatusStub).to.have.been.calledWith(paymentHash, { client })
    })

    it('throws if the payment is grounded', () => {
      status = 'GROUNDED'
      lookupPaymentStatusStub.resolves({ status })
      return expect(getPaymentPreimage.call(engine, paymentHash)).to.eventually.be.rejected()
    })

    it('returns the preimage if the payment is complete', async () => {
      lookupPaymentStatusStub.resolves({ status })

      expect(await getPaymentPreimage.call(engine, paymentHash)).to.be.eql(preimage)
      expect(getCompletedPreimageStub).to.have.been.calledOnce()
      expect(getCompletedPreimageStub).to.have.been.calledWith(paymentHash, { client, logger })
    })

    it('waits if the payment is in progress', async () => {
      lookupPaymentStatusStub.onCall(0).resolves({ status: 'IN_FLIGHT' })

      await getPaymentPreimage.call(engine, paymentHash)

      expect(delayStub).to.have.been.calledOnce()
      expect(delayStub).to.have.been.calledWith(10000)
    })

    it('returns the preimage after waiting', async () => {
      lookupPaymentStatusStub.onCall(0).resolves({ status: 'IN_FLIGHT' })

      expect(await getPaymentPreimage.call(engine, paymentHash)).to.be.eql(preimage)
      expect(getCompletedPreimageStub).to.have.been.calledAfter(delayStub)
    })
  })

  describe('getCompletedPreimage', () => {
    let getCompletedPreimage

    beforeEach(() => {
      getCompletedPreimage = getPaymentPreimage.__get__('getCompletedPreimage')
    })

    it('gets all payments from the client', async () => {
      await getCompletedPreimage(paymentHash, { client, logger })

      expect(listPaymentsStub).to.have.been.calledOnce()
      expect(listPaymentsStub).to.have.been.calledWith({ client })
    })

    it('throws if the payment is not in the list', () => {
      // remove the last payment in the list which contains our hash
      payments.pop()

      return expect(getCompletedPreimage(paymentHash, { client, logger })).to.eventually.be.rejected()
    })

    it('returns the preimage for the payment', async () => {
      expect(await getCompletedPreimage(paymentHash, { client, logger })).to.be.eql(preimage)
    })
  })
})
