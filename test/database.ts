import 'mocha';
import * as assert from 'assert';

import { Client, Asset, Transaction, PrivateKey } from './../src';
import { getTestnetAccounts, agent, TEST_NODE } from './common';

describe('database api', function () {
   this.slow(500);
   this.timeout(20 * 1000);

   const client = Client.testnet({ agent });
   let serverConfig: { [key: string]: boolean | string | number };
   const liveClient = new Client(TEST_NODE, { agent });

   let acc: { username: string; password: string };
   before(async () => {
      [acc] = await getTestnetAccounts();
   });

   it('getDynamicGlobalProperties', async () => {
      const result = await liveClient.database.getDynamicGlobalProperties();
      assert.deepStrictEqual(Object.keys(result), [
         'head_block_number',
         'head_block_id',
         'time',
         'current_witness',
         'total_pow',
         'num_pow_witnesses',
         'virtual_supply',
         'current_supply',
         'confidential_supply',
         'init_sbd_supply',
         'current_sbd_supply',
         'confidential_sbd_supply',
         'total_vesting_fund_steem',
         'total_vesting_shares',
         'total_reward_fund_steem',
         'total_reward_shares2',
         'pending_rewarded_vesting_shares',
         'pending_rewarded_vesting_steem',
         'sbd_interest_rate',
         'sbd_print_rate',
         'maximum_block_size',
         'required_actions_partition_percent',
         'current_aslot',
         'recent_slots_filled',
         'participation_count',
         'last_irreversible_block_num',
         'vote_power_reserve_rate',
         'delegation_return_period',
         'reverse_auction_seconds',
         'available_account_subsidies',
         'sbd_stop_percent',
         'sbd_start_percent',
         'next_maintenance_time',
         'last_budget_time',
         'content_reward_percent',
         'vesting_reward_percent',
         'sps_fund_percent',
         'sps_interval_ledger',
         'downvote_pool_percent'
      ]);
   });

   it('getConfig', async () => {
      const result = await client.database.getConfig();
      // HIVE_ config stuff here
      const r = (key: string) => result['HIVE_' + key];
      serverConfig = result;
      // also test some assumptions made throughout the code
      assert.strictEqual(r('CREATE_ACCOUNT_WITH_HIVE_MODIFIER'), 30);
      assert.strictEqual(r('CREATE_ACCOUNT_DELEGATION_RATIO'), 5);
      assert.strictEqual(r('100_PERCENT'), 10000);
      assert.strictEqual(r('1_PERCENT'), 100);

      const version = await client.call('database_api', 'get_version', {});
      assert.strictEqual(version.chain_id, client.options.chainId);
   });

   it('getBlockHeader', async () => {
      const result = await client.database.getBlockHeader(1);
      assert.strictEqual('0000000000000000000000000000000000000000', result.previous);
   });

   it('getBlock', async () => {
      const result = await client.database.getBlock(1);
      assert.strictEqual('0000000000000000000000000000000000000000', result.previous);
      assert.strictEqual(serverConfig.HIVE_INIT_PUBLIC_KEY_STR, result.signing_key);
   });

   it('getOperations', async () => {
      const result = await liveClient.database.getOperations(1);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].op[0], 'producer_reward');
   });

   it('getDiscussions', async () => {
      const r1 = await liveClient.database.getDiscussions('comments', {
         start_author: 'almost-digital',
         start_permlink: 're-pal-re-almost-digital-dsteem-a-strongly-typed-steem-client-library-20170702t131034262z',
         limit: 1
      });
      assert.strictEqual(r1.length, 1);
      assert.strictEqual(r1[0].body, '☀️heroin for programmers');
   });

   it('getTransaction', async () => {
      const tx = await liveClient.database.getTransaction('c20a84c8a12164e1e0750f0ee5d3c37214e2f073');
      assert.deepStrictEqual(tx.signatures, ['201e02e8daa827382b1a3aefb6809a4501eb77aa813b705be4983d50d74c66432529601e5ae43981dcba2a7e171de5fd75be2e1820942260375d2daf647df2ccaa']);
      try {
         await client.database.getTransaction('11c20a84c8a12164e1e0750f0ee5d3c37214e2f073');
         assert(false, 'should not be reached');
      } catch (error) {
         assert.strictEqual(error.message, 'Unable to find transaction 11c20a84c8a12164e1e0750f0ee5d3c37214e2f073');
      }
   });

   it('getChainProperties', async () => {
      const props = await liveClient.database.getChainProperties();
      assert.strictEqual(Asset.from(props.account_creation_fee).symbol, 'HIVE');
   });

   it('getCurrentMedianHistoryPrice', async () => {
      const price = await liveClient.database.getCurrentMedianHistoryPrice();
      assert.strictEqual(Asset.from(price.base).symbol, 'HBD');
      assert.strictEqual(price.quote.symbol, 'HIVE');
   });

   // this tests for delegations from the steem account
   it('getVestingDelegations', async function () {
      this.slow(5 * 1000);
      const [delegation] = await liveClient.database.getVestingDelegations('mahdiyari', '', 1);
      if (!delegation) {
         return;
      }
      assert.strictEqual(delegation.delegator, 'mahdiyari');
      assert.strictEqual(typeof delegation.id, 'number');
      assert.strictEqual(Asset.from(delegation.vesting_shares).symbol, 'VESTS');
   });

   it('verifyAuthority', async function () {
      this.slow(5 * 1000);
      const tx: Transaction = {
         ref_block_num: 0,
         ref_block_prefix: 0,
         expiration: '2000-01-01T00:00:00',
         operations: [
            [
               'custom_json',
               {
                  required_auths: [],
                  required_posting_auths: [acc.username],
                  id: 'rpc-params',
                  json: '{"foo": "bar"}'
               }
            ]
         ],
         extensions: []
      };
      const key = PrivateKey.fromLogin(acc.username, acc.password, 'posting');

      const stx = client.broadcast.sign(tx, key);
      const rv = await client.database.verifyAuthority(stx);
      assert(rv === true);
      // const bogusKey = PrivateKey.fromSeed("ogus");
      // try {
      //   await client.database.verifyAuthority(
      //     client.broadcast.sign(tx, bogusKey)
      //   );
      //   assert(false, "should not be reached");
      // } catch (error) {
      //   assert.strictEqual(error.message, `Missing Posting Authority ${acc.username}`);
      // }
   });
});
