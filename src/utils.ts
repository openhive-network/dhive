/**
 * @file Misc utility functions.
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

import fetch from 'cross-fetch'
import { EventEmitter } from 'events'
import { PassThrough } from 'stream'

// TODO: Add more errors that should trigger a failover
const timeoutErrors = ['timeout', 'ENOTFOUND', 'ECONNREFUSED', 'database lock', 'CERT_HAS_EXPIRED', 'EHOSTUNREACH']

/**
 * Return a promise that will resove when a specific event is emitted.
 */
export function waitForEvent<T>(
  emitter: EventEmitter,
  eventName: string | symbol
): Promise<T> {
  return new Promise((resolve, reject) => {
    emitter.once(eventName, resolve)
  })
}

/**
 * Sleep for N milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

/**
 * Return a stream that emits iterator values.
 */
export function iteratorStream<T>(
  iterator: AsyncIterableIterator<T>
): NodeJS.ReadableStream {
  const stream = new PassThrough({ objectMode: true })
  const iterate = async () => {
    for await (const item of iterator) {
      if (!stream.write(item)) {
        await waitForEvent(stream, 'drain')
      }
    }
  }
  iterate()
    .then(() => {
      stream.end()
    })
    .catch((error) => {
      stream.emit('error', error)
      stream.end()
    })
  return stream
}

/**
 * Return a deep copy of a JSON-serializable object.
 */
export function copy<T>(object: T): T {
  return JSON.parse(JSON.stringify(object))
}

/**
 * Fetch API wrapper that retries until timeout is reached.
 */
export async function retryingFetch(
  currentAddress: string,
  allAddresses: string | string[],
  opts: any,
  timeout: number,
  failoverThreshold: number,
  consoleOnFailover: boolean,
  backoff: (tries: number) => number,
  fetchTimeout?: (tries: number) => number
) {
  let start = Date.now()
  let tries = 0
  let round = 0

  do {
    try {
      if (fetchTimeout) {
        opts.timeout = fetchTimeout(tries)
      }
      const response = await fetch(currentAddress, opts)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return { response: await response.json(), currentAddress }
    } catch (error) {
      if (timeout !== 0 && Date.now() - start > timeout) {
        if ((!error || !error.code) && Array.isArray(allAddresses)) {
          // If error is empty or not code is present, it means rpc is down => switch
          currentAddress = failover(
            currentAddress,
            allAddresses,
            currentAddress,
            consoleOnFailover
          )
        } else {
          const isFailoverError =
            timeoutErrors.filter(
              (fe) => error && error.code && error.code.includes(fe)
            ).length > 0
          if (
            isFailoverError &&
            Array.isArray(allAddresses) &&
            allAddresses.length > 1
          ) {
            if (round < failoverThreshold) {
              start = Date.now()
              tries = -1
              if (failoverThreshold > 0) {
                round++
              }
              currentAddress = failover(
                currentAddress,
                allAddresses,
                currentAddress,
                consoleOnFailover
              )
            } else {
              error.message = `[${
                error.code
              }] tried ${failoverThreshold} times with ${allAddresses.join(
                ','
              )}`
              throw error
            }
          } else {
            // tslint:disable-next-line: no-console
            console.error(
              `Didn't failover for error ${error.code ? 'code' : 'message'}: [${
                error.code || error.message
              }]`
            )
            throw error
          }
        }
      }
      await sleep(backoff(tries++))
    }
  } while (true)
}

const failover = (
  url: string,
  urls: string[],
  currentAddress: string,
  consoleOnFailover: boolean
) => {
  const index = urls.indexOf(url)
  const targetUrl = urls.length === index + 1 ? urls[0] : urls[index + 1]
  if (consoleOnFailover) {
    // tslint:disable-next-line: no-console
    console.log(`Switched Hive RPC: ${targetUrl} (previous: ${currentAddress})`)
  }
  return targetUrl
}

