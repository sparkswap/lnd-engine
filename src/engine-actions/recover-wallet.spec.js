const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const recoverWallet = rewire(path.resolve(__dirname, 'recover-wallet'))

describe('recover-wallet', () => {
  describe('recoverWallet', () => {
    const password = 'password'
    const buffer = 'buffer'

    let initWalletStub
    let seed
    let engine
    let bufferStub
    let validSeedStub
    let backup
    let readFileSyncStub

    let reverts

    beforeEach(() => {
      reverts = []
      validSeedStub = sinon.stub()
      engine = {
        currencyConfig: {
          backupFilePath: '/backup/backupFilePath.zip'
        },
        walletUnlocker: sinon.stub(),
        logger: {
          debug: sinon.stub(),
          warn: sinon.stub()
        }
      }
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
      backup = false
      initWalletStub = sinon.stub().resolves(seed)
      bufferStub = sinon.stub().returns(buffer)
      readFileSyncStub = sinon.stub().returns(buffer)

      reverts.push(recoverWallet.__set__('initWallet', initWalletStub))
      reverts.push(recoverWallet.__set__('Buffer', { from: bufferStub }))
      reverts.push(recoverWallet.__set__('isValidSeed', validSeedStub))
      reverts.push(recoverWallet.__set__('fs', { readFileSync: readFileSyncStub }))
    })

    it('throws an error if password is not provided', () => {
      return expect(recoverWallet.call(engine, null, seed, backup)).to.eventually.be.rejectedWith('Password must be provided')
    })

    it('throws an error if seed is not provided', () => {
      return expect(recoverWallet.call(engine, password, null, backup)).to.eventually.be.rejectedWith('Recovery seed must be provided')
    })

    it('checks if a seed is valid', async () => {
      await recoverWallet.call(engine, password, seed, backup)
      expect(validSeedStub).to.have.been.calledWith(seed)
    })

    it('reads a backup file if backup is true', async () => {
      backup = true
      await recoverWallet.call(engine, password, seed, backup)
      expect(readFileSyncStub).to.have.been.calledWith(engine.currencyConfig.backupFilePath)
    })

    it('uses a recovery window if it was provided', async () => {
      const recoveryWindow = 200
      await recoverWallet.call(engine, password, seed, backup, recoveryWindow)
      expect(initWalletStub).to.have.been.calledWith(sinon.match.any, seed, sinon.match({ recoveryWindow }))
    })

    it('uses a default recovery window for initializing a wallet', async () => {
      const recoveryWindow = recoverWallet.__get__('RECOVERY_WINDOW_DEFAULT')
      await recoverWallet.call(engine, password, seed, backup)
      expect(initWalletStub).to.have.been.calledWith(sinon.match.any, seed, sinon.match({ recoveryWindow }))
    })

    it('warns a user if they only recover on-chain funds using a seed but no backup file', async () => {
      await recoverWallet.call(engine, password, seed)
      expect(engine.logger.warn).to.be.be.calledWith(sinon.match('ONLY on-chain funds will be recovered'))
    })
  })

  describe('isValidSeed', () => {
    const isValidSeed = recoverWallet.__get__('isValidSeed')

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
