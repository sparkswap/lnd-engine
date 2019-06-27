const path = require('path')
const {
  expect,
  rewire,
  sinon
} = require('test/test-helper')

const { Big } = require('../utils')

const getChainTransactions = rewire(path.resolve(__dirname, 'get-chain-transactions'))

describe('getChainTransactions', () => {
  describe('getTxIdsForChannels', () => {
    let channels
    let getTxIdsForChannels = getChainTransactions.__get__('getTxIdsForChannels')

    beforeEach(() => {
      channels = [
        { channelPoint: '2345:1' },
        { channelPoint: '1234:0', closingTxHash: 'closingtxhash' }
      ]
    })

    it('returns transaction ids for a list of channels', async () => {
      const res = await getTxIdsForChannels([channels[0]])
      expect(res.has('2345')).to.be.true()
    })

    it('includes closing transactions if they exist', async () => {
      const res = await getTxIdsForChannels(channels)
      expect(res.has('1234')).to.be.true()
      expect(res.has('2345')).to.be.true()
      expect(res.has('closingtxhash')).to.be.true()
    })
  })

  describe('getFeesForClosedChannels', () => {
    let closedChannels
    let getFeesForClosedChannels = getChainTransactions.__get__('getFeesForClosedChannels')

    beforeEach(() => {
      closedChannels = [{
        closingTxHash: 'closingtxhash',
        capacity: '10000',
        settledBalance: '9000'
      }]
    })

    it('returns an empty map when no closed channels exist', async () => {
      const res = await getFeesForClosedChannels([])
      expect(res).to.be.empty()
    })

    it('returns a fee for a given txhash', async () => {
      const expectedFee = '1000'
      const res = await getFeesForClosedChannels(closedChannels)
      expect(res.get(closedChannels[0].closingTxHash)).to.be.eql(expectedFee)
    })
  })

  describe('determineTransactionType', () => {
    let TRANSACTION_TYPES
    let determineTransactionType
    let amount
    let isChannel
    let isClosedChannel

    beforeEach(() => {
      amount = '100000000'
      isChannel = false
      isClosedChannel = false

      determineTransactionType = getChainTransactions.__get__('determineTransactionType')
      TRANSACTION_TYPES = getChainTransactions.__get__('TRANSACTION_TYPES')
    })

    it('returns CHANNEL_CLOSE if the channel was found in the closed channels', () => {
      amount = '1'
      isClosedChannel = true
      expect(determineTransactionType(amount, isChannel, isClosedChannel)).to.be.eql(TRANSACTION_TYPES.CHANNEL_CLOSE)
    })

    it('returns CHANNEL_OPEN if our transaction amount is negative and our txid is found in our channels on the engine', () => {
      amount = '-0.12'
      isChannel = true
      expect(determineTransactionType(amount, isChannel, isClosedChannel)).to.be.eql(TRANSACTION_TYPES.CHANNEL_OPEN)
    })

    it('returns DEPOSIT if the transaction is not in a channel and has a positive amount', () => {
      amount = '1'
      expect(determineTransactionType(amount, isChannel, isClosedChannel)).to.be.eql(TRANSACTION_TYPES.DEPOSIT)
    })

    it('returns WITHDRAW if the transaction is not in a channel and has a negative amount', () => {
      amount = '-0.12'
      expect(determineTransactionType(amount, isChannel, isClosedChannel)).to.be.eql(TRANSACTION_TYPES.WITHDRAW)
    })

    it('returns UNKNOWN for an unknown transaction', () => {
      amount = '0'
      expect(determineTransactionType(amount, isChannel, isClosedChannel)).to.be.eql(TRANSACTION_TYPES.UNKNOWN)
    })
  })

  describe('getChainTransactions', () => {
    let getTransactionsStub
    let engine
    let transactions
    let listChannelsStub
    let listClosedChannelsStub
    let listPendingChannelsStub
    let openChannels
    let closedChannels
    let pendingChannels

    beforeEach(() => {
      transactions = [
        // Deposit transaction
        { txHash: 'deposit', amount: '201000', blockHeight: '123', timeStamp: '1557340021', totalFees: '0' },
        // Channel open transaction
        { txHash: 'channelopen', amount: '-11000', blockHeight: '1234', timeStamp: '1559951461', totalFees: '1000' },
        { txHash: 'pendingchannelopen', amount: '-11000', blockHeight: '0', timeStamp: '1560204001', totalFees: '0' },
        // Channel close transactions
        { txHash: 'channelclose', amount: '9000', blockHeight: '12345', timeStamp: '1560204001', totalFees: '0' },
        { txHash: 'pendingchannelclose', amount: '9000', blockHeight: '12345', timeStamp: '1559951461', totalFees: '0' },
        { txHash: 'pendingforceclose', amount: '9000', blockHeight: '12345', timeStamp: '1560204001', totalFees: '0' },
        // Withdraw transaction
        { txHash: 'withdraw', amount: '-20000', blockHeight: '1234', timeStamp: '1559951461', totalFees: '1000' },
        // Pending tx
        { txHash: 'pendingwaitingclose', amount: '9000', blockHeight: '0', timeStamp: '1559951461', totalFees: '0' },
        // Unknown tx
        { txHash: 'unknown', amount: '0', blockHeight: '123455', timeStamp: '1559951461', totalFees: '1000' }
      ]

      engine = {
        logger: {
          debug: sinon.stub()
        },
        client: sinon.stub(),
        quantumsPerCommon: 1
      }

      openChannels = {
        channels: [
          { channelPoint: 'channelopen:0' }
        ]
      }

      closedChannels = {
        channels: [
          { channelPoint: 'channelclose:0', closingTxHash: 'channelclose', capacity: '10000', settledBalance: '9000' }
        ]
      }

      pendingChannels = {
        pendingOpenChannels: [
          { channel: { channelPoint: 'pendingchannelopen:0' } }
        ],
        pendingClosingChannels: [
          { channel: { channelPoint: 'pendingchannelclose:0' } }
        ],
        pendingForceClosingChannels: [
          { channel: { channelPoint: 'pendingforceclose:0' } }
        ],
        waitingCloseChannels: [
          { channel: { channelPoint: 'pendingwaitingclose:0' } }
        ]
      }

      // LND stubs
      listChannelsStub = sinon.stub().resolves(openChannels)
      listClosedChannelsStub = sinon.stub().resolves(closedChannels)
      listPendingChannelsStub = sinon.stub().resolves(pendingChannels)

      getChainTransactions.__set__('listChannels', listChannelsStub)
      getChainTransactions.__set__('listClosedChannels', listClosedChannelsStub)
      getChainTransactions.__set__('listPendingChannels', listPendingChannelsStub)

      getTransactionsStub = sinon.stub().resolves({ transactions })

      getChainTransactions.__set__('getTransactions', getTransactionsStub)
    })

    it('returns an empty array if no transactions are available', () => {
      getTransactionsStub.resolves([])
      expect(getChainTransactions.call(engine)).to.be.empty()
    })

    it('returns a list of chain transactions', async () => {
      const res = await getChainTransactions.call(engine)
      expect(Array.isArray(res)).to.be.true()
    })

    it('formats the timestamp of a transaction', async () => {
      const res = await getChainTransactions.call(engine)
      const transaction = res[0]
      expect(transaction.timestamp).to.be.eql('2019-05-08T18:27:01.000Z')
    })

    it('returns null for a null transaction date', async () => {
      getTransactionsStub.resolves({ transactions: [
        { txHash: 'deposit', amount: '201000', blockHeight: '123', timeStamp: null, totalFees: '0' }]
      })
      const res = await getChainTransactions.call(engine)
      const transaction = res[0]
      expect(transaction.timestamp).to.be.eql(null)
    })

    describe('returned transactions', () => {
      const TYPES = getChainTransactions.__get__('TRANSACTION_TYPES')

      it('returns a deposit transaction', async () => {
        getTransactionsStub.resolves({ transactions: [transactions[0]] })
        const res = await getChainTransactions.call(engine)
        expect(res[0].type).to.be.eql(TYPES.DEPOSIT)
        expect(res[0].pending).to.be.false()
        expect(Big(res[0].fees).toString()).to.eql(Big(transactions[0].totalFees).toString())
      })

      it('returns a channel open transaction', async () => {
        getTransactionsStub.resolves({ transactions: [transactions[1]] })
        const res = await getChainTransactions.call(engine)
        expect(res[0].type).to.be.eql(TYPES.CHANNEL_OPEN)
        expect(res[0].pending).to.be.false()
        expect(Big(res[0].fees).toString()).to.eql(Big(transactions[1].totalFees).toString())
      })

      it('returns a pending channel open transaction', async () => {
        getTransactionsStub.resolves({ transactions: [transactions[2]] })
        const res = await getChainTransactions.call(engine)
        expect(res[0].type).to.be.eql(TYPES.CHANNEL_OPEN)
        expect(res[0].pending).to.be.true()
        expect(Big(res[0].fees).toString()).to.eql(Big(transactions[2].totalFees).toString())
      })

      it('returns a channel close transaction', async () => {
        getTransactionsStub.resolves({ transactions: [transactions[3]] })
        const res = await getChainTransactions.call(engine)
        const expectedFee = Big(closedChannels.channels[0].capacity).minus(closedChannels.channels[0].settledBalance).toString()

        expect(res[0].type).to.be.eql(TYPES.CHANNEL_CLOSE)
        expect(res[0].pending).to.be.false()
        expect(Big(res[0].fees).toString()).to.eql(expectedFee)
      })

      it('returns a pending channel close transaction', async () => {
        getTransactionsStub.resolves({ transactions: [transactions[4]] })
        const res = await getChainTransactions.call(engine)
        expect(res[0].type).to.be.eql(TYPES.CHANNEL_CLOSE)
        expect(res[0].pending).to.be.true()
        expect(Big(res[0].fees).toString()).to.eql(Big(transactions[4].totalFees).toString())
      })

      it('returns a pending force close transactions', async () => {
        getTransactionsStub.resolves({ transactions: [transactions[5]] })
        const res = await getChainTransactions.call(engine)
        expect(res[0].type).to.be.eql(TYPES.CHANNEL_CLOSE)
        expect(res[0].pending).to.be.true()
        expect(Big(res[0].fees).toString()).to.eql(Big(transactions[5].totalFees).toString())
      })

      it('returns a withdraw transaction', async () => {
        getTransactionsStub.resolves({ transactions: [transactions[6]] })
        const res = await getChainTransactions.call(engine)
        expect(res[0].type).to.be.eql(TYPES.WITHDRAW)
        expect(res[0].pending).to.be.false()
        expect(Big(res[0].fees).toString()).to.eql(Big(transactions[6].totalFees).toString())
      })

      it('returns a pending waiting close transaction', async () => {
        getTransactionsStub.resolves({ transactions: [transactions[7]] })
        const res = await getChainTransactions.call(engine)
        expect(res[0].type).to.be.eql(TYPES.CHANNEL_CLOSE)
        expect(res[0].pending).to.be.true()
        expect(Big(res[0].fees).toString()).to.eql(Big(transactions[7].totalFees).toString())
      })

      it('returns an unknown transaction', async () => {
        getTransactionsStub.resolves({ transactions: [transactions[8]] })
        const res = await getChainTransactions.call(engine)
        expect(res[0].type).to.be.eql(TYPES.UNKNOWN)
        expect(res[0].pending).to.be.false()
        expect(Big(res[0].fees).toString()).to.eql(Big(transactions[8].totalFees).toString())
      })
    })
  })
})
