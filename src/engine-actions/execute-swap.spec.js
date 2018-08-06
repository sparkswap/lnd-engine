const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const executeSwap = rewire(path.resolve(__dirname, 'execute-swap'))

describe('executeSwap', () => {
  let sha256
  let networkAddressFormatter
  let sendPayment
  let swapHash
  let makerAddress
  let amount
  let client
  let engine

  beforeEach(() => {
    sha256 = {
      hash: sinon.stub()
    }
    sha256.hash.withArgs('fake preimage').returns('fake hash')
    networkAddressFormatter = {
      parse: sinon.stub().withArgs('fake address').returns({ publicKey: 'fake pubkey' })
    }
    sendPayment = sinon.stub().resolves({ paymentPreimage: 'fake preimage' })

    executeSwap.__set__('sha256', sha256)
    executeSwap.__set__('networkAddressFormatter', networkAddressFormatter)
    executeSwap.__set__('sendPayment', sendPayment)

    swapHash = 'fake hash'
    makerAddress = 'fake address'
    amount = '100000'
    client = 'fake client'
    engine = {
      client,
      logger: {
        error: sinon.stub(),
        info: sinon.stub()
      },
      currencyConfig: {
        secondsPerBlock: 600
      }
    }
  })

  it('sends a payment', async () => {
    await executeSwap.call(engine, makerAddress, swapHash, amount)

    expect(sendPayment).to.have.been.calledOnce()
  })

  it('sends using the client', async () => {
    await executeSwap.call(engine, makerAddress, swapHash, amount)

    expect(sendPayment).to.have.been.calledWith(sinon.match.any, { client })
  })

  it('sends to the counterparty\'s public key', async () => {
    await executeSwap.call(engine, makerAddress, swapHash, amount)

    expect(networkAddressFormatter.parse).to.have.been.calledOnce()
    expect(networkAddressFormatter.parse).to.have.been.calledWith(makerAddress)
    expect(sendPayment).to.have.been.calledWith(sinon.match({ destString: 'fake pubkey' }))
  })

  it('sends using the swap hash', async () => {
    await executeSwap.call(engine, makerAddress, swapHash, amount)

    expect(sendPayment).to.have.been.calledWith(sinon.match({ paymentHash: swapHash }))
  })

  it('sends the amount for the swap', async () => {
    await executeSwap.call(engine, makerAddress, swapHash, amount)

    expect(sendPayment).to.have.been.calledWith(sinon.match({ amt: amount }))
  })

  it('uses a final CLTV delta made up of the Maker\'s forwarding amount, the Relayer\'s forwarding amount, the Taker\'s final amount, and a buffer block', async () => {
    await executeSwap.call(engine, makerAddress, swapHash, amount)

    expect(sendPayment).to.have.been.calledWith(sinon.match({ finalCltvDelta: 435 }))
  })

  it('throws on payment error', () => {
    sendPayment.resolves({ paymentError: new Error('fake error') })

    return expect(executeSwap.call(engine, makerAddress, swapHash, amount)).to.eventually.be.rejectedWith('fake error')
  })

  it('checks that the preimage matches', async () => {
    await executeSwap.call(engine, makerAddress, swapHash, amount)

    expect(sha256.hash).to.have.been.calledOnce()
    expect(sha256.hash).to.have.been.calledWith('fake preimage')
  })

  it('throws if the hash does not match', () => {
    sendPayment.resolves({ paymentPreimage: 'a diff preimage' })
    sha256.hash.withArgs('a diff preimage').returns('a diff hash')

    return expect(executeSwap.call(engine, makerAddress, swapHash, amount)).to.eventually.be.rejectedWith('Hash from preimage does not match swap hash')
  })
})
