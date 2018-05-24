const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const invoices = rewire(path.resolve(__dirname, 'invoices'))

describe('invoices', () => {
  describe('create', () => {
    let memo
    let expiry
    let value
    let rHash
    let clientStub
    let addInvoiceStub
    let logger
    let create

    beforeEach(() => {
      memo = 'my memo'
      expiry = 1000
      value = 100
      rHash = '1234123u8489'
      addInvoiceStub = sinon.stub()
      logger = {
        debug: sinon.stub()
      }
      clientStub = {
        addInvoice: addInvoiceStub
      }
      invoices.__set__('client', clientStub)
      invoices.__set__('logger', logger)

      create = invoices.create
    })

    it('makes a call to addInvoice', () => {
      create(memo, expiry, value)
      expect(addInvoiceStub).to.have.been.calledOnce()
      expect(addInvoiceStub).to.have.been.calledWith(sinon.match({ memo, expiry, value }))
    })

    it('returns a response if successful', async () => {
      addInvoiceStub.yields(null, { rHash })
      const res = await create(memo, expiry, value)
      expect(res).to.eql(rHash)
    })

    it('rejects if lnd throws an error', () => {
      addInvoiceStub.yields(new Error('Bad'))
      return expect(create(memo, expiry, value)).to.be.rejectedWith(Error)
    })
  })
})
