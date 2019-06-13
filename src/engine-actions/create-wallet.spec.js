const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const createWallet = rewire(path.resolve(__dirname, 'create-wallet'))

describe('create-wallet', () => {
  describe('createWallet', () => {
    const password = 'password'
    const buffer = 'buffer'

    let genSeedStub
    let initWalletStub
    let seed
    let engine
    let bufferStub
    let validSeedStub

    let reverts

    beforeEach(() => {
      reverts = []
      validSeedStub = sinon.stub()
      engine = {
        walletUnlocker: sinon.stub()
      }
      seed = {
        cipherSeedMnemonic: ['bird', 'cat']
      }
      genSeedStub = sinon.stub().returns(seed)
      initWalletStub = sinon.stub().resolves()
      bufferStub = sinon.stub().returns(buffer)

      reverts.push(createWallet.__set__('genSeed', genSeedStub))
      reverts.push(createWallet.__set__('initWallet', initWalletStub))
      reverts.push(createWallet.__set__('Buffer', { from: bufferStub }))
      reverts.push(createWallet.__set__('isValidSeed', validSeedStub))
    })

    context('wallet recovery', () => {
      let seed
      let backup

      beforeEach(() => {
        seed = [
          'absorb',
          'girl',
          'forget',
          'bind',
          'top',
          'claw',
          'jewel',
          'food',
          'achieve',
          'cousin',
          'coral',
          'fringe',
          'already',
          'calm',
          'crime',
          'near',
          'blanket',
          'jacket',
          'mad',
          'goose',
          'erosion',
          'device',
          'buffalo',
          'catalog'
        ]
        backup = Buffer.from('backup')
      })

      it('throws an error if a backup file is provided but no seed exists', () => {
        const backup = {}
        return expect(createWallet.call(engine, password, { backup })).to.eventually.be.rejectedWith('Must provide seed')
      })

      it('checks if a seed is valid', async () => {
        await createWallet.call(engine, password, { seed, backup })
        expect(validSeedStub).to.have.been.calledWith(seed)
      })

      it('uses a recovery window if it was provided', async () => {
        const recoveryWindow = 200
        await createWallet.call(engine, password, { seed, backup, recoveryWindow })
        expect(initWalletStub).to.have.been.calledWith(sinon.match.any, seed, sinon.match({ backup, recoveryWindow }))
      })

      it('uses a default recovery window for initializing a wallet', async () => {
        const recoveryWindow = createWallet.__get__('RECOVERY_WINDOW_DEFAULT')
        await createWallet.call(engine, password, { seed, backup })
        expect(initWalletStub).to.have.been.calledWith(sinon.match.any, seed, sinon.match({ backup, recoveryWindow }))
      })

      it('returns the provided seed', async () => {
        initWalletStub.resolves(seed)
        const res = await createWallet.call(engine, password, { seed })
        expect(res).to.be.eql(seed)
      })
    })

    context('creating a new wallet', () => {
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
  })

  describe('isValidSeed', () => {
    const isValidSeed = createWallet.__get__('isValidSeed')

    it('returns false if seed is not an array', async () => {
      const res = await isValidSeed('badseed')
      return expect(res).to.be.false()
    })

    it('returns false if seed is not 24 characters long', async () => {
      const res = await isValidSeed(['bad', 'seed'])
      return expect(res).to.be.false()
    })

    it('returns true for a valid seed', async () => {
      const goodSeed = [
        'absorb',
        'girl',
        'forget',
        'bind',
        'top',
        'claw',
        'jewel',
        'food',
        'achieve',
        'cousin',
        'coral',
        'fringe',
        'already',
        'calm',
        'crime',
        'near',
        'blanket',
        'jacket',
        'mad',
        'goose',
        'erosion',
        'device',
        'buffalo',
        'catalog'
      ]
      const res = await isValidSeed(goodSeed)
      return expect(res).to.be.true()
    })
  })
})
