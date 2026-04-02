import 'mocha';
import * as assert from 'assert';
import { VError } from 'verror';

import { Client } from '../src';

describe('client', function () {
    this.slow(200);
    this.timeout(30 * 1000);

    const client = Client.testnet();

    it('should handle failover', async () => {
        const bclient = new Client(['https://wrongapi.openhive.network', 'https://testnet.openhive.network'], {
            timeout: 1000
        });
        const result = await bclient.call('condenser_api', 'get_accounts', [['initminer']]);
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].name, 'initminer');
    });

    it('should make rpc call', async () => {
        const result = await client.call('condenser_api', 'get_accounts', [['initminer']]);
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].name, 'initminer');
    });

    it('should handle rpc errors', async () => {
        try {
            await client.call('condenser_api', 'i_like_turtles');
            assert(false, 'should not be reached');
        } catch (error) {
            assert.strictEqual(error.name, 'RPCError');
            assert(
                error.message === `itr != _by_name.end(): no method with name 'i_like_turtles'` || // pre-appbase
                    error.message === `method_itr != api_itr->second.end(): Could not find method i_like_turtles`
            ); // appbase

            const info = VError.info(error as Error);
            assert.strictEqual(info.code, 10);
            assert.strictEqual(info.name, 'assert_exception');
        }
    });

    it('should format rpc errors', async () => {
        try {
            await client.call('transaction_status_api', 'find_transaction', { transaction_id: 'asd' });
            assert(false, 'should not be reached');
        } catch (error) {
            assert.strictEqual(error.name, 'RPCError');
            assert.strictEqual(error.message, "Invalid hex character 's'");
            const info = VError.info(error as Error);
            assert.strictEqual(info.code, 0);
            assert.strictEqual(info.name, 'exception');
        }
    });

    // bs, needs rework
    // it("should retry and timeout", async function() {
    //   this.slow(2500);
    //   aclient.timeout = 1000;
    //   aclient.address = "https://jnordberg.github.io/dhive/FAIL";
    //   const backoff = aclient.backoff;
    //   let seenBackoff = false;
    //   aclient.backoff = tries => {
    //     seenBackoff = true;
    //     return backoff(tries);
    //   };
    //   const tx = { operations: [["witness_update", {}]] };
    //   try {
    //     await client.database.getChainProperties();
    //     assert(false, "should not be reached");
    //   } catch (error) {
    //     assert(seenBackoff, "should have seen backoff");
    //   }
    // });
});
