const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const isPaymentPendingOrComplete = rewire(path.resolve(__dirname, 'is-payment-pending-or-complete'))

describe('isPaymentPendingOrComplete', () => {
  let lookupPaymentStatusStub
  let engine
  let client
  let status
  let paymentHash
  let reverts

  beforeEach(() => {
    status = 'GROUNDED'
    lookupPaymentStatusStub = sinon.stub().resolves({ status })
    client = {}
    engine = { client }
    paymentHash = 'asd9f8uas9df8uoihnfpqiuwnefknasdkfjasdklf'

    reverts = []
    reverts.push(isPaymentPendingOrComplete.__set__('lookupPaymentStatus', lookupPaymentStatusStub))
  })

  afterEach(() => {
    reverts.forEach(r => r())
  })

  it('retrieves the status of a payment from the node', async () => {
    await isPaymentPendingOrComplete.call(engine, paymentHash)

    expect(lookupPaymentStatusStub).to.have.been.calledOnce()
    expect(lookupPaymentStatusStub).to.have.been.calledWith(paymentHash, { client })
  })

  it('returns false for grounded payments', async () => {
    expect(await isPaymentPendingOrComplete.call(engine, paymentHash)).to.be.false()
  })

  it('returns true for in progress payments', async () => {
    status = 'IN_FLIGHT'
    lookupPaymentStatusStub.resolves({ status })
    expect(await isPaymentPendingOrComplete.call(engine, paymentHash)).to.be.true()
  })

  it('returns true for completed payments', async () => {
    status = 'COMPLETED'
    lookupPaymentStatusStub.resolves({ status })
    expect(await isPaymentPendingOrComplete.call(engine, paymentHash)).to.be.true()
  })

  it('throws an error if a payment is in an unknown status', () => {
    status = 'BLARG'
    lookupPaymentStatusStub.resolves({ status })
    expect(isPaymentPendingOrComplete.call(engine, paymentHash)).to.eventually.be.rejected()
  })
})