// Hack to be able to generate a valid witness_set_properties op
// Can hopefully be removed when hived's JSON representation is fixed
import * as ByteBuffer from 'bytebuffer'
import { Asset, PriceType } from './chain/asset'
import { WitnessSetPropertiesOperation } from './chain/operation'
import { Serializer, Types } from './chain/serializer'
import { PublicKey } from './crypto'
export interface WitnessProps {
  account_creation_fee?: string | Asset
  account_subsidy_budget?: number // uint32_t
  account_subsidy_decay?: number // uint32_t
  key: PublicKey | string
  maximum_block_size?: number // uint32_t
  new_signing_key?: PublicKey | string | null
  hbd_exchange_rate?: PriceType
  hbd_interest_rate?: number // uint16_t
  url?: string
}
function serialize(serializer: Serializer, data: any) {
  const buffer = new ByteBuffer(
    ByteBuffer.DEFAULT_CAPACITY,
    ByteBuffer.LITTLE_ENDIAN
  )
  serializer(buffer, data)
  buffer.flip()
  // `props` values must be hex
  return buffer.toString('hex')
  // return Buffer.from(buffer.toBuffer());
}
export function buildWitnessUpdateOp(
  owner: string,
  props: WitnessProps
): WitnessSetPropertiesOperation {
  const data: WitnessSetPropertiesOperation[1] = {
    extensions: [],
    owner,
    props: []
  }
  for (const key of Object.keys(props)) {
    let type: Serializer
    switch (key) {
      case 'key':
      case 'new_signing_key':
        type = Types.PublicKey
        break
      case 'account_subsidy_budget':
      case 'account_subsidy_decay':
      case 'maximum_block_size':
        type = Types.UInt32
        break
      case 'hbd_interest_rate':
        type = Types.UInt16
        break
      case 'url':
        type = Types.String
        break
      case 'hbd_exchange_rate':
        type = Types.Price
        break
      case 'account_creation_fee':
        type = Types.Asset
        break
      default:
        throw new Error(`Unknown witness prop: ${key}`)
    }
    data.props.push([key, serialize(type, props[key])])
  }
  data.props.sort((a, b) => a[0].localeCompare(b[0]))
  return ['witness_set_properties', data]
}

const JSBI = require('jsbi')
export const operationOrders = {
  vote: 0,
  // tslint:disable-next-line: object-literal-sort-keys
  comment: 1,
  transfer: 2,
  transfer_to_vesting: 3,
  withdraw_vesting: 4,
  limit_order_create: 5,
  limit_order_cancel: 6,
  feed_publish: 7,
  convert: 8,
  account_create: 9,
  account_update: 10,
  witness_update: 11,
  account_witness_vote: 12,
  account_witness_proxy: 13,
  pow: 14,
  custom: 15,
  report_over_production: 16,
  delete_comment: 17,
  custom_json: 18,
  comment_options: 19,
  set_withdraw_vesting_route: 20,
  limit_order_create2: 21,
  claim_account: 22,
  create_claimed_account: 23,
  request_account_recovery: 24,
  recover_account: 25,
  change_recovery_account: 26,
  escrow_transfer: 27,
  escrow_dispute: 28,
  escrow_release: 29,
  pow2: 30,
  escrow_approve: 31,
  transfer_to_savings: 32,
  transfer_from_savings: 33,
  cancel_transfer_from_savings: 34,
  custom_binary: 35,
  decline_voting_rights: 36,
  reset_account: 37,
  set_reset_account: 38,
  claim_reward_balance: 39,
  delegate_vesting_shares: 40,
  account_create_with_delegation: 41,
  witness_set_properties: 42,
  account_update2: 43,
  create_proposal: 44,
  update_proposal_votes: 45,
  remove_proposal: 46,
  update_proposal: 47,
  collateralized_convert: 48,
  recurrent_transfer: 49,
  // virtual ops
  fill_convert_request: 50,
  author_reward: 51,
  curation_reward: 52,
  comment_reward: 53,
  liquidity_reward: 54,
  interest: 55,
  fill_vesting_withdraw: 56,
  fill_order: 57,
  shutdown_witness: 58,
  fill_transfer_from_savings: 59,
  hardfork: 60,
  comment_payout_update: 61,
  return_vesting_delegation: 62,
  comment_benefactor_reward: 63,
  producer_reward: 64,
  clear_null_account_balance: 65,
  proposal_pay: 66,
  sps_fund: 67,
  hardfork_hive: 68,
  hardfork_hive_restore: 69,
  delayed_voting: 70,
  consolidate_treasury_balance: 71,
  effective_comment_vote: 72,
  ineffective_delete_comment: 73,
  sps_convert: 74,
  expired_account_notification: 75,
  changed_recovery_account: 76,
  transfer_to_vesting_completed: 77,
  pow_reward: 78,
  vesting_shares_split: 79,
  account_created: 80,
  fill_collateralized_convert_request: 81,
  system_warning: 82,
  fill_recurrent_transfer: 83,
  failed_recurrent_transfer: 84
}

/**
 * Make bitmask filter to be used with getAccountHistory call
 * @param allowedOperations Array of operations index numbers
 */
export function makeBitMaskFilter(allowedOperations: number[]) {
  return allowedOperations
    .reduce(redFunction, [JSBI.BigInt(0), JSBI.BigInt(0)])
    .map((value) =>
      JSBI.notEqual(value, JSBI.BigInt(0)) ? value.toString() : null
    )
}

const redFunction = ([low, high], allowedOperation) => {
  if (allowedOperation < 64) {
    return [
      JSBI.bitwiseOr(
        low,
        JSBI.leftShift(JSBI.BigInt(1), JSBI.BigInt(allowedOperation))
      ),
      high
    ]
  } else {
    return [
      low,
      JSBI.bitwiseOr(
        high,
        JSBI.leftShift(JSBI.BigInt(1), JSBI.BigInt(allowedOperation - 64))
      )
    ]
  }
}
