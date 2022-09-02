import * as assert from 'assert';
import 'mocha';

import { Client } from './../src';
import { agent, TEST_NODE } from './common';

describe('HivemindAPI', function () {
   this.slow(500);
   this.timeout(20 * 1000);

   const liveClient = new Client(TEST_NODE, { agent });

   it('getRankedPosts', async () => {
      const r = await liveClient.hivemind.getRankedPosts({ limit: 1, sort: 'trending', tag: '', observer: '' });
      assert.strictEqual(r.length, 1);
   });

   it('getCommunity', async () => {
      const r = await liveClient.hivemind.getCommunity({ name: 'hive-148441', observer: '' });
      assert.strictEqual(r.length, 1);
   });

   it('getAccountNotifications', async () => {
      const r = await liveClient.hivemind.getAccountNotifications({ account: 'acidyo', limit: 2 });
      assert.strictEqual(r.length, 1);
   });

   it('listCommunities', async () => {
      const r = await liveClient.hivemind.listCommunities({ limit: 2 });
      assert.strictEqual(r.length, 2);
   });

   it('listAllSubscriptions', async () => {
      const r = await liveClient.hivemind.listAllSubscriptions({ account: 'acidyo' });
      assert.strictEqual(r.length, 1);
   });
});
