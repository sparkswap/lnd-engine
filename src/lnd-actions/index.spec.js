const path = require('path')
const { expect, rewire } = require('test/test-helper')

const actions = rewire(path.resolve(__dirname))

describe('actions index', () => {
  const currentActions = [
    'addInvoice',
    'getInfo',
    'invoiceStatus',
    'newAddress',
    'walletBalance'
  ]

  it('registers all actions', () => {
    return Object.keys(actions).forEach((action) => {
      expect(currentActions, `Action not updated in test`).to.include(action)
    })
  })

  it('actions are implemented', () => {
    expect(Object.keys(actions).length).to.eql(currentActions.length)
  })
})
