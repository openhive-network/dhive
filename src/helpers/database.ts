/**
 * @file Database API helpers.
 * @author Johan Nordberg <code@johan-nordberg.com>
 * @license
 * Copyright (c) 2017 Johan Nordberg. All Rights Reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 *  1. Redistribution of source code must retain the above copyright notice, this
 *     list of conditions and the following disclaimer.
 *
 *  2. Redistribution in binary form must reproduce the above copyright notice,
 *     this list of conditions and the following disclaimer in the documentation
 *     and/or other materials provided with the distribution.
 *
 *  3. Neither the name of the copyright holder nor the names of its contributors
 *     may be used to endorse or promote products derived from this software without
 *     specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
 * BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
 * OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
 * OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * You acknowledge that this software is not designed, licensed or intended for use
 * in the design, construction, operation or maintenance of any military facility.
 */

import { ExtendedAccount } from '../chain/account'
import { Price } from '../chain/asset'
import { BlockHeader, SignedBlock } from '../chain/block'
import { Discussion } from '../chain/comment'
import { DynamicGlobalProperties } from '../chain/misc'
import { ChainProperties, VestingDelegation } from '../chain/misc'
import { AppliedOperation } from '../chain/operation'
import {
  SignedTransaction,
  TransactionConfirmation
} from '../chain/transaction'
import { Client } from './../client'

/**
 * Possible categories for `get_discussions_by_*`.
 */
export type DiscussionQueryCategory =
  | 'active'
  | 'blog'
  | 'cashout'
  | 'children'
  | 'comments'
  | 'feed'
  | 'hot'
  | 'promoted'
  | 'trending'
  | 'votes'
  | 'created'

export interface DisqussionQuery {
  /**
   * Name of author or tag to fetch.
   */
  tag?: string
  /**
   * Number of results, max 100.
   */
  limit: number
  filter_tags?: string[]
  select_authors?: string[]
  select_tags?: string[]
  /**
   * Number of bytes of post body to fetch, default 0 (all)
   */
  truncate_body?: number
  /**
   * Name of author to start from, used for paging.
   * Should be used in conjunction with `start_permlink`.
   */
  start_author?: string
  /**
   * Permalink of post to start from, used for paging.
   * Should be used in conjunction with `start_author`.
   */
  start_permlink?: string
  parent_author?: string
  parent_permlink?: string
}

export class DatabaseAPI {
  constructor(readonly client: Client) {}

  /**
   * Convenience for calling `database_api`.
   */
  public call(method: string, params?: any[]) {
    return this.client.call('condenser_api', method, params)
  }

  /**
   * Return state of server.
   */
  public getDynamicGlobalProperties(): Promise<DynamicGlobalProperties> {
    return this.call('get_dynamic_global_properties')
  }

  /**
   * Return median chain properties decided by witness.
   */
  public async getChainProperties(): Promise<ChainProperties> {
    return this.call('get_chain_properties')
  }

  /**
   * Return all of the state required for a particular url path.
   * @param path Path component of url conforming to condenser's scheme
   *             e.g. `@almost-digital` or `trending/travel`
   */
  public async getState(path: string): Promise<any> {
    return this.call('get_state', [path])
  }

  /**
   * Return median price in HBD for 1 HIVE as reported by the witnesses.
   */
  public async getCurrentMedianHistoryPrice(): Promise<Price> {
    return Price.from(await this.call('get_current_median_history_price'))
  }

  /**
   * Get list of delegations made by account.
   * @param account Account delegating
   * @param from Delegatee start offset, used for paging.
   * @param limit Number of results, max 1000.
   */
  public async getVestingDelegations(
    account: string,
    from = '',
    limit = 1000
  ): Promise<VestingDelegation[]> {
    return this.call('get_vesting_delegations', [account, from, limit])
  }

  /**
   * Return server config. See:
   * https://github.com/steemit/steem/blob/master/libraries/protocol/include/steemit/protocol/config.hpp
   */
  public getConfig(): Promise<{ [name: string]: string | number | boolean }> {
    return this.call('get_config')
  }

  /**
   * Return header for *blockNum*.
   */
  public getBlockHeader(blockNum: number): Promise<BlockHeader> {
    return this.call('get_block_header', [blockNum])
  }

  /**
   * Return block *blockNum*.
   */
  public getBlock(blockNum: number): Promise<SignedBlock> {
    return this.call('get_block', [blockNum])
  }

  /**
   * Return all applied operations in *blockNum*.
   */
  public getOperations(
    blockNum: number,
    onlyVirtual = false
  ): Promise<AppliedOperation[]> {
    return this.call('get_ops_in_block', [blockNum, onlyVirtual])
  }

  /**
   * Return array of discussions (a.k.a. posts).
   * @param by The type of sorting for the discussions, valid options are:
   *           `active` `blog` `cashout` `children` `comments` `created`
   *           `feed` `hot` `promoted` `trending` `votes`. Note that
   *           for `blog` and `feed` the tag is set to a username.
   */
  public getDiscussions(
    by: DiscussionQueryCategory,
    query: DisqussionQuery
  ): Promise<Discussion[]> {
    return this.call(`get_discussions_by_${by}`, [query])
  }

  /**
   * Return array of account info objects for the usernames passed.
   * @param usernames The accounts to fetch.
   */
  public getAccounts(usernames: string[]): Promise<ExtendedAccount[]> {
    return this.call('get_accounts', [usernames])
  }

  /**
   * Returns the details of a transaction based on a transaction id.
   */
  public async getTransaction(txId: string): Promise<SignedTransaction> {
    return this.call('get_transaction', [txId])
  }

  /**
   * Returns one or more account history objects for account operations
   *
   * @param account The account to fetch
   * @param from The starting index
   * @param limit The maximum number of results to return
   * @param operations_bitmask Generated by dhive.utils.makeBitMaskFilter() - see example below
   * @example
   * const op = dhive.utils.operationOrders
   * const operationsBitmask = dhive.utils.makeBitMaskFilter([
   *   op.transfer,
   *   op.transfer_to_vesting,
   *   op.withdraw_vesting,
   *   op.interest,
   *   op.liquidity_reward,
   *   op.transfer_to_savings,
   *   op.transfer_from_savings,
   *   op.escrow_transfer,
   *   op.cancel_transfer_from_savings,
   *   op.escrow_approve,
   *   op.escrow_dispute,
   *   op.escrow_release,
   *   op.fill_convert_request,
   *   op.fill_order,
   *   op.claim_reward_balance,
   * ])
   */
  public getAccountHistory(
    account: string,
    from: number,
    limit: number,
    operation_bitmask?: [number, number]
  ): Promise<[[number, AppliedOperation]]> {
    let params = [account, from, limit]
    if (operation_bitmask && Array.isArray(operation_bitmask)) {
      if (operation_bitmask.length !== 2) {
        throw Error(
          'operation_bitmask should be generated by the helper function'
        )
      }
      params = params.concat(operation_bitmask)
    }
    return this.call('get_account_history', params)
  }

  /**
   * Verify signed transaction.
   */
  public async verifyAuthority(stx: SignedTransaction): Promise<boolean> {
    return this.call('verify_authority', [stx])
  }

  /** return rpc node version */
  public async getVersion(): Promise<object> {
    return this.call('get_version', [])
  }
}
