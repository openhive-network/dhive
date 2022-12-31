/**
 * @file Account by key API helpers.
 * @author Bartłomiej (@engrave) Górnicki
 */

import {PublicKey} from '../crypto'
import { Client } from './../client'

export interface AccountsByKey {
    accounts: string[][]
}

export class AccountByKeyAPI {
    constructor(readonly client: Client) {}

    /**
     * Convenience for calling `account_by_key_api`.
     */
    public call(method: string, params?: any) {
        return this.client.call('account_by_key_api', method, params)
    }

    /**
     * Returns all accounts that have the key associated with their owner or active authorities.
     */
    public async getKeyReferences(keys: (PublicKey | string)[]): Promise<AccountsByKey> {
        return this.call('get_key_references', { keys: keys.map(key => key.toString()) })
    }
}
