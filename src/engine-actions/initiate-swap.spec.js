const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const initiateSwap = rewire(path.resolve(__dirname, 'initiate-swap'))

describe('initiateSwap', () => {
  let networkAddressFormatter
  let sendPayment
  let swapHash
  let address
  let amount
  let client
  let engine
  let maxTimeLock
  let finalDelta

  beforeEach(() => {
    networkAddressFormatter = {
      parse: sinon.stub().withArgs('fake address').returns({ publicKey: 'fake pubkey' })
    }
    sendPayment = sinon.stub().resolves({ paymentPreimage: 'fake preimage' })

    initiateSwap.__set__('networkAddressFormatter', networkAddressFormatter)
    initiateSwap.__set__('sendPayment', sendPayment)

    swapHash = 'fake hash'
    address = 'fake address'
    amount = '100000'
    maxTimeLock = 1201
    finalDelta = 590
    client = 'fake client'
    engine = {
      client,
      logger: {
        error: sinon.stub(),
        info: sinon.stub()
      },
      secondsPerBlock: 600
    }
  })

  it('sends a payment', async () => {
    await initiateSwap.call(engine, address, swapHash, amount, maxTimeLock, finalDelta)

    expect(sendPayment).to.have.been.calledOnce()
    expect(sendPayment).to.have.been.calledWith(sinon.match.any, { client, logger: engine.logger })
    expect(networkAddressFormatter.parse).to.have.been.calledOnce()
    expect(networkAddressFormatter.parse).to.have.been.calledWith(address)
    expect(sendPayment).to.have.been.calledWith(sinon.match({ destString: 'fake pubkey' }))
    expect(sendPayment).to.have.been.calledWith(sinon.match({ paymentHash: swapHash }))
    expect(sendPayment).to.have.been.calledWith(sinon.match({ amt: amount }))
    expect(sendPayment).to.have.been.calledWith(sinon.match({ finalCltvDelta: 1 }))
    expect(sendPayment).to.have.been.calledWith(sinon.match({ cltvLimit: 2 }))
  })

  it('throws on payment error', () => {
    sendPayment.resolves({ paymentError: new Error('fake error') })

    return expect(initiateSwap.call(engine, address, swapHash, amount, maxTimeLock, finalDelta)).to.eventually.be.rejectedWith('fake error')
  })

  it('returns the preimage', async () => {
    expect(await initiateSwap.call(engine, address, swapHash, amount, maxTimeLock, finalDelta)).to.be.eql('fake preimage')
  })
})
