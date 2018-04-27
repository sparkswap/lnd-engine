const { chai } = require('test/test-helper')
const { expect } = chai

const {
  LndEngine
} = require('./index')

describe('lnd-engine index', () => {
  it('implements LndEngine', () => {
    expect(LndEngine).to.not.be.null()
    expect(LndEngine).to.not.be.undefined()
  })
})
