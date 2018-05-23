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

  describe('status', () => {
    let rHash
    let clientStub
    let lookupInvoice
    let logger
    let status

    beforeEach(() => {
      rHash = '1234123u8489'
      lookupInvoice = sinon.stub()
      logger = {
        debug: sinon.stub()
      }
      clientStub = {
        lookupInvoice: lookupInvoice
      }
      invoices.__set__('client', clientStub)
      invoices.__set__('logger', logger)

      status = invoices.status
    })

    it('makes a call to lookupInvoice', () => {
      status(rHash)
      expect(lookupInvoice).to.have.been.calledOnce()
      expect(lookupInvoice).to.have.been.calledWith({ rHash })
    })

    it('returns a response if successful', async () => {
      lookupInvoice.yields(null, {})
      const res = await status(rHash)
      expect(res).to.eql({})
    })

    it('rejects if lnd throws an error', () => {
      lookupInvoice.yields(new Error('Bad'))
      return expect(status(rHash)).to.be.rejectedWith(Error)
    })
  })

  describe('listInvoices', () => {
    let pendingOnly
    let clientStub
    let listInvoicesStub
    let logger
    let listInvoices

    beforeEach(() => {
      pendingOnly = true
      listInvoicesStub = sinon.stub()
      logger = {
        debug: sinon.stub()
      }
      clientStub = {
        listInvoices: listInvoicesStub
      }
      invoices.__set__('client', clientStub)
      invoices.__set__('logger', logger)

      listInvoices = invoices.__get__('listInvoices')
    })

    it('makes a call to listInvoices', () => {
      listInvoices(pendingOnly)
      expect(listInvoicesStub).to.have.been.calledOnce()
      expect(listInvoicesStub).to.have.been.calledWith({ pendingOnly })
    })

    it('returns a response if successful', async () => {
      listInvoicesStub.yields(null, {})
      const res = await listInvoices(pendingOnly)
      expect(res).to.eql({})
    })

    it('rejects if lnd throws an error', () => {
      listInvoicesStub.yields(new Error('Bad'))
      return expect(listInvoices(pendingOnly)).to.be.rejectedWith(Error)
    })
  })

  describe('all', () => {
    let listInvoicesStub
    let revert
    let all

    beforeEach(() => {
      listInvoicesStub = sinon.stub()
      revert = invoices.__set__('listInvoices', listInvoicesStub)
      all = invoices.all
    })

    afterEach(() => {
      revert()
    })

    it('calls listInvoices with a false argument', () => {
      all()
      expect(listInvoicesStub).to.have.been.calledWith(false)
    })
  })

  describe('pending', () => {
    let listInvoicesStub
    let revert
    let pending

    beforeEach(() => {
      listInvoicesStub = sinon.stub()
      revert = invoices.__set__('listInvoices', listInvoicesStub)
      pending = invoices.pending
    })

    afterEach(() => {
      revert()
    })

    it('calls listInvoices with a true argument', () => {
      pending()
      expect(listInvoicesStub).to.have.been.calledWith(true)
    })
  })
})
