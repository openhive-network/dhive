import "mocha";
import * as assert from "assert";

import { Client, Asset, Transaction, PrivateKey } from "./../src";
import { getTestnetAccounts, randomString, agent, TEST_NODE } from "./common";

describe("HivemindAPI", function () {
    this.slow(500);
    this.timeout(20 * 1000);

    const client = Client.testnet({ agent });
    const liveClient = new Client(TEST_NODE, { agent });

    let acc: { username: string; password: string };

    it('getRankedPosts', async () => {
        const r = await liveClient.hivemind.getRankedPosts({ limit: 1, sort: 'trending', tag: '', observer: "" })
        //console.log('rankedposts', r)
        assert.equal(r.length, 1)
    })

    it('getCommunity', async () => {
        const r = await liveClient.hivemind.getCommunity({ name: 'hive-148441', observer: '' })
        // console.log('community', r)
        //assert.equal(r.length, 1)
    })

    it('getAccountNotifications', async () => {
        const r = await liveClient.hivemind.getAccountNotifications({ account: 'acidyo', limit: 2 })
        // console.log('notifies', r)
        //assert.equal(r.length, 1)
    })

    it('listCommunities', async () => {
        const r = await liveClient.hivemind.listCommunities({ limit: 2 })
        // console.log('communities', r)
    })

    it('listAllSubscriptions', async () => {
        const r = await liveClient.hivemind.listAllSubscriptions({ account: 'acidyo' })
        // console.log('subscriptions', r)
        //assert.equal(r.length, 1)
    })
});
