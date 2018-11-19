const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const createWallet = rewire(path.resolve(__dirname, 'create-wallet'))

describe('createWallet', () => {
  const password = 'password'
  const buffer = 'buffer'

  let genSeedStub
  let initWalletStub
  let seed
  let engine
  let bufferStub

  beforeEach(() => {
    engine = {
      walletUnlocker: sinon.stub()
    }
    seed = {
      cipherSeedMnemonic: ['bird', 'cat']
    }
    genSeedStub = sinon.stub().returns(seed)
    initWalletStub = sinon.stub().resolves()
    bufferStub = sinon.stub().returns(buffer)

    createWallet.__set__('genSeed', genSeedStub)
    createWallet.__set__('initWallet', initWalletStub)
    createWallet.__set__('Buffer', {
      from: bufferStub
    })
  })

  it('errors if a password does not meet lnd length requirements', () => {
    return expect(createWallet.call(engine, 'shortpw')).to.eventually.be.rejectedWith('greater than 8')
  })

  it('converts a specified password to a buffer', async () => {
    await createWallet.call(engine, password)
    expect(bufferStub).to.have.been.calledWith(password, 'utf8')
  })

  it('generates a wallet seed', async () => {
    await createWallet.call(engine, password)
    expect(genSeedStub).to.have.been.calledWith(sinon.match({ client: engine.walletUnlocker }))
  })

  it('initializes a wallet', async () => {
    await createWallet.call(engine, password)
    expect(initWalletStub).to.have.been.calledWith(buffer, sinon.match(seed.cipherSeedMnemonic))
  })

  it('returns a cipher seed for the created wallet', async () => {
    const res = await createWallet.call(engine, password)
    expect(res).to.be.eql(seed.cipherSeedMnemonic)
  })
})
