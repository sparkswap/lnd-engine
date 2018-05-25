// describe('total', () => {
//   let total
//   let walletBalanceStub
//   let totalBalance

//   beforeEach(() => {
//     totalBalance = '100'
//     walletBalanceStub = sinon.stub().returns({ totalBalance })
//     balance.__set__('walletBalance', walletBalanceStub)
//     total = balance.getTotalBalance
//   })

//   it('calls wallet balance', async () => {
//     await total()
//     expect(walletBalanceStub).to.have.been.called()
//   })

//   it('returns the total balance', async () => {
//     const res = await total()
//     expect(res).to.eql(totalBalance)
//   })
// })

// describe('unconfirmed', () => {
//   let unconfirmed
//   let walletBalanceStub
//   let unconfirmedBalance

//   beforeEach(() => {
//     unconfirmedBalance = '100'
//     walletBalanceStub = sinon.stub().returns({ unconfirmedBalance })
//     balance.__set__('walletBalance', walletBalanceStub)
//     unconfirmed = balance.getUnconfirmedBalance
//   })

//   it('calls wallet balance', async () => {
//     await unconfirmed()
//     expect(walletBalanceStub).to.have.been.called()
//   })

//   it('returns the unconfirmed balance', async () => {
//     const res = await unconfirmed()
//     expect(res).to.eql(unconfirmedBalance)
//   })
// })

// describe('confirmed', () => {
//   let confirmed
//   let walletBalanceStub
//   let confirmedBalance

//   beforeEach(() => {
//     confirmedBalance = '100'
//     walletBalanceStub = sinon.stub().returns({ confirmedBalance })
//     balance.__set__('walletBalance', walletBalanceStub)
//     confirmed = balance.getConfirmedBalance
//   })

//   it('calls wallet balance', async () => {
//     await confirmed()
//     expect(walletBalanceStub).to.have.been.called()
//   })

//   it('returns the confirmed balance', async () => {
//     const res = await confirmed()
//     expect(res).to.eql(confirmedBalance)
//   })
// })
