import * as assert from 'assert'
import 'mocha'

import { Client } from './../src'
import { agent } from './common'

describe('transaction_status_api', function() {
  this.slow(500)
  this.timeout(20 * 1000)

  const client = Client.testnet({ agent })

  describe('find_transaction', () => {

    it('should return unknown', async () => {
      const {status} = await client.transaction.findTransaction('0000000000000000000000000000000000000000')
      assert.deepEqual(status, 'unknown')
    })

    it('should return too_old', async () => {
      const {status} = await client.transaction.findTransaction('0000000000000000000000000000000000000000', '2016-03-24T18:00:21')
      assert.deepEqual(status, 'too_old')
    })

  })

})
