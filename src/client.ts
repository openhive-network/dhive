/**
 * @file Hive RPC client implementation.
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

import * as assert from 'assert'
import { VError } from 'verror'
import packageVersion from './version'

import { Blockchain } from './helpers/blockchain'
import { BroadcastAPI } from './helpers/broadcast'
import { DatabaseAPI } from './helpers/database'
import { HivemindAPI } from './helpers/hivemind'
import {AccountByKeyAPI} from './helpers/key'
import { RCAPI } from './helpers/rc'
import {TransactionStatusAPI} from './helpers/transaction'
import { copy, retryingFetch, waitForEvent } from './utils'

/**
 * Library version.
 */
export const VERSION = packageVersion

/**
 * Main Hive network chain id.
 */
export const DEFAULT_CHAIN_ID = Buffer.from(
    'beeab0de00000000000000000000000000000000000000000000000000000000',
    'hex'
)

/**
 * Main Hive network address prefix.
 */
export const DEFAULT_ADDRESS_PREFIX = 'STM'

interface RPCRequest {
    /**
     * Request sequence number.
     */
    id: number | string
    /**
     * RPC method.
     */
    method: 'call' | 'notice' | 'callback'
    /**
     * Array of parameters to pass to the method.
     */
    jsonrpc: '2.0'
    params: any[]
}

interface RPCCall extends RPCRequest {
    method: 'call' | any
    /**
     * 1. API to call, you can pass either the numerical id of the API you get
     *    from calling 'get_api_by_name' or the name directly as a string.
     * 2. Method to call on that API.
     * 3. Arguments to pass to the method.
     */
    params: [number | string, string, any[]]
}

interface RPCError {
    code: number
    message: string
    data?: any
}

interface RPCResponse {
    /**
     * Response sequence number, corresponding to request sequence number.
     */
    id: number
    error?: RPCError
    result?: any
}

interface PendingRequest {
    request: RPCRequest
    timer: NodeJS.Timer | undefined
    resolve: (response: any) => void
    reject: (error: Error) => void
}

/**
 * RPC Client options
 * ------------------
 */
export interface ClientOptions {
    /**
     * Hive chain id. Defaults to main hive network:
     * need the new id?
     * `beeab0de00000000000000000000000000000000000000000000000000000000`
     *
     */
    chainId?: string
    /**
     * Hive address prefix. Defaults to main network:
     * `STM`
     */
    addressPrefix?: string
    /**
     * Send timeout, how long to wait in milliseconds before giving
     * up on a rpc call. Note that this is not an exact timeout,
     * no in-flight requests will be aborted, they will just not
     * be retried any more past the timeout.
     * Can be set to 0 to retry forever. Defaults to 60 * 1000 ms.
     */
    timeout?: number

    /**
     * Specifies the amount of times the urls (RPC nodes) should be
     * iterated and retried in case of timeout errors.
     * (important) Requires url parameter to be an array (string[])!
     * Can be set to 0 to iterate and retry forever. Defaults to 3 rounds.
     */
    failoverThreshold?: number

    /**
     * Whether a console.log should be made when RPC failed over to another one
     */
    consoleOnFailover?: boolean

    /**
     * Retry backoff function, returns milliseconds. Default = {@link defaultBackoff}.
     */
    backoff?: (tries: number) => number
    /**
     * Node.js http(s) agent, use if you want http keep-alive.
     * Defaults to using https.globalAgent.
     * @see https://nodejs.org/api/http.html#http_new_agent_options.
     */
    agent?: any // https.Agent
    /**
     * Deprecated - don't use
     */
    rebrandedApi?: boolean
}

/**
 * RPC Client
 * ----------
 * Can be used in both node.js and the browser. Also see {@link ClientOptions}.
 */
export class Client {
    /**
     * Client options, *read-only*.
     */
    public readonly options: ClientOptions

    /**
     * Address to Hive RPC server.
     * String or String[] *read-only*
     */
    public address: string | string[]

    /**
     * Database API helper.
     */
    public readonly database: DatabaseAPI

    /**
     * RC API helper.
     */
    public readonly rc: RCAPI

    /**
     * Broadcast API helper.
     */
    public readonly broadcast: BroadcastAPI

    /**
     * Blockchain helper.
     */
    public readonly blockchain: Blockchain

    /**
     * Hivemind helper.
     */
    public readonly hivemind: HivemindAPI

    /**
     * Accounts by key API helper.
     */
    public readonly keys: AccountByKeyAPI

    /**
     * Transaction status API helper.
     */
    public readonly transaction: TransactionStatusAPI

    /**
     * Chain ID for current network.
     */
    public readonly chainId: Buffer

    /**
     * Address prefix for current network.
     */
    public readonly addressPrefix: string

    public currentAddress: string

    private timeout: number
    private backoff: typeof defaultBackoff

    private failoverThreshold: number

    private consoleOnFailover: boolean

