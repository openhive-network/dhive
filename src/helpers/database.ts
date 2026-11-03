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
 *
 * Hivemind serves only `blog`, `comments`, `created`, `feed`, `hot` and `trending`
 * (`get_condenser_api_method` in hivemind's
 * `hive/db/sql_scripts/postgrest/utilities/get_api_method.sql`). The other categories
 * were removed from the API and fail with a method-not-found error.
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

/**
 * Query for {@link DatabaseAPI.getDiscussions}, sent to hivemind's
 * `condenser_api.get_discussions_by_*`.
 *
 * Hivemind validates the query with `validate_json_arguments`
 * (`hive/db/sql_scripts/postgrest/utilities/validate_json_arguments.sql`) against the
 * keys each endpoint accepts: `condenser_api_get_discussions_by` for
 * `created`/`hot`/`trending`, `condenser_api_get_discussions_by_blog_or_feed` for
 * `blog`/`feed` and `condenser_api_get_discussions_by_comments` for `comments`, all in
 * `hive/db/sql_scripts/postgrest/condenser_api/`. A key it does not accept fails with
 * `got an unexpected keyword argument '<key>'`, except that the check is skipped when
 * fewer recognized keys than the endpoint requires (2 for `created`/`hot`/`trending`,
 * 1 for the others) are passed; the unknown key is then silently ignored.
 */
export interface DisqussionQuery {
  /**
   * For `created`, `hot` and `trending`: the tag or community (`hive-NNNNNN`) to list;
   * omit or pass `''` for all posts.
   * For `blog` and `feed`: the account whose blog or feed to list; required.
   * Not accepted for `comments` (rejected as an unexpected keyword); use `start_author`.
   */
  tag?: string
  /**
   * Number of results, default 20. Hivemind rejects values outside 1 to its
   * `hivemind_app.max_posts_per_call` setting, which defaults to 20
   * (`get_max_posts_per_call_limit` in `utilities/api_limits.sql`).
   */
  limit: number
  /**
   * Not supported. Hivemind rejects any value, including `[]`, with
   * `filter_tags not supported`.
   */
  filter_tags?: string[]
  /**
   * Not supported. Hivemind does not accept this key and rejects it as an
   * unexpected keyword argument.
   */
  select_authors?: string[]
  /**
   * Not supported. Hivemind does not accept this key and rejects it as an
   * unexpected keyword argument.
   */
  select_tags?: string[]
  /**
   * Number of characters of each post body to return, default 0 (whole body).
   */
  truncate_body?: number
  /**
   * Author of the post to start from, used for paging; the post must exist.
   * Should be used in conjunction with `start_permlink`.
   * For `comments` this is required and names the account whose comments to list.
   */
  start_author?: string
  /**
   * Permalink of post to start from, used for paging.
   * Should be used in conjunction with `start_author`.
   * For `comments`, omit it to start from the newest comment.
   */
  start_permlink?: string
  /**
   * Not supported. Hivemind does not accept this key and rejects it as an
   * unexpected keyword argument.
   */
  parent_author?: string
  /**
   * Not supported. Hivemind does not accept this key and rejects it as an
   * unexpected keyword argument.
   */
  parent_permlink?: string
}

/**
 * Chain state queries.
 *
 * Despite its name, every method of this helper, including {@link DatabaseAPI.call},
 * calls `condenser_api`, not `database_api`. Call `database_api` methods with
 * {@link Client.call}, e.g.
 * `client.call('database_api', 'find_accounts', { accounts: ['alice'] })`.
 */
export class DatabaseAPI {
  constructor(readonly client: Client) {}

  /**
   * Convenience for calling `condenser_api`, which takes positional `params`.
   * To call a `database_api` method use
   * `client.call('database_api', method, params)` instead.
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
   * @deprecated Use `client.block.getBlockHeader`, which reads `block_api`
   * (served by HAfAH on HAF API nodes) and returns the `block_api` format.
   */
  public getBlockHeader(blockNum: number): Promise<BlockHeader> {
    return this.call('get_block_header', [blockNum])
  }

  /**
   * Return block *blockNum*.
   * @deprecated Use `client.block.getBlock`, which reads `block_api`
   * (served by HAfAH on HAF API nodes) and returns the `block_api` format.
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
