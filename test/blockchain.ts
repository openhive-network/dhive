import * as assert from 'assert'
import 'mocha'

import { AppliedOperation, Client, SignedBlock } from './../src'

import { agent, TEST_NODE } from './common'

describe('blockchain', function () {
  this.slow(5 * 1000)
  this.timeout(60 * 1000)

  const client = new Client(TEST_NODE, { agent })

  const expectedIds = ['0000000109833ce528d5bbfb3f6225b39ee10086', '00000002ed04e3c3def0238f693931ee7eebbdf1']
  const expectedOps = [
    'vote',
    'effective_comment_vote',
    'vote',
    'effective_comment_vote',
    'comment',
    'vote',
    'effective_comment_vote',
    'vote',
    'effective_comment_vote',
    'vote',
    'effective_comment_vote',
    'vote',
    'effective_comment_vote',
    'custom_json',
    'producer_reward',
    'comment_payout_update',
    'author_reward',
    'comment_reward',
    'comment_payout_update',
    'comment_payout_update',
    'comment_payout_update',
    'fill_vesting_withdraw',
    'comment',
    'comment',
    'vote',
    'effective_comment_vote',
    'vote',
    'effective_comment_vote',
    'vote',
    'effective_comment_vote',
    'vote',
    'effective_comment_vote',
    'comment',
    'custom_json',
    'custom_json',
    'custom_json',
    'custom_json',
    'claim_reward_balance',
    'custom_json',
    'vote',
    'effective_comment_vote',
    'comment',
    'comment_options',
    'custom_json',
    'vote',
    'effective_comment_vote',
    'producer_reward',
    'comment_payout_update',
    'comment_payout_update',
    'curation_reward',
    'author_reward',
    'comment_reward',
    'comment_payout_update',
    'comment_payout_update',
    'fill_vesting_withdraw'
  ]

  it('should yield blocks', async () => {
    const ids: string[] = []
    for await (const block of client.blockchain.getBlocks({ from: 1, to: 2 })) {
      ids.push(block.block_id)
    }
    assert.deepEqual(ids, expectedIds)
  })

  it('should stream blocks', async () => {
    await new Promise((resolve, reject) => {
      const stream = client.blockchain.getBlockStream({ from: 1, to: 2 })
      const ids: string[] = []
      stream.on('data', (block: SignedBlock) => {
        ids.push(block.block_id)
      })
      stream.on('error', reject)
      stream.on('end', () => {
        assert.deepEqual(ids, expectedIds)
        resolve(null)
      })
    })
  })

  it('should yield operations', async () => {
    const ops: string[] = []
    for await (const operation of client.blockchain.getOperations({
      from: 13300000,
      to: 13300001
    })) {
      ops.push(operation.op[0])
    }
    assert.deepEqual(ops, expectedOps)
  })

  it('should stream operations', async () => {
    await new Promise((resolve, reject) => {
      const stream = client.blockchain.getOperationsStream({
        from: 13300000,
        to: 13300001
      })
      const ops: string[] = []
      stream.on('data', (operation: AppliedOperation) => {
        ops.push(operation.op[0])
      })
      stream.on('error', reject)
      stream.on('end', () => {
        assert.deepEqual(ops, expectedOps)
        resolve(null)
      })
    })
  })

  // nonsense - feel free to investigate
  // it("should yield latest blocks", async function() {
  //   const latest = await client.blockchain.getCurrentBlock(
  //     BlockchainMode.Latest
  //   );
  //   for await (const block of client.blockchain.getBlocks({
  //     mode: BlockchainMode.Latest
  //   })) {
  //     if (block.block_id === latest.block_id) {
  //       continue;
  //     }
  //     assert.equal(
  //       block.previous,
  //       latest.block_id,
  //       "should have the same block id"
  //     );
  //     break;
  //   }
  // });

  it('should handle errors on stream', async () => {
    await new Promise((resolve) => {
      const stream = client.blockchain.getBlockStream(Number.MAX_VALUE)
      stream.on('data', () => {
        assert(false, 'unexpected stream data')
      })
      stream.on('error', () => {
        resolve(null)
      })
    })
  })

  it('should get block number stream', async () => {
    const current = await client.blockchain.getCurrentBlockNum()
    await new Promise((resolve, reject) => {
      const stream = client.blockchain.getBlockNumberStream()
      stream.on('data', (num) => {
        assert(num >= current)
        resolve(null)
      })
      stream.on('error', reject)
    })
  })

  it('should get current block header', async () => {
    const now = Date.now()
    const header = await client.blockchain.getCurrentBlockHeader()
    const ts = new Date(header.timestamp + 'Z').getTime()
    assert(Math.abs(ts / 1000 - now / 1000) < 120, 'blockheader timestamp too old')
  })
})
