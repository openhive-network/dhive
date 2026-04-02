/**
 * @file Account by key API helpers.
 * @author Bartłomiej (@engrave) Górnicki
 */

import { PublicKey } from '../crypto';
import { Client } from '../client';

export interface AccountsByKey {
    accounts: string[][];
}

export class AccountByKeyAPI {
    constructor(private readonly client: Client) {}

    /**
     * Convenience for calling `account_by_key_api`.
     */
    call<T>(method: string, params?: any): Promise<T> {
        return this.client.call<T>('account_by_key_api', method, params);
    }

    /**
     * Returns all accounts that have the key associated with their owner or active authorities.
     */
    async getKeyReferences(keys: (PublicKey | string)[]): Promise<AccountsByKey> {
        return this.call('get_key_references', { keys: keys.map((key) => key.toString()) });
    }
}
