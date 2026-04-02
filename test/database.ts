import 'mocha'
import * as assert from 'assert'

import { Client, Asset } from '../src'
import { agent, TEST_NODE } from './common'

describe('database api', function () {
  this.slow(500)
  this.timeout(20 * 1000)

  const client = Client.testnet({ agent })
  let serverConfig: { [key: string]: boolean | string | number }
  const liveClient = new Client(TEST_NODE, { agent })

  before(async () => {
    serverConfig = await liveClient.database.getConfig()
  })

  it('getDynamicGlobalProperties', async () => {
    const result = await liveClient.database.getDynamicGlobalProperties()
    const keys = Object.keys(result)
    // Check that essential DGP fields are present (order may vary across node versions)
    const requiredKeys = [
      'head_block_number',
      'head_block_id',
      'time',
      'current_witness',
      'current_supply',
      'total_vesting_fund_hive',
      'total_vesting_shares',
      'hbd_interest_rate',
      'maximum_block_size',
      'last_irreversible_block_num',
      'vote_power_reserve_rate'
    ]
    for (const key of requiredKeys) {
      assert(keys.includes(key), `missing key: ${key}`)
    }
  })

  it('getConfig', async () => {
    const result = await liveClient.database.getConfig()
    // HIVE_ config stuff here
    const r = (key: string) => result['HIVE_' + key]
    // also test some assumptions made throughout the code
    assert.strictEqual(r('CREATE_ACCOUNT_WITH_HIVE_MODIFIER'), 30)
    assert.strictEqual(r('CREATE_ACCOUNT_DELEGATION_RATIO'), 5)
    assert.strictEqual(r('100_PERCENT'), 10000)
    assert.strictEqual(r('1_PERCENT'), 100)

    const version = await liveClient.call('database_api', 'get_version', {})
    assert.strictEqual(version.chain_id, liveClient.chainId.toString('hex'))
  })

  it('getBlockHeader', async () => {
    const result = await liveClient.database.getBlockHeader(1)
    assert.strictEqual('0000000000000000000000000000000000000000', result.previous)
  })

  it('getBlock', async () => {
    const result = await liveClient.database.getBlock(1)
    assert.strictEqual('0000000000000000000000000000000000000000', result.previous)
    assert.strictEqual(serverConfig.HIVE_INIT_PUBLIC_KEY_STR, result.signing_key)
  })

  it('getOperations', async () => {
    const result = await liveClient.database.getOperations(1)
    assert(result.length >= 1, 'should have at least one operation')
    // Block 1 always ends with a producer_reward virtual op
    assert.strictEqual(result[result.length - 1].op[0], 'producer_reward')
  })

  it('getDiscussions', async () => {
    const r1 = await liveClient.database.getDiscussions('comments', {
      start_author: 'hiveio',
      start_permlink: 'announcing-the-launch-of-hive-blockchain',
      limit: 1
    })
    assert.strictEqual(r1.length, 0)
  })

  it('getTransaction', async () => {
    const tx = await liveClient.database.getTransaction('c20a84c8a12164e1e0750f0ee5d3c37214e2f073')
    assert.deepStrictEqual(tx.signatures, [
      '201e02e8daa827382b1a3aefb6809a4501eb77aa813b705be4983d50d74c66432529601e5ae43981dcba2a7e171de5fd75be2e1820942260375d2daf647df2ccaa'
    ])
    try {
      await client.database.getTransaction('d20a84c8a12164e1e0750f0ee5d3c37214e2f073')
      assert(false, 'should not be reached')
    } catch (error) {
      assert(error.message.includes('Unknown Transaction d20a84c8a12164e1e0750f0ee5d3c37214e2f073'))
    }
  })

  it('getChainProperties', async () => {
    const props = await liveClient.database.getChainProperties()
    assert.strictEqual(Asset.from(props.account_creation_fee).symbol, 'HIVE')
  })

  it('getCurrentMedianHistoryPrice', async () => {
    const price = await liveClient.database.getCurrentMedianHistoryPrice()
    assert.strictEqual(Asset.from(price.base).symbol, 'HBD')
    assert.strictEqual(price.quote.symbol, 'HIVE')
  })

  it('getVestingDelegations', async function () {
    this.slow(5 * 1000)
    const [delegation] = await liveClient.database.getVestingDelegations('mahdiyari', '', 1)
    if (!delegation) {
      return
    }
    assert.strictEqual(delegation.delegator, 'mahdiyari')
    assert.strictEqual(typeof delegation.id, 'number')
    assert.strictEqual(Asset.from(delegation.vesting_shares).symbol, 'VESTS')
  })
  //
  // it('verifyAuthority', async function () {
  //    this.slow(5 * 1000);
  //    const tx: Transaction = {
  //       ref_block_num: 0,
  //       ref_block_prefix: 0,
  //       expiration: '2000-01-01T00:00:00',
  //       operations: [
  //          [
  //             'custom_json',
  //             {
  //                required_auths: [],
  //                required_posting_auths: [acc.username],
  //                id: 'rpc-params',
  //                json: '{"foo": "bar"}'
  //             }
  //          ]
  //       ],
  //       extensions: []
  //    };
  //    const key = PrivateKey.fromLogin(acc.username, acc.password, 'posting');
  //
  //    const stx = client.broadcast.sign(tx, key);
  //    const rv = await client.database.verifyAuthority(stx);
  //    assert(rv === true);
  // const bogusKey = PrivateKey.fromSeed("ogus");
  // try {
  //   await client.database.verifyAuthority(
  //     client.broadcast.sign(tx, bogusKey)
  //   );
  //   assert(false, "should not be reached");
  // } catch (error) {
  //   assert.strictEqual(error.message, `Missing Posting Authority ${acc.username}`);
  // }
  // });
})
