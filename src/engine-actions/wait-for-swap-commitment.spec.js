const path = require('path')
const EventEmitter = require('events')
const { expect, rewire, sinon, timekeeper } = require('test/test-helper')
const { INVOICE_STATES } = require('../constants')
const waitForSwapCommitmentModule = rewire(path.resolve(__dirname, 'wait-for-swap-commitment'))
const {
  waitForSwapCommitment,
  SettledSwapError,
  CanceledSwapError,
  ExpiredSwapError
} = waitForSwapCommitmentModule

describe('wait-for-swap-commitment', () => {
  describe('waitForSwapCommitment', () => {
    const hash = '1234'
    const creationTimestamp = 1564789328
    const creationDate = new Date('2019-08-02T23:42:08.000Z')
    const shortExpirationDate = new Date('2019-08-02T23:42:19.000Z')
    const longExpirationDate = new Date('2019-08-02T23:42:27.950Z')
    const openInvoice = {
      state: INVOICE_STATES.OPEN,
      creationDate: creationTimestamp,
      expiry: 3600
    }
    const settledInvoice = {
      state: INVOICE_STATES.SETTLED
    }
    const canceledInvoice = {
      state: INVOICE_STATES.CANCELED
    }
    const acceptedInvoice = {
      state: INVOICE_STATES.ACCEPTED,
      creationDate: creationTimestamp
    }
    const expiredInvoice = {
      state: INVOICE_STATES.OPEN,
      creationDate: creationTimestamp,
      expiry: 10
    }
    const expiringInvoice = {
      state: INVOICE_STATES.OPEN,
      creationDate: creationTimestamp,
      expiry: 20
    }
    const stream = new EventEmitter()
    stream.cancel = sinon.stub().callsFake(() => stream.emit('end'))
    const subscribeStub = sinon.stub().returns(stream)
    const reverts = []

    beforeEach(() => {
      reverts.push(waitForSwapCommitmentModule.__set__('subscribeSingleInvoice', subscribeStub))
      timekeeper.travel(shortExpirationDate)
    })

    afterEach(() => {
      reverts.forEach(revert => revert())
      timekeeper.reset()
    })

    it('waits on open invoice and resolves on accepted invoice', async () => {
      setTimeout(() => stream.emit('data', openInvoice), 1)
      setTimeout(() => stream.emit('data', openInvoice), 2)
      setTimeout(() => stream.emit('data', acceptedInvoice), 3)
      expect(await waitForSwapCommitment(hash)).to.be.eql(creationDate)
    })

    it('rejects on an expired invoice', () => {
      setTimeout(() => stream.emit('data', expiredInvoice), 1)
      return expect(waitForSwapCommitment(hash))
        .to.eventually.be.rejectedWith(ExpiredSwapError)
    })

    it('rejects once an invoice expires', () => {
      timekeeper.travel(longExpirationDate)
      setTimeout(() => {
        stream.emit('data', expiringInvoice)
      }, 1)

      return expect(waitForSwapCommitment(hash))
        .to.eventually.be.rejectedWith(ExpiredSwapError)
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
