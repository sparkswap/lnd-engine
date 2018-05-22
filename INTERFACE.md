Listed below are the required routes needed for a Kinesis engine:

isOK() - returns true if the client can hit the instance of Lightning Network
addInvoice
addInvoicePair
invoiceStatus
uncommittedBalance()
committedBalance()
totalBalance()
newaddress

const engine = new LndEngine()

engine.invoices.add()
engine.invoices.addPair()
engine.invoices.status
engine.invoices.status(invoice)
engine.balance.all()
engine.balance.uncommitted()
engine.balance.total()
engine.balance.committed()
