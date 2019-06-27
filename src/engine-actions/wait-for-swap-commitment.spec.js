const path = require('path')
const EventEmitter = require('events')
const { expect, rewire, sinon } = require('test/test-helper')
const { INVOICE_STATES } = require('../constants')
const waitForSwapCommitmentModule = rewire(path.resolve(__dirname, 'wait-for-swap-commitment'))
const { waitForSwapCommitment, SettledSwapError, CanceledSwapError } =
  waitForSwapCommitmentModule

describe('wait-for-swap-commitment', () => {
  describe('waitForSwapCommitment', () => {
    const hash = '1234'
    const openInvoice = { state: INVOICE_STATES.OPEN }
    const settledInvoice = { state: INVOICE_STATES.SETTLED }
    const canceledInvoice = { state: INVOICE_STATES.CANCELED }
    const acceptedInvoice = { state: INVOICE_STATES.ACCEPTED }
    const stream = new EventEmitter()
    const subscribeStub = sinon.stub().returns(stream)
    waitForSwapCommitmentModule.__set__('subscribeSingleInvoice', subscribeStub)

    it('waits on open invoice and resolves on accepted invoice', async () => {
      setTimeout(() => stream.emit('data', openInvoice), 1)
      setTimeout(() => stream.emit('data', openInvoice), 2)
      setTimeout(() => stream.emit('data', acceptedInvoice), 3)
      expect(await waitForSwapCommitment(hash)).to.be.eql(acceptedInvoice)
    })

    it('rejects on stream end', () => {
      setTimeout(() => stream.emit('end'), 1)
      return expect(waitForSwapCommitment(hash))
        .to.eventually.be.rejectedWith(Error)
    })

    it('rejects on canceled invoice', () => {
      setTimeout(() => stream.emit('data', canceledInvoice), 1)
      return expect(waitForSwapCommitment(hash))
        .to.eventually.be.rejectedWith(CanceledSwapError)
    })

    it('rejects on settled invoice', () => {
      setTimeout(() => stream.emit('data', settledInvoice), 1)
      return expect(waitForSwapCommitment(hash))
        .to.eventually.be.rejectedWith(SettledSwapError)
    })
  })
})
