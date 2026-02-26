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
import { NodeHealthTracker } from './health-tracker'

// Errors that indicate the request never reached the server — safe to retry even for broadcasts
const PRE_CONNECTION_ERRORS = ['ECONNREFUSED', 'ENOTFOUND', 'EHOSTUNREACH', 'EAI_AGAIN']

// All errors that should trigger failover for read operations
const FAILOVER_ERRORS = [...PRE_CONNECTION_ERRORS, 'timeout', 'database lock', 'CERT_HAS_EXPIRED', 'ECONNRESET', 'ERR_TLS_CERT_ALTNAME_INVALID', 'ETIMEDOUT', 'EPIPE', 'EPROTO']

/**
 * Context for smart retry/failover decisions.
 */
export interface RetryContext {
  /** Health tracker instance for per-node, per-API tracking */
  healthTracker?: NodeHealthTracker
  /** The API being called (e.g. "bridge", "condenser_api", "database_api") */
  api?: string
  /** Whether this is a broadcast operation — never retry after request may have been received */
  isBroadcast?: boolean
  /** Whether to log failover events to console */
  consoleOnFailover?: boolean
}

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
 * Check if an error code indicates the request never reached the server.
 */
function isPreConnectionError(error: any): boolean {
  if (!error || !error.code) return false
  return PRE_CONNECTION_ERRORS.some((code) => error.code.includes(code))
}

/**
 * Check if an error should trigger failover for read operations.
 * Matches any known network/timeout error, or errors with no code (HTTP errors).
 */
function shouldFailover(error: any): boolean {
  if (!error) return true
  // HTTP errors (from !response.ok) have no .code — they should trigger failover
  if (!error.code) return true
  return FAILOVER_ERRORS.some((code) => error.code.includes(code))
}

/**
 * Get the next node in the ordered list (wraps around).
 */
function nextNode(nodes: string[], currentIndex: number): number {
  return (currentIndex + 1) % nodes.length
}

/**
 * Smart fetch with immediate failover and per-node health tracking.
 *
 * For read operations:
 * - On failure, immediately try the next healthy node (no backoff within a round)
 * - After trying all nodes once (one round), apply backoff before the next round
 * - Stop after failoverThreshold rounds
 *
 * For broadcast operations:
 * - Only retry on pre-connection errors (ECONNREFUSED, ENOTFOUND, etc.)
 *   where we know the request never reached the server
 * - NEVER retry after timeout or response errors to prevent double-broadcasting
 */
export async function retryingFetch(
  currentAddress: string,
  allAddresses: string | string[],
  opts: any,
  timeout: number,
  failoverThreshold: number,
  consoleOnFailover: boolean,
  backoff: (tries: number) => number,
  fetchTimeout?: (tries: number) => number,
  retryContext?: RetryContext
) {
  const { healthTracker, api, isBroadcast } = retryContext || {}
  const logFailover = retryContext?.consoleOnFailover ?? consoleOnFailover

  // Build ordered node list: healthy nodes first, then unhealthy as fallback
  let orderedNodes: string[]
  if (Array.isArray(allAddresses) && allAddresses.length > 1) {
    orderedNodes = healthTracker
      ? healthTracker.getOrderedNodes(allAddresses, api)
      : [...allAddresses]
  } else {
    orderedNodes = Array.isArray(allAddresses) ? allAddresses : [allAddresses]
  }

  // Always start from the healthiest node (index 0 of the ordered list).
  // The health tracker already sorted nodes with healthy ones first,
  // so starting from 0 ensures we use the best available node.
  let nodeIndex = 0

  const totalNodes = orderedNodes.length
  const startTime = Date.now()
  let nodesTriedInRound = 0
  let round = 0
  let lastError: any

  // tslint:disable-next-line: no-constant-condition
  while (true) {
    const node = orderedNodes[nodeIndex]

    try {
      if (fetchTimeout) {
        opts.timeout = fetchTimeout(nodesTriedInRound)
      }

      const response = await fetch(node, opts)

      if (!response.ok) {
        // Support for Drone: HTTP 500 with valid JSON-RPC response
        if (response.status === 500) {
          try {
            const resJson = await response.json()
            if (resJson.jsonrpc === '2.0') {
              if (healthTracker && api) healthTracker.recordSuccess(node, api)
              return { response: resJson, currentAddress: node }
            }
          } catch {
            // JSON parse failed, fall through to error handling
          }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const responseJson = await response.json()

      // Record success in health tracker
      if (healthTracker && api) {
        healthTracker.recordSuccess(node, api)
      }

      return { response: responseJson, currentAddress: node }

    } catch (error) {
      lastError = error

      // Record failure in health tracker
      if (healthTracker && api) {
        healthTracker.recordFailure(node, api)
      }

      // === BROADCAST SAFETY ===
      // For broadcasts, only retry if the request definitely never reached the server.
      // If there's any chance the server received it, throw immediately to prevent
      // double-broadcasting (e.g. double transfers, double votes).
      if (isBroadcast) {
        if (isPreConnectionError(error) && totalNodes > 1) {
          // Safe to try another node — request never left the client
          nodeIndex = nextNode(orderedNodes, nodeIndex)
          nodesTriedInRound++
          if (nodesTriedInRound >= totalNodes) {
            // Tried all nodes, give up for broadcasts
            throw error
          }
          if (logFailover) {
            // tslint:disable-next-line: no-console
            console.log(`Broadcast failover to: ${orderedNodes[nodeIndex]} (${error.code}, request never sent)`)
          }
          continue
        }
        // Timeout, HTTP error, or unknown error — request may have been received.
        // Do NOT retry. Throw immediately.
        throw error
      }

      // === READ OPERATION FAILOVER ===
      if (!shouldFailover(error)) {
        // Unrecognized error type — don't failover, throw immediately
        throw error
      }

      // Try next node immediately (no backoff within a round)
      if (totalNodes > 1) {
        nodeIndex = nextNode(orderedNodes, nodeIndex)
        nodesTriedInRound++

        if (nodesTriedInRound >= totalNodes) {
          // Completed a full round through all nodes
          nodesTriedInRound = 0

          // failoverThreshold=0 means retry forever (only timeout can stop it)
          if (failoverThreshold > 0) {
            round++
            if (round >= failoverThreshold) {
              error.message = `All ${totalNodes} nodes failed after ${failoverThreshold} rounds. ` +
                `Last error: [${error.code || 'HTTP'}] ${error.message}. ` +
                `Nodes: ${orderedNodes.join(', ')}`
              throw error
            }
          }

          // Check total timeout before starting next round
          if (timeout !== 0 && Date.now() - startTime > timeout) {
            throw error
          }

          // Backoff between rounds (not between individual node attempts)
          await sleep(backoff(round))
        }

        if (logFailover) {
          // tslint:disable-next-line: no-console
          console.log(`Switched Hive RPC: ${orderedNodes[nodeIndex]} (previous: ${node}, error: ${error.code || error.message})`)
        }
      } else {
        // Single node: use backoff and retry same node (legacy behavior)
        if (timeout !== 0 && Date.now() - startTime > timeout) {
          throw error
        }
        await sleep(backoff(nodesTriedInRound++))
      }
    }
  }
}

// Hack to be able to generate a valid witness_set_properties op
// Can hopefully be removed when hived's JSON representation is fixed
import * as ByteBuffer from '@ecency/bytebuffer'
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

const serialize = (serializer: Serializer, data: any) => {
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

export const buildWitnessUpdateOp = (
  owner: string,
  props: WitnessProps
): WitnessSetPropertiesOperation => {
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
