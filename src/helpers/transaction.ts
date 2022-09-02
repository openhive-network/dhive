/**
 * @file Transaction status API helpers.
 * @author Bartłomiej (@engrave) Górnicki
 */

import { Client } from '../client';

export type TransactionStatus = 'unknown' | 'within_mempool' | 'within_reversible_block' | 'within_irreversible_block' | 'expired_reversible' | 'expired_irreversible' | 'too_old';

interface FindTransactionParams {
   transaction_id: string;
   expiration?: string;
}

export class TransactionStatusAPI {
   constructor(private readonly client: Client) {}

   /**
    * Convenience for calling `transaction_status_api`.
    */
   call<T>(method: string, params?: any): Promise<T> {
      return this.client.call<T>('transaction_status_api', method, params);
   }

   /**
    * Returns the status of a given transaction id
    */
   async findTransaction(transaction_id: string, expiration?: string): Promise<{ status: TransactionStatus }> {
      const params: FindTransactionParams = {
         transaction_id
      };
      if (expiration) {
         params.expiration = expiration;
      }
      return this.call('find_transaction', params);
   }
}