    /**
     * @param address The address to the Hive RPC server,
     * e.g. `https://api.hive.blog`. or [`https://api.hive.blog`, `https://another.api.com`]
     * @param options Client options.
     */
    constructor(address: string | string[], options: ClientOptions = {}) {
        if (options.rebrandedApi) {
            // tslint:disable-next-line: no-console
            console.log('Warning: rebrandedApi is deprecated and safely can be removed from client options')
        }
        this.currentAddress = Array.isArray(address) ? address[0] : address
        this.address = address
        this.options = options

        this.chainId = options.chainId
            ? Buffer.from(options.chainId, 'hex')
            : DEFAULT_CHAIN_ID
        assert.equal(this.chainId.length, 32, 'invalid chain id')
        this.addressPrefix = options.addressPrefix || DEFAULT_ADDRESS_PREFIX

        this.timeout = options.timeout || 60 * 1000
        this.backoff = options.backoff || defaultBackoff
        this.failoverThreshold = options.failoverThreshold || 3
        this.consoleOnFailover = options.consoleOnFailover || false

        this.database = new DatabaseAPI(this)
        this.broadcast = new BroadcastAPI(this)
        this.blockchain = new Blockchain(this)
        this.rc = new RCAPI(this)
        this.hivemind = new HivemindAPI(this)
        this.keys = new AccountByKeyAPI(this)
        this.transaction = new TransactionStatusAPI(this)
    }

    /**
     * Create a new client instance configured for the testnet.
     */
    public static testnet(options?: ClientOptions) {
        let opts: ClientOptions = {}
        if (options) {
            opts = copy(options)
            opts.agent = options.agent
        }

        opts.addressPrefix = 'TST'
        opts.chainId = '18dcf0a285365fc58b71f18b3d3fec954aa0c141c44e4e5cb4cf777b9eab274e'
        return new Client('https://testnet.openhive.network', opts)
    }

    /**
     * Make a RPC call to the server.
     *
     * @param api     The API to call, e.g. `database_api`.
     * @param method  The API method, e.g. `get_dynamic_global_properties`.
     * @param params  Array of parameters to pass to the method, optional.
     *
     */
    public async call(
        api: string,
        method: string,
        params: any = []
    ): Promise<any> {
        const request: RPCCall = {
            id: 0,
            jsonrpc: '2.0',
            method: api + '.' + method,
            params
        }
        const body = JSON.stringify(request, (key, value) => {
            // encode Buffers as hex strings instead of an array of bytes
            if (value && typeof value === 'object' && value.type === 'Buffer') {
                return Buffer.from(value.data).toString('hex')
            }
            return value
        })
        const opts: any = {
            body,
            cache: 'no-cache',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json',
            },
            method: 'POST',
            mode: 'cors',
        }

        // Self is not defined within Node environments
        // This check is needed because the user agent cannot be set in a browser
        if (typeof self === undefined) {
            opts.headers = {
                'User-Agent': `dhive/${packageVersion}`
            }
        }

        if (this.options.agent) {
            opts.agent = this.options.agent
        }
        let fetchTimeout: any
        if (
            api !== 'network_broadcast_api' &&
            !method.startsWith('broadcast_transaction')
        ) {
            // bit of a hack to work around some nodes high error rates
            // only effective in node.js (until timeout spec lands in browsers)
            fetchTimeout = (tries) => (tries + 1) * 500
        }

        const { response, currentAddress }: { response: RPCResponse; currentAddress: string } =
            await retryingFetch(
                this.currentAddress,
                this.address,
                opts,
                this.timeout,
                this.failoverThreshold,
                this.consoleOnFailover,
                this.backoff,
                fetchTimeout
            )

        // After failover, change the currently active address
        if (currentAddress !== this.currentAddress) { this.currentAddress = currentAddress }
        // resolve FC error messages into something more readable
        if (response.error) {
            const formatValue = (value: any) => {
                switch (typeof value) {
                    case 'object':
                        return JSON.stringify(value)
                    default:
                        return String(value)
                }
            }
            const { data } = response.error
            let { message } = response.error
            if (data && data.stack && data.stack.length > 0) {
                const top = data.stack[0]
                const topData = copy(top.data)
                message = top.format.replace(
                    /\$\{([a-z_]+)\}/gi,
                    (match: string, key: string) => {
                        let rv = match
                        if (topData[key]) {
                            rv = formatValue(topData[key])
                            delete topData[key]
                        }
                        return rv
                    }
                )
                const unformattedData = Object.keys(topData)
                    .map((key) => ({ key, value: formatValue(topData[key]) }))
                    .map((item) => `${item.key}=${item.value}`)
                if (unformattedData.length > 0) {
                    message += ' ' + unformattedData.join(' ')
                }
            }
            throw new VError({ info: data, name: 'RPCError' }, message)
        }
        assert.equal(response.id, request.id, 'got invalid response id')
        return response.result
    }

    public updateOperations(rebrandedApi) {
        // tslint:disable-next-line: no-console
        console.log('Warning: call to updateOperations() is deprecated and can safely be removed')
    }
}

/**
 * Default backoff function.
 * ```min(tries*10^2, 10 seconds)```
 */
const defaultBackoff = (tries: number): number =>
    Math.min(Math.pow(tries * 10, 2), 10 * 1000)
