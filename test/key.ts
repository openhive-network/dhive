import * as assert from 'assert'
import 'mocha'

import { Client } from './../src'
import { agent } from './common'

describe('account_by_key_api', function() {
  this.slow(500)
  this.timeout(20 * 1000)

  const client = Client.testnet({ agent })

  it('get_key_references', async () => {
    const result = await client.keys.getKeyReferences(['TST65PUAPA4yC4RgPtGgsPupxT6yJtMhmT5JHFdsT3uoCbR8WJ25s'])
    assert.deepEqual(result, {accounts: [['hiveio']]})
  })

})
