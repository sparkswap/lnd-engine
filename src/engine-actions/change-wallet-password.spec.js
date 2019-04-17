const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const changeWalletPassword = rewire(path.resolve(__dirname, 'change-wallet-password'))

describe('change-password', () => {
  const currentPassword = 'currentpass'
  const newPassword = 'newpass'

  let lndChangePasswordStub
  let engine
  let bufferStub
  let currentPasswordBuffer
  let newPasswordBuffer
  let bufferFromStub

  beforeEach(() => {
    engine = {
      walletUnlocker: sinon.stub
    }
    currentPasswordBuffer = sinon.stub()
    newPasswordBuffer = sinon.stub()
    bufferFromStub = sinon.stub()
    bufferFromStub.withArgs(currentPassword).returns(currentPasswordBuffer)
    bufferFromStub.withArgs(newPassword).returns(newPasswordBuffer)
    bufferStub = {
      from: bufferFromStub
    }
    lndChangePasswordStub = sinon.stub()

    changeWalletPassword.__set__('lndChangePassword', lndChangePasswordStub)
    changeWalletPassword.__set__('Buffer', bufferStub)
  })

  beforeEach(async () => {
    await changeWalletPassword.call(engine, currentPassword, newPassword)
  })

  it('converts the `currentPassword` string to buffer', () => {
    expect(bufferStub.from).to.have.been.calledWith(currentPassword, 'utf8')
  })

  it('converts the `newPassword` string to buffer', () => {
    expect(bufferStub.from).to.have.been.calledWith(newPassword, 'utf8')
  })

  it('changes a wallet password', () => {
    expect(lndChangePasswordStub).to.have.been.calledWith(currentPasswordBuffer, newPasswordBuffer, { client: engine.walletUnlocker })
  })
})
