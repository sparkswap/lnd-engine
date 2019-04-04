const { expect } = require('test/test-helper')

const loggablePubKey = require('./loggable-pubkey')

describe('loggablePubKey', () => {
  let pubkey = '0360369b401f06426e779ab89e84f74c20d2f55900d3cf0933ad93d18f146b29d1'

  it('returns undefined if no public key is provided', () => {
    expect(loggablePubKey()).to.be.undefined()
  })

  it('returns the 15 characters selected', () => {
    const res = loggablePubKey(pubkey)
    expect(res).to.include('0360369b401f064')
  })
})
