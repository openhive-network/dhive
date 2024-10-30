declare module 'dhive/version' {
	 const _default: string;
	export default _default;

}
declare module 'dhive/chain/asset' {
	/**
	 * @file Hive asset type definitions and helpers.
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
	export interface SMTAsset {
	    amount: string | number;
	    precision: number;
	    nai: string;
	}
	/**
	 * Asset symbol string.
	 */
	export type AssetSymbol = 'HIVE' | 'VESTS' | 'HBD' | 'TESTS' | 'TBD' | 'STEEM' | 'SBD';
	/**
	 * Class representing a hive asset, e.g. `1.000 HIVE` or `12.112233 VESTS`.
	 */
	export class Asset {
	    readonly amount: number;
	    readonly symbol: AssetSymbol;
	    constructor(amount: number, symbol: AssetSymbol);
	    /**
	     * Create a new Asset instance from a string, e.g. `42.000 HIVE`.
	     */
	    static fromString(string: string, expectedSymbol?: AssetSymbol): Asset;
	    /**
	     * Convenience to create new Asset.
	     * @param symbol Symbol to use when created from number. Will also be used to validate
	     *               the asset, throws if the passed value has a different symbol than this.
	     */
	    static from(value: string | Asset | number, symbol?: AssetSymbol): Asset;
	    /**
	     * Return the smaller of the two assets.
	     */
	    static min(a: Asset, b: Asset): Asset;
	    /**
	     * Return the larger of the two assets.
	     */
	    static max(a: Asset, b: Asset): Asset;
	    /**
	     * Return asset precision.
	     */
	    getPrecision(): number;
	    /**
	     * returns a representation of this asset using only STEEM SBD for
	     * legacy purposes
	     */
	    steem_symbols(): Asset;
	    /**
	     * Return a string representation of this asset, e.g. `42.000 HIVE`.
	     */
	    toString(): string;
	    /**
	     * Return a new Asset instance with amount added.
	     */
	    add(amount: Asset | string | number): Asset;
	    /**
	     * Return a new Asset instance with amount subtracted.
	     */
	    subtract(amount: Asset | string | number): Asset;
	    /**
	     * Return a new Asset with the amount multiplied by factor.
	     */
	    multiply(factor: Asset | string | number): Asset;
	    /**
	     * Return a new Asset with the amount divided.
	     */
	    divide(divisor: Asset | string | number): Asset;
	    /**
	     * For JSON serialization, same as toString().
	     */
	    toJSON(): string;
	}
	export type PriceType = Price | {
	    base: Asset | string;
	    quote: Asset | string;
	};
	/**
	 * Represents quotation of the relative value of asset against another asset.
	 * Similar to 'currency pair' used to determine value of currencies.
	 *
	 *  For example:
	 *  1 EUR / 1.25 USD where:
	 *  1 EUR is an asset specified as a base
	 *  1.25 USD us an asset specified as a qute
	 *
	 *  can determine value of EUR against USD.
	 */
	export class Price {
	    readonly base: Asset;
	    readonly quote: Asset;
	    /**
	     * @param base  - represents a value of the price object to be expressed relatively to quote
	     *                asset. Cannot have amount == 0 if you want to build valid price.
	     * @param quote - represents an relative asset. Cannot have amount == 0, otherwise
	     *                asertion fail.
	     *
	     * Both base and quote shall have different symbol defined.
	     */
	    constructor(base: Asset, quote: Asset);
	    /**
	     * Convenience to create new Price.
	     */
	    static from(value: PriceType): Price;
	    /**
	     * Return a string representation of this price pair.
	     */
	    toString(): string;
	    /**
	     * Return a new Asset with the price converted between the symbols in the pair.
	     * Throws if passed asset symbol is not base or quote.
	     */
	    convert(asset: Asset): Asset;
	}

}
declare module 'dhive/chain/account' {
	/**
	 * @file Hive account type definitions.
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
	import { PublicKey } from 'dhive/crypto';
	import { Asset } from 'dhive/chain/asset';
	export interface AuthorityType {
	    weight_threshold: number;
	    account_auths: [string, number][];
	    key_auths: [string | PublicKey, number][];
	}
	export class Authority implements AuthorityType {
	    weight_threshold: number;
	    account_auths: [string, number][];
	    key_auths: [string | PublicKey, number][];
	    constructor({ weight_threshold, account_auths, key_auths }: AuthorityType);
	    /**
	     * Convenience to create a new instance from PublicKey or authority object.
	     */
	    static from(value: string | PublicKey | AuthorityType): Authority;
	}
	export interface Account {
	    id: number;
	    name: string;
	    owner: Authority;
	    active: Authority;
	    posting: Authority;
	    memo_key: string;
	    json_metadata: string;
	    posting_json_metadata: string;
	    proxy: string;
	    last_owner_update: string;
	    last_account_update: string;
	    created: string;
	    mined: boolean;
	    owner_challenged: boolean;
	    active_challenged: boolean;
	    last_owner_proved: string;
	    last_active_proved: string;
	    recovery_account: string;
	    reset_account: string;
	    last_account_recovery: string;
	    comment_count: number;
	    lifetime_vote_count: number;
	    post_count: number;
	    can_vote: boolean;
	    voting_power: number;
	    last_vote_time: string;
	    voting_manabar: {
	        current_mana: string | number;
	        last_update_time: number;
	    };
	    balance: string | Asset;
	    savings_balance: string | Asset;
	    hbd_balance: string | Asset;
	    hbd_seconds: string;
	    hbd_seconds_last_update: string;
	    hbd_last_interest_payment: string;
	    savings_hbd_balance: string | Asset;
	    savings_hbd_seconds: string;
	    savings_hbd_seconds_last_update: string;
	    savings_hbd_last_interest_payment: string;
	    savings_withdraw_requests: number;
	    reward_hbd_balance: string | Asset;
	    reward_hive_balance: string | Asset;
	    reward_vesting_balance: string | Asset;
	    reward_vesting_hive: string | Asset;
	    curation_rewards: number | string;
	    posting_rewards: number | string;
	    vesting_shares: string | Asset;
	    delegated_vesting_shares: string | Asset;
	    received_vesting_shares: string | Asset;
	    vesting_withdraw_rate: string | Asset;
	    next_vesting_withdrawal: string;
	    withdrawn: number | string;
	    to_withdraw: number | string;
	    withdraw_routes: number;
	    proxied_vsf_votes: number[];
	    witnesses_voted_for: number;
	    average_bandwidth: number | string;
	    lifetime_bandwidth: number | string;
	    last_bandwidth_update: string;
	    average_market_bandwidth: number | string;
	    lifetime_market_bandwidth: number | string;
	    last_market_bandwidth_update: string;
	    last_post: string;
	    last_root_post: string;
	}
	export interface ExtendedAccount extends Account {
	    /**
	     * Convert vesting_shares to vesting hive.
	     */
	    vesting_balance: string | Asset;
	    reputation: string | number;
	    /**
	     * Transfer to/from vesting.
	     */
	    transfer_history: any[];
	    /**
	     * Limit order / cancel / fill.
	     */
	    market_history: any[];
	    post_history: any[];
	    vote_history: any[];
	    other_history: any[];
	    witness_votes: string[];
	    tags_usage: string[];
	    guest_bloggers: string[];
	    open_orders?: any[];
	    comments?: any[];
	    blog?: any[];
	    feed?: any[];
	    recent_replies?: any[];
	    recommended?: any[];
	}

}
declare module 'dhive/chain/misc' {
	/// <reference types="node" />
	/**
	 * @file Misc hive type definitions.
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
	import { Account } from 'dhive/chain/account';
	import { Asset, Price } from 'dhive/chain/asset';
	/**
	 * Large number that may be unsafe to represent natively in JavaScript.
	 */
	export type Bignum = string;
	/**
	 * Buffer wrapper that serializes to a hex-encoded string.
	 */
	export class HexBuffer {
	    buffer: Buffer;
	    constructor(buffer: Buffer);
	    /**
	     * Convenience to create a new HexBuffer, does not copy data if value passed is already a buffer.
	     */
	    static from(value: Buffer | HexBuffer | number[] | string): HexBuffer;
	    toString(encoding?: string): string;
	    toJSON(): string;
	}
	/**
	 * Chain roperties that are decided by the witnesses.
	 */
	export interface ChainProperties {
	    /**
	     * This fee, paid in HIVE, is converted into VESTING SHARES for the new account. Accounts
	     * without vesting shares cannot earn usage rations and therefore are powerless. This minimum
	     * fee requires all accounts to have some kind of commitment to the network that includes the
	     * ability to vote and make transactions.
	     *
	     * @note This has to be multiplied by STEEMIT ? `CREATE_ACCOUNT_WITH_HIVE_MODIFIER`
	     *       (defined as 30 on the main chain) to get the minimum fee needed to create an account.
	     *
	     */
	    account_creation_fee: string | Asset;
	    /**
	     * This witnesses vote for the maximum_block_size which is used by the network
	     * to tune rate limiting and capacity.
	     */
	    maximum_block_size: number;
	    /**
	     * The HBD interest percentage rate decided by witnesses, expressed 0 to 10000.
	     */
	    hbd_interest_rate: number;
	}
	export interface VestingDelegation {
	    /**
	     * Delegation id.
	     */
	    id: number;
	    /**
	     * Account that is delegating vests to delegatee.
	     */
	    delegator: string;
	    /**
	     * Account that is receiving vests from delegator.
	     */
	    delegatee: string;
	    /**
	     * Amount of VESTS delegated.
	     */
	    vesting_shares: Asset | string;
	    /**
	     * Earliest date delegation can be removed.
	     */
	    min_delegation_time: string;
	}
	/**
	 * Node state.
	 */
	export interface DynamicGlobalProperties {
	    id: number;
	    /**
	     * Current block height.
	     */
	    head_block_number: number;
	    head_block_id: string;
	    /**
	     * UTC Server time, e.g. 2020-01-15T00:42:00
	     */
	    time: string;
	    /**
	     * Currently elected witness.
	     */
	    current_witness: string;
	    /**
	     * The total POW accumulated, aka the sum of num_pow_witness at the time
	     * new POW is added.
	     */
	    total_pow: number;
	    /**
	     * The current count of how many pending POW witnesses there are, determines
	     * the difficulty of doing pow.
	     */
	    num_pow_witnesses: number;
	    virtual_supply: Asset | string;
	    current_supply: Asset | string;
	    /**
	     * Total asset held in confidential balances.
	     */
	    confidential_supply: Asset | string;
	    current_hbd_supply: Asset | string;
	    /**
	     * Total asset held in confidential balances.
	     */
	    confidential_hbd_supply: Asset | string;
	    total_vesting_fund_hive: Asset | string;
	    total_vesting_shares: Asset | string;
	    total_reward_fund_hive: Asset | string;
	    /**
	     * The running total of REWARD^2.
	     */
	    total_reward_shares2: string;
	    pending_rewarded_vesting_shares: Asset | string;
	    pending_rewarded_vesting_hive: Asset | string;
	    /**
	     * This property defines the interest rate that HBD deposits receive.
	     */
	    hbd_interest_rate: number;
	    hbd_print_rate: number;
	    /**
	     *  Average block size is updated every block to be:
	     *
	     *     average_block_size = (99 * average_block_size + new_block_size) / 100
	     *
	     *  This property is used to update the current_reserve_ratio to maintain
	     *  approximately 50% or less utilization of network capacity.
	     */
	    average_block_size: number;
	    /**
	     * Maximum block size is decided by the set of active witnesses which change every round.
	     * Each witness posts what they think the maximum size should be as part of their witness
	     * properties, the median size is chosen to be the maximum block size for the round.
	     *
	     * @note the minimum value for maximum_block_size is defined by the protocol to prevent the
	     * network from getting stuck by witnesses attempting to set this too low.
	     */
	    maximum_block_size: number;
	    /**
	     * The current absolute slot number. Equal to the total
	     * number of slots since genesis. Also equal to the total
	     * number of missed slots plus head_block_number.
	     */
	    current_aslot: number;
	    /**
	     * Used to compute witness participation.
	     */
	    recent_slots_filled: Bignum;
	    participation_count: number;
	    last_irreversible_block_num: number;
	    /**
	     * The maximum bandwidth the blockchain can support is:
	     *
	     *    max_bandwidth = maximum_block_size * BANDWIDTH_AVERAGE_WINDOW_SECONDS / BLOCK_INTERVAL
	     *
	     * The maximum virtual bandwidth is:
	     *
	     *    max_bandwidth * current_reserve_ratio
	     */
	    max_virtual_bandwidth: Bignum;
	    /**
	     * Any time average_block_size <= 50% maximum_block_size this value grows by 1 until it
	     * reaches MAX_RESERVE_RATIO.  Any time average_block_size is greater than
	     * 50% it falls by 1%.  Upward adjustments happen once per round, downward adjustments
	     * happen every block.
	     */
	    current_reserve_ratio: number;
	    /**
	     * The number of votes regenerated per day.  Any user voting slower than this rate will be
	     * "wasting" voting power through spillover; any user voting faster than this rate will have
	     * their votes reduced.
	     */
	    vote_power_reserve_rate: number;
	}
	/**
	 * Return the vesting share price.
	 */
	export function getVestingSharePrice(props: DynamicGlobalProperties): Price;
	/**
	 * Returns the vests of specified account. Default: Subtract delegated & add received
	 */
	export function getVests(account: Account, subtract_delegated?: boolean, add_received?: boolean): number;

}
declare module 'dhive/chain/serializer' {
	/**
	 * @file Hive protocol serialization.
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
	/// <reference types="node" />
	import * as ByteBuffer from 'bytebuffer';
	import { PublicKey } from 'dhive/crypto';
	import { Asset } from 'dhive/chain/asset';
	import { HexBuffer } from 'dhive/chain/misc';
	import { Operation } from 'dhive/chain/operation';
	export type Serializer = (buffer: ByteBuffer, data: any) => void;
	export const Types: {
	    Array: (itemSerializer: Serializer) => (buffer: ByteBuffer, data: any[]) => void;
	    Asset: (buffer: ByteBuffer, data: string | number | Asset) => void;
	    Authority: (buffer: ByteBuffer, data: {
	        [key: string]: any;
	    }) => void;
	    Binary: (size?: number | undefined) => (buffer: ByteBuffer, data: HexBuffer | Buffer) => void;
	    Boolean: (buffer: ByteBuffer, data: boolean) => void;
	    Date: (buffer: ByteBuffer, data: string) => void;
	    EncryptedMemo: (buffer: ByteBuffer, data: {
	        [key: string]: any;
	    }) => void;
	    FlatMap: (keySerializer: Serializer, valueSerializer: Serializer) => (buffer: ByteBuffer, data: [any, any][]) => void;
	    Int16: (buffer: ByteBuffer, data: number) => void;
	    Int32: (buffer: ByteBuffer, data: number) => void;
	    Int64: (buffer: ByteBuffer, data: number) => void;
	    Int8: (buffer: ByteBuffer, data: number) => void;
	    Object: (keySerializers: [string, Serializer][]) => (buffer: ByteBuffer, data: {
	        [key: string]: any;
	    }) => void;
	    Operation: (buffer: ByteBuffer, operation: Operation) => void;
	    Optional: (valueSerializer: Serializer) => (buffer: ByteBuffer, data: any) => void;
	    Price: (buffer: ByteBuffer, data: {
	        [key: string]: any;
	    }) => void;
	    PublicKey: (buffer: ByteBuffer, data: string | PublicKey | null) => void;
	    StaticVariant: (itemSerializers: Serializer[]) => (buffer: ByteBuffer, data: [number, any]) => void;
	    String: (buffer: ByteBuffer, data: string) => void;
	    Transaction: (buffer: ByteBuffer, data: {
	        [key: string]: any;
	    }) => void;
	    UInt16: (buffer: ByteBuffer, data: number) => void;
	    UInt32: (buffer: ByteBuffer, data: number) => void;
	    UInt64: (buffer: ByteBuffer, data: number) => void;
	    UInt8: (buffer: ByteBuffer, data: number) => void;
	    Void: (buffer: ByteBuffer) => never;
	};

}
declare module 'dhive/chain/transaction' {
	/**
	 * @file Hive transaction type definitions.
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
	import { Operation } from 'dhive/chain/operation';
	export interface Transaction {
	    ref_block_num: number;
	    ref_block_prefix: number;
	    expiration: string;
	    operations: Operation[];
	    extensions: any[];
	}
	export interface SignedTransaction extends Transaction {
	    signatures: string[];
	}
	export interface TransactionConfirmation {
	    id: string;
	    block_num: number;
	    trx_num: number;
	    expired: boolean;
	}

}
declare module 'dhive/crypto' {
	/**
	 * @file Hive crypto helpers.
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
	/// <reference types="node" />
	import * as ByteBuffer from '@ecency/bytebuffer';
	import { SignedTransaction, Transaction } from 'dhive/chain/transaction';
	/**
	 * Network id used in WIF-encoding.
	 */
	export const NETWORK_ID: Buffer; function ripemd160(input: Buffer | string): Buffer; function sha256(input: Buffer | string): Buffer; function doubleSha256(input: Buffer | string): Buffer; function encodePublic(key: Buffer, prefix: string): string; function encodePrivate(key: Buffer): string; function decodePrivate(encodedKey: string): Buffer; function isCanonicalSignature(signature: Buffer): boolean; function isWif(privWif: string | Buffer): boolean;
	/**
	 * ECDSA (secp256k1) public key.
	 */
	export class PublicKey {
	    readonly key: any;
	    readonly prefix: string;
	    readonly uncompressed: Buffer;
	    constructor(key: any, prefix?: string);
	    static fromBuffer(key: ByteBuffer): {
	        key: any;
	    };
	    /**
	     * Create a new instance from a WIF-encoded key.
	     */
	    static fromString(wif: string): PublicKey;
	    /**
	     * Create a new instance.
	     */
	    static from(value: string | PublicKey): PublicKey;
	    /**
	     * Verify a 32-byte signature.
	     * @param message 32-byte message to verify.
	     * @param signature Signature to verify.
	     */
	    verify(message: Buffer, signature: Signature): boolean;
	    /**
	     * Return a WIF-encoded representation of the key.
	     */
	    toString(): string;
	    /**
	     * Return JSON representation of this key, same as toString().
	     */
	    toJSON(): string;
	    /**
	     * Used by `utils.inspect` and `console.log` in node.js.
	     */
	    inspect(): string;
	}
	export type KeyRole = 'owner' | 'active' | 'posting' | 'memo';
	/**
	 * ECDSA (secp256k1) private key.
	 */
	export class PrivateKey {
	    private key;
	    secret: Buffer;
	    constructor(key: Buffer);
	    /**
	     * Convenience to create a new instance from WIF string or buffer.
	     */
	    static from(value: string | Buffer): PrivateKey;
	    /**
	     * Create a new instance from a WIF-encoded key.
	     */
	    static fromString(wif: string): PrivateKey;
	    /**
	     * Create a new instance from a seed.
	     */
	    static fromSeed(seed: string): PrivateKey;
	    /**
	     * Create key from username and password.
	     */
	    static fromLogin(username: string, password: string, role?: KeyRole): PrivateKey;
	    multiply(pub: any): Buffer;
	    /**
	     * Sign message.
	     * @param message 32-byte message.
	     */
	    sign(message: Buffer): Signature;
	    /**
	     * Derive the public key for this private key.
	     */
	    createPublic(prefix?: string): PublicKey;
	    /**
	     * Return a WIF-encoded representation of the key.
	     */
	    toString(): string;
	    /**
	     * Used by `utils.inspect` and `console.log` in node.js. Does not show the full key
	     * to get the full encoded key you need to explicitly call {@link toString}.
	     */
	    inspect(): string;
	    /**
	     * Get shared secret for memo cryptography
	     */
	    get_shared_secret(public_key: PublicKey): Buffer;
	}
	/**
	 * ECDSA (secp256k1) signature.
	 */
	export class Signature {
	    data: Buffer;
	    recovery: number;
	    constructor(data: Buffer, recovery: number);
	    static fromBuffer(buffer: Buffer): Signature;
	    static fromString(string: string): Signature;
	    /**
	     * Recover public key from signature by providing original signed message.
	     * @param message 32-byte message that was used to create the signature.
	     */
	    recover(message: Buffer, prefix?: string): PublicKey;
	    toBuffer(): Buffer;
	    toString(): string;
	} function transactionDigest(transaction: Transaction | SignedTransaction, chainId?: Buffer): Buffer; function signTransaction(transaction: Transaction, keys: PrivateKey | PrivateKey[], chainId?: Buffer): SignedTransaction; function generateTrxId(transaction: Transaction): string;
	/** Misc crypto utility functions. */
	export const cryptoUtils: {
	    decodePrivate: typeof decodePrivate;
	    doubleSha256: typeof doubleSha256;
	    encodePrivate: typeof encodePrivate;
	    encodePublic: typeof encodePublic;
	    generateTrxId: typeof generateTrxId;
	    isCanonicalSignature: typeof isCanonicalSignature;
	    isWif: typeof isWif;
	    ripemd160: typeof ripemd160;
	    sha256: typeof sha256;
	    signTransaction: typeof signTransaction;
	    transactionDigest: typeof transactionDigest;
	};
	export {};

}
declare module 'dhive/chain/block' {
	/**
	 * @file Hive block type definitions.
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
	import { Transaction } from 'dhive/chain/transaction';
	/**
	 * Unsigned block header.
	 */
	export interface BlockHeader {
	    previous: string;
	    timestamp: string;
	    witness: string;
	    transaction_merkle_root: string;
	    extensions: any[];
	}
	/**
	 * Signed block header.
	 */
	export interface SignedBlockHeader extends BlockHeader {
	    witness_signature: string;
	}
	/**
	 * Full signed block.
	 */
	export interface SignedBlock extends SignedBlockHeader {
	    block_id: string;
	    signing_key: string;
	    transaction_ids: string[];
	    transactions: Transaction[];
	}

}
declare module 'dhive/chain/comment' {
	/**
	 * @file Hive type definitions related to comments and posting.
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
	import { Asset } from 'dhive/chain/asset';
	export interface Comment {
	    id: number;
	    category: string;
	    parent_author: string;
	    parent_permlink: string;
	    author: string;
	    permlink: string;
	    title: string;
	    body: string;
	    json_metadata: string;
	    last_update: string;
	    created: string;
	    active: string;
	    last_payout: string;
	    depth: number;
	    children: number;
	    net_rshares: string;
	    abs_rshares: string;
	    vote_rshares: string;
	    children_abs_rshares: string;
	    cashout_time: string;
	    max_cashout_time: string;
	    total_vote_weight: number;
	    reward_weight: number;
	    total_payout_value: Asset | string;
	    curator_payout_value: Asset | string;
	    author_rewards: string;
	    net_votes: number;
	    root_comment: number;
	    max_accepted_payout: string;
	    percent_hbd: number;
	    allow_replies: boolean;
	    allow_votes: boolean;
	    allow_curation_rewards: boolean;
	    beneficiaries: BeneficiaryRoute[];
	}
	/**
	 * Discussion a.k.a. Post.
	 */
	export interface Discussion extends Comment {
	    url: string;
	    root_title: string;
	    pending_payout_value: Asset | string;
	    total_pending_payout_value: Asset | string;
	    active_votes: any[];
	    replies: string[];
	    author_reputation: number;
	    promoted: Asset | string;
	    body_length: string;
	    reblogged_by: any[];
	    first_reblogged_by?: any;
	    first_reblogged_on?: any;
	}
	export interface BeneficiaryRoute {
	    account: string;
	    weight: number;
	}

}
declare module 'dhive/chain/operation' {
	/**
	 * @file Hive operation type definitions.
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
	/// <reference types="node" />
	import { PublicKey } from 'dhive/crypto';
	import { AuthorityType } from 'dhive/chain/account';
	import { Asset, PriceType } from 'dhive/chain/asset';
	import { SignedBlockHeader } from 'dhive/chain/block';
	import { BeneficiaryRoute } from 'dhive/chain/comment';
	import { ChainProperties, HexBuffer } from 'dhive/chain/misc';
	/**
	 * Operation name.
	 * Ref: https://gitlab.syncad.com/hive/hive/-/blob/master/libraries/protocol/include/hive/protocol/operations.hpp
	 */
	export type OperationName = 'vote' | 'comment' | 'transfer' | 'transfer_to_vesting' | 'withdraw_vesting' | 'limit_order_create' | 'limit_order_cancel' | 'feed_publish' | 'convert' | 'account_create' | 'account_update' | 'witness_update' | 'account_witness_vote' | 'account_witness_proxy' | 'pow' | 'custom' | 'report_over_production' | 'delete_comment' | 'custom_json' | 'comment_options' | 'set_withdraw_vesting_route' | 'limit_order_create2' | 'claim_account' | 'create_claimed_account' | 'request_account_recovery' | 'recover_account' | 'change_recovery_account' | 'escrow_transfer' | 'escrow_dispute' | 'escrow_release' | 'pow2' | 'escrow_approve' | 'transfer_to_savings' | 'transfer_from_savings' | 'cancel_transfer_from_savings' | 'custom_binary' | 'decline_voting_rights' | 'reset_account' | 'set_reset_account' | 'claim_reward_balance' | 'delegate_vesting_shares' | 'account_create_with_delegation' | 'witness_set_properties' | 'account_update2' | 'create_proposal' | 'update_proposal_votes' | 'remove_proposal' | 'update_proposal' | 'collateralized_convert' | 'recurrent_transfer';
	/**
	 * Virtual operation name.
	 */
	export type VirtualOperationName = 'fill_convert_request' | 'author_reward' | 'curation_reward' | 'comment_reward' | 'liquidity_reward' | 'interest' | 'fill_vesting_withdraw' | 'fill_order' | 'shutdown_witness' | 'fill_transfer_from_savings' | 'hardfork' | 'comment_payout_update' | 'return_vesting_delegation' | 'comment_benefactor_reward' | 'producer_reward' | 'clear_null_account_balance' | 'proposal_pay' | 'sps_fund' | 'hardfork_hive' | 'hardfork_hive_restore' | 'delayed_voting' | 'consolidate_treasury_balance' | 'effective_comment_vote' | 'ineffective_delete_comment' | 'sps_convert' | 'expired_account_notification' | 'changed_recovery_account' | 'transfer_to_vesting_completed' | 'pow_reward' | 'vesting_shares_split' | 'account_created' | 'fill_collateralized_convert_request' | 'system_warning' | 'fill_recurrent_transfer' | 'failed_recurrent_transfer';
	/**
	 * Generic operation.
	 */
	export interface Operation {
	    0: OperationName | VirtualOperationName;
	    1: {
	        [key: string]: any;
	    };
	}
	export interface AppliedOperation {
	    trx_id: string;
	    block: number;
	    trx_in_block: number;
	    op_in_trx: number;
	    virtual_op: number;
	    timestamp: string;
	    op: Operation;
	}
	export interface AccountCreateOperation extends Operation {
	    0: 'account_create';
	    1: {
	        fee: string | Asset;
	        creator: string;
	        new_account_name: string;
	        owner: AuthorityType;
	        active: AuthorityType;
	        posting: AuthorityType;
	        memo_key: string | PublicKey;
	        json_metadata: string;
	    };
	}
	export interface AccountCreateWithDelegationOperation extends Operation {
	    0: 'account_create_with_delegation';
	    1: {
	        fee: string | Asset;
	        delegation: string | Asset;
	        creator: string;
	        new_account_name: string;
	        owner: AuthorityType;
	        active: AuthorityType;
	        posting: AuthorityType;
	        memo_key: string | PublicKey;
	        json_metadata: string;
	        /**
	         * Extensions. Not currently used.
	         */
	        extensions: any[];
	    };
	}
	export interface AccountUpdateOperation extends Operation {
	    0: 'account_update';
	    1: {
	        account: string;
	        owner?: AuthorityType;
	        active?: AuthorityType;
	        posting?: AuthorityType;
	        memo_key: string | PublicKey;
	        json_metadata: string;
	    };
	}
	export interface AccountWitnessProxyOperation extends Operation {
	    0: 'account_witness_proxy';
	    1: {
	        account: string;
	        proxy: string;
	    };
	}
	export interface AccountWitnessVoteOperation extends Operation {
	    0: 'account_witness_vote';
	    1: {
	        account: string;
	        witness: string;
	        approve: boolean;
	    };
	}
	export interface CancelTransferFromSavingsOperation extends Operation {
	    0: 'cancel_transfer_from_savings';
	    1: {
	        from: string;
	        request_id: number;
	    };
	}
	/**
	 * Each account lists another account as their recovery account.
	 * The recovery account has the ability to create account_recovery_requests
	 * for the account to recover. An account can change their recovery account
	 * at any time with a 30 day delay. This delay is to prevent
	 * an attacker from changing the recovery account to a malicious account
	 * during an attack. These 30 days match the 30 days that an
	 * owner authority is valid for recovery purposes.
	 *
	 * On account creation the recovery account is set either to the creator of
	 * the account (The account that pays the creation fee and is a signer on the transaction)
	 * or to the empty string if the account was mined. An account with no recovery
	 * has the top voted witness as a recovery account, at the time the recover
	 * request is created. Note: This does mean the effective recovery account
	 * of an account with no listed recovery account can change at any time as
	 * witness vote weights. The top voted witness is explicitly the most trusted
	 * witness according to stake.
	 */
	export interface ChangeRecoveryAccountOperation extends Operation {
	    0: 'change_recovery_account';
	    1: {
	        /**
	         * The account that would be recovered in case of compromise.
	         */
	        account_to_recover: string;
	        /**
	         * The account that creates the recover request.
	         */
	        new_recovery_account: string;
	        /**
	         * Extensions. Not currently used.
	         */
	        extensions: any[];
	    };
	}
	export interface ClaimRewardBalanceOperation extends Operation {
	    0: 'claim_reward_balance';
	    1: {
	        account: string;
	        reward_hive: string | Asset;
	        reward_hbd: string | Asset;
	        reward_vests: string | Asset;
	    };
	}
	export interface ClaimAccountOperation extends Operation {
	    0: 'claim_account';
	    1: {
	        creator: string;
	        fee: string | Asset;
	        /**
	         * Extensions. Not currently used.
	         */
	        extensions: any[];
	    };
	}
	export interface CommentOperation extends Operation {
	    0: 'comment';
	    1: {
	        parent_author: string;
	        parent_permlink: string;
	        author: string;
	        permlink: string;
	        title: string;
	        body: string;
	        json_metadata: string;
	    };
	}
	export interface CommentOptionsOperation extends Operation {
	    0: 'comment_options';
	    1: {
	        author: string;
	        permlink: string;
	        /** HBD value of the maximum payout this post will receive. */
	        max_accepted_payout: Asset | string;
	        /** The percent of Hive Dollars to key, unkept amounts will be received as Hive Power. */
	        percent_hbd: number;
	        /** Whether to allow post to receive votes. */
	        allow_votes: boolean;
	        /** Whether to allow post to recieve curation rewards. */
	        allow_curation_rewards: boolean;
	        extensions: [0, {
	            beneficiaries: BeneficiaryRoute[];
	        }][];
	    };
	}
	export interface ConvertOperation extends Operation {
	    0: 'convert';
	    1: {
	        owner: string;
	        requestid: number;
	        amount: Asset | string;
	    };
	}
	export interface CreateClaimedAccountOperation extends Operation {
	    0: 'create_claimed_account';
	    1: {
	        creator: string;
	        new_account_name: string;
	        owner: AuthorityType;
	        active: AuthorityType;
	        posting: AuthorityType;
	        memo_key: string | PublicKey;
	        json_metadata: string;
	        /**
	         * Extensions. Not currently used.
	         */
	        extensions: any[];
	    };
	}
	export interface CustomOperation extends Operation {
	    0: 'custom';
	    1: {
	        required_auths: string[];
	        id: number;
	        data: Buffer | HexBuffer | number[];
	    };
	}
	export interface CustomBinaryOperation extends Operation {
	    0: 'custom_binary';
	    1: {
	        required_owner_auths: string[];
	        required_active_auths: string[];
	        required_posting_auths: string[];
	        required_auths: AuthorityType[];
	        /**
	         * ID string, must be less than 32 characters long.
	         */
	        id: string;
	        data: Buffer | HexBuffer | number[];
	    };
	}
	export interface CustomJsonOperation extends Operation {
	    0: 'custom_json';
	    1: {
	        required_auths: string[];
	        required_posting_auths: string[];
	        /**
	         * ID string, must be less than 32 characters long.
	         */
	        id: string;
	        /**
	         * JSON encoded string, must be valid JSON.
	         */
	        json: string;
	    };
	}
	export interface DeclineVotingRightsOperation extends Operation {
	    0: 'decline_voting_rights';
	    1: {
	        account: string;
	        decline: boolean;
	    };
	}
	export interface DelegateVestingSharesOperation extends Operation {
	    0: 'delegate_vesting_shares';
	    1: {
	        /**
	         * The account delegating vesting shares.
	         */
	        delegator: string;
	        /**
	         * The account receiving vesting shares.
	         */
	        delegatee: string;
	        /**
	         * The amount of vesting shares delegated.
	         */
	        vesting_shares: string | Asset;
	    };
	}
	export interface DeleteCommentOperation extends Operation {
	    0: 'delete_comment';
	    1: {
	        author: string;
	        permlink: string;
	    };
	}
	/**
	 * The agent and to accounts must approve an escrow transaction for it to be valid on
	 * the blockchain. Once a part approves the escrow, the cannot revoke their approval.
	 * Subsequent escrow approve operations, regardless of the approval, will be rejected.
	 */
	export interface EscrowApproveOperation extends Operation {
	    0: 'escrow_approve';
	    1: {
	        from: string;
	        to: string;
	        agent: string;
	        /**
	         * Either to or agent.
	         */
	        who: string;
	        escrow_id: number;
	        approve: boolean;
	    };
	}
	/**
	 * If either the sender or receiver of an escrow payment has an issue, they can
	 * raise it for dispute. Once a payment is in dispute, the agent has authority over
	 * who gets what.
	 */
	export interface EscrowDisputeOperation extends Operation {
	    0: 'escrow_dispute';
	    1: {
	        from: string;
	        to: string;
	        agent: string;
	        who: string;
	        escrow_id: number;
	    };
	}
	/**
	 * This operation can be used by anyone associated with the escrow transfer to
	 * release funds if they have permission.
	 *
	 * The permission scheme is as follows:
	 * If there is no dispute and escrow has not expired, either party can release funds to the other.
	 * If escrow expires and there is no dispute, either party can release funds to either party.
	 * If there is a dispute regardless of expiration, the agent can release funds to either party
	 *    following whichever agreement was in place between the parties.
	 */
	export interface EscrowReleaseOperation extends Operation {
	    0: 'escrow_release';
	    1: {
	        from: string;
	        /**
	         * The original 'to'.
	         */
	        to: string;
	        agent: string;
	        /**
	         * The account that is attempting to release the funds, determines valid 'receiver'.
	         */
	        who: string;
	        /**
	         * The account that should receive funds (might be from, might be to).
	         */
	        receiver: string;
	        escrow_id: number;
	        /**
	         * The amount of hbd to release.
	         */
	        hbd_amount: Asset | string;
	        /**
	         * The amount of hive to release.
	         */
	        hive_amount: Asset | string;
	    };
	}
	/**
	 * The purpose of this operation is to enable someone to send money contingently to
	 * another individual. The funds leave the *from* account and go into a temporary balance
	 * where they are held until *from* releases it to *to* or *to* refunds it to *from*.
	 *
	 * In the event of a dispute the *agent* can divide the funds between the to/from account.
	 * Disputes can be raised any time before or on the dispute deadline time, after the escrow
	 * has been approved by all parties.
	 *
	 * This operation only creates a proposed escrow transfer. Both the *agent* and *to* must
	 * agree to the terms of the arrangement by approving the escrow.
	 *
	 * The escrow agent is paid the fee on approval of all parties. It is up to the escrow agent
	 * to determine the fee.
	 *
	 * Escrow transactions are uniquely identified by 'from' and 'escrow_id', the 'escrow_id' is defined
	 * by the sender.
	 */
	export interface EscrowTransferOperation extends Operation {
	    0: 'escrow_transfer';
	    1: {
	        from: string;
	        to: string;
	        agent: string;
	        escrow_id: number;
	        hbd_amount: Asset | string;
	        hive_amount: Asset | string;
	        fee: Asset | string;
	        ratification_deadline: string;
	        escrow_expiration: string;
	        json_meta: string;
	    };
	}
	export interface FeedPublishOperation extends Operation {
	    0: 'feed_publish';
	    1: {
	        publisher: string;
	        exchange_rate: PriceType;
	    };
	}
	/**
	 * Cancels an order and returns the balance to owner.
	 */
	export interface LimitOrderCancelOperation extends Operation {
	    0: 'limit_order_cancel';
	    1: {
	        owner: string;
	        orderid: number;
	    };
	}
	/**
	 * This operation creates a limit order and matches it against existing open orders.
	 */
	export interface LimitOrderCreateOperation extends Operation {
	    0: 'limit_order_create';
	    1: {
	        owner: string;
	        orderid: number;
	        amount_to_sell: Asset | string;
	        min_to_receive: Asset | string;
	        fill_or_kill: boolean;
	        expiration: string;
	    };
	}
	/**
	 * This operation is identical to limit_order_create except it serializes the price rather
	 * than calculating it from other fields.
	 */
	export interface LimitOrderCreate2Operation extends Operation {
	    0: 'limit_order_create2';
	    1: {
	        owner: string;
	        orderid: number;
	        amount_to_sell: Asset | string;
	        exchange_rate: PriceType;
	        fill_or_kill: boolean;
	        expiration: string;
	    };
	}
	/**
	 * Legacy proof of work operation.
	 */
	export interface PowOperation extends Operation {
	    0: 'pow';
	    1: {
	        worker_account: string;
	        block_id: any;
	        nonce: number;
	        work: any;
	        props: any;
	    };
	}
	/**
	 * Legacy equihash proof of work operation.
	 */
	export interface Pow2Operation extends Operation {
	    0: 'pow2';
	    1: {
	        work: any;
	        new_owner_key?: string | PublicKey;
	        props: any;
	    };
	}
	/**
	 * Recover an account to a new authority using a previous authority and verification
	 * of the recovery account as proof of identity. This operation can only succeed
	 * if there was a recovery request sent by the account's recover account.
	 *
	 * In order to recover the account, the account holder must provide proof
	 * of past ownership and proof of identity to the recovery account. Being able
	 * to satisfy an owner authority that was used in the past 30 days is sufficient
	 * to prove past ownership. The get_owner_history function in the database API
	 * returns past owner authorities that are valid for account recovery.
	 *
	 * Proving identity is an off chain contract between the account holder and
	 * the recovery account. The recovery request contains a new authority which
	 * must be satisfied by the account holder to regain control. The actual process
	 * of verifying authority may become complicated, but that is an application
	 * level concern, not a blockchain concern.
	 *
	 * This operation requires both the past and future owner authorities in the
	 * operation because neither of them can be derived from the current chain state.
	 * The operation must be signed by keys that satisfy both the new owner authority
	 * and the recent owner authority. Failing either fails the operation entirely.
	 *
	 * If a recovery request was made inadvertantly, the account holder should
	 * contact the recovery account to have the request deleted.
	 *
	 * The two setp combination of the account recovery request and recover is
	 * safe because the recovery account never has access to secrets of the account
	 * to recover. They simply act as an on chain endorsement of off chain identity.
	 * In other systems, a fork would be required to enforce such off chain state.
	 * Additionally, an account cannot be permanently recovered to the wrong account.
	 * While any owner authority from the past 30 days can be used, including a compromised
	 * authority, the account can be continually recovered until the recovery account
	 * is confident a combination of uncompromised authorities were used to
	 * recover the account. The actual process of verifying authority may become
	 * complicated, but that is an application level concern, not the blockchain's
	 * concern.
	 */
	export interface RecoverAccountOperation extends Operation {
	    0: 'recover_account';
	    1: {
	        /**
	         * The account to be recovered.
	         */
	        account_to_recover: string;
	        /**
	         * The new owner authority as specified in the request account recovery operation.
	         */
	        new_owner_authority: AuthorityType;
	        /**
	         * A previous owner authority that the account holder will use to prove
	         * past ownership of the account to be recovered.
	         */
	        recent_owner_authority: AuthorityType;
	        /**
	         * Extensions. Not currently used.
	         */
	        extensions: any[];
	    };
	}
	/**
	 * This operation is used to report a miner who signs two blocks
	 * at the same time. To be valid, the violation must be reported within
	 * MAX_WITNESSES blocks of the head block (1 round) and the
	 * producer must be in the ACTIVE witness set.
	 *
	 * Users not in the ACTIVE witness set should not have to worry about their
	 * key getting compromised and being used to produced multiple blocks so
	 * the attacker can report it and steel their vesting hive.
	 *
	 * The result of the operation is to transfer the full VESTING HIVE balance
	 * of the block producer to the reporter.
	 */
	export interface ReportOverProductionOperation extends Operation {
	    0: 'report_over_production';
	    1: {
	        reporter: string;
	        first_block: SignedBlockHeader;
	        second_block: SignedBlockHeader;
	    };
	}
	/**
	 * All account recovery requests come from a listed recovery account. This
	 * is secure based on the assumption that only a trusted account should be
	 * a recovery account. It is the responsibility of the recovery account to
	 * verify the identity of the account holder of the account to recover by
	 * whichever means they have agreed upon. The blockchain assumes identity
	 * has been verified when this operation is broadcast.
	 *
	 * This operation creates an account recovery request which the account to
	 * recover has 24 hours to respond to before the request expires and is
	 * invalidated.
	 *
	 * There can only be one active recovery request per account at any one time.
	 * Pushing this operation for an account to recover when it already has
	 * an active request will either update the request to a new new owner authority
	 * and extend the request expiration to 24 hours from the current head block
	 * time or it will delete the request. To cancel a request, simply set the
	 * weight threshold of the new owner authority to 0, making it an open authority.
	 *
	 * Additionally, the new owner authority must be satisfiable. In other words,
	 * the sum of the key weights must be greater than or equal to the weight
	 * threshold.
	 *
	 * This operation only needs to be signed by the the recovery account.
	 * The account to recover confirms its identity to the blockchain in
	 * the recover account operation.
	 */
	export interface RequestAccountRecoveryOperation extends Operation {
	    0: 'request_account_recovery';
	    1: {
	        /**
	         * The recovery account is listed as the recovery account on the account to recover.
	         */
	        recovery_account: string;
	        /**
	         * The account to recover. This is likely due to a compromised owner authority.
	         */
	        account_to_recover: string;
	        /**
	         * The new owner authority the account to recover wishes to have. This is secret
	         * known by the account to recover and will be confirmed in a recover_account_operation.
	         */
	        new_owner_authority: AuthorityType;
	        /**
	         * Extensions. Not currently used.
	         */
	        extensions: any[];
	    };
	}
	/**
	 * This operation allows recovery_account to change account_to_reset's owner authority to
	 * new_owner_authority after 60 days of inactivity.
	 */
	export interface ResetAccountOperation extends Operation {
	    0: 'reset_account';
	    1: {
	        reset_account: string;
	        account_to_reset: string;
	        new_owner_authority: AuthorityType;
	    };
	}
	/**
	 * This operation allows 'account' owner to control which account has the power
	 * to execute the 'reset_account_operation' after 60 days.
	 */
	export interface SetResetAccountOperation extends Operation {
	    0: 'set_reset_account';
	    1: {
	        account: string;
	        current_reset_account: string;
	        reset_account: string;
	    };
	}
	/**
	 * Allows an account to setup a vesting withdraw but with the additional
	 * request for the funds to be transferred directly to another account's
	 * balance rather than the withdrawing account. In addition, those funds
	 * can be immediately vested again, circumventing the conversion from
	 * vests to hive and back, guaranteeing they maintain their value.
	 */
	export interface SetWithdrawVestingRouteOperation extends Operation {
	    0: 'set_withdraw_vesting_route';
	    1: {
	        from_account: string;
	        to_account: string;
	        percent: number;
	        auto_vest: boolean;
	    };
	}
	/**
	 * Transfers asset from one account to another.
	 */
	export interface TransferOperation extends Operation {
	    0: 'transfer';
	    1: {
	        /**
	         * Sending account name.
	         */
	        from: string;
	        /**
	         * Receiving account name.
	         */
	        to: string;
	        /**
	         * Amount of HIVE or HBD to send.
	         */
	        amount: string | Asset;
	        /**
	         * Plain-text note attached to transaction.
	         */
	        memo: string;
	    };
	}
	export interface TransferFromSavingsOperation extends Operation {
	    0: 'transfer_from_savings';
	    1: {
	        from: string;
	        request_id: number;
	        to: string;
	        amount: string | Asset;
	        memo: string;
	    };
	}
	export interface TransferToSavingsOperation extends Operation {
	    0: 'transfer_to_savings';
	    1: {
	        amount: string | Asset;
	        from: string;
	        memo: string;
	        request_id: number;
	        to: string;
	    };
	}
	/**
	 * This operation converts HIVE into VFS (Vesting Fund Shares) at
	 * the current exchange rate. With this operation it is possible to
	 * give another account vesting shares so that faucets can
	 * pre-fund new accounts with vesting shares.
	 * (A.k.a. Powering Up)
	 */
	export interface TransferToVestingOperation extends Operation {
	    0: 'transfer_to_vesting';
	    1: {
	        from: string;
	        to: string;
	        /**
	         * Amount to power up, must be HIVE
	         */
	        amount: string | Asset;
	    };
	}
	export interface VoteOperation extends Operation {
	    0: 'vote';
	    1: {
	        voter: string;
	        author: string;
	        permlink: string;
	        /**
	         * Voting weight, 100% = 10000 (100_PERCENT).
	         */
	        weight: number;
	    };
	}
	/**
	 * At any given point in time an account can be withdrawing from their
	 * vesting shares. A user may change the number of shares they wish to
	 * cash out at any time between 0 and their total vesting stake.
	 *
	 * After applying this operation, vesting_shares will be withdrawn
	 * at a rate of vesting_shares/104 per week for two years starting
	 * one week after this operation is included in the blockchain.
	 *
	 * This operation is not valid if the user has no vesting shares.
	 * (A.k.a. Powering Down)
	 */
	export interface WithdrawVestingOperation extends Operation {
	    0: 'withdraw_vesting';
	    1: {
	        account: string;
	        /**
	         * Amount to power down, must be VESTS.
	         */
	        vesting_shares: string | Asset;
	    };
	}
	/**
	 * Users who wish to become a witness must pay a fee acceptable to
	 * the current witnesses to apply for the position and allow voting
	 * to begin.
	 *
	 * If the owner isn't a witness they will become a witness.  Witnesses
	 * are charged a fee equal to 1 weeks worth of witness pay which in
	 * turn is derived from the current share supply.  The fee is
	 * only applied if the owner is not already a witness.
	 *
	 * If the block_signing_key is null then the witness is removed from
	 * contention.  The network will pick the top 21 witnesses for
	 * producing blocks.
	 */
	export interface WitnessUpdateOperation extends Operation {
	    0: 'witness_update';
	    1: {
	        owner: string;
	        /**
	         * URL for witness, usually a link to a post in the witness-category tag.
	         */
	        url: string;
	        block_signing_key: string | PublicKey | null;
	        props: ChainProperties;
	        /**
	         * The fee paid to register a new witness, should be 10x current block production pay.
	         */
	        fee: string | Asset;
	    };
	}
	export interface WitnessSetPropertiesOperation extends Operation {
	    0: 'witness_set_properties';
	    1: {
	        owner: string;
	        props: [string, string][];
	        extensions: any[];
	    };
	}
	export interface AccountUpdate2Operation extends Operation {
	    0: 'account_update2';
	    1: {
	        account: string;
	        owner?: AuthorityType;
	        active?: AuthorityType;
	        posting?: AuthorityType;
	        memo_key?: string | PublicKey;
	        json_metadata: string;
	        posting_json_metadata: string;
	        extensions: any[];
	    };
	}
	export interface CreateProposalOperation extends Operation {
	    0: 'create_proposal';
	    1: {
	        creator: string;
	        receiver: string;
	        start_date: string;
	        end_date: string;
	        daily_pay: Asset | string;
	        subject: string;
	        permlink: string;
	        extensions: any[];
	    };
	}
	export interface UpdateProposalVotesOperation extends Operation {
	    0: 'update_proposal_votes';
	    1: {
	        voter: string;
	        proposal_ids: number[];
	        approve: boolean;
	        extensions: any[];
	    };
	}
	export interface RemoveProposalOperation extends Operation {
	    0: 'remove_proposal';
	    1: {
	        proposal_owner: string;
	        proposal_ids: number[];
	        extensions: any[];
	    };
	}
	export interface UpdateProposalOperation extends Operation {
	    0: 'update_proposal';
	    1: {
	        proposal_id: number;
	        creator: string;
	        daily_pay: Asset | string;
	        subject: string;
	        permlink: string;
	        extensions: any[];
	    };
	}
	export interface CollateralizedConvertOperation extends Operation {
	    0: 'collateralized_convert';
	    1: {
	        owner: string;
	        requestid: number;
	        amount: Asset | string;
	    };
	}
	export interface RecurrentTransferOperation extends Operation {
	    0: 'recurrent_transfer';
	    1: {
	        from: string;
	        to: string;
	        amount: Asset | string;
	        memo: string;
	        recurrence: number;
	        executions: number;
	        extensions: any[];
	    };
	}

}
declare module 'dhive/utils' {
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
	/// <reference types="node" />
	import { EventEmitter } from 'events';
	/**
	 * Return a promise that will resove when a specific event is emitted.
	 */
	export function waitForEvent<T>(emitter: EventEmitter, eventName: string | symbol): Promise<T>;
	/**
	 * Sleep for N milliseconds.
	 */
	export function sleep(ms: number): Promise<void>;
	/**
	 * Return a stream that emits iterator values.
	 */
	export function iteratorStream<T>(iterator: AsyncIterableIterator<T>): NodeJS.ReadableStream;
	/**
	 * Return a deep copy of a JSON-serializable object.
	 */
	export function copy<T>(object: T): T;
	/**
	 * Fetch API wrapper that retries until timeout is reached.
	 */
	export function retryingFetch(currentAddress: string, allAddresses: string | string[], opts: any, timeout: number, failoverThreshold: number, consoleOnFailover: boolean, backoff: (tries: number) => number, fetchTimeout?: (tries: number) => number): Promise<{
	    response: any;
	    currentAddress: string;
	}>;
	import { Asset, PriceType } from 'dhive/chain/asset';
	import { WitnessSetPropertiesOperation } from 'dhive/chain/operation';
	import { PublicKey } from 'dhive/crypto';
	export interface WitnessProps {
	    account_creation_fee?: string | Asset;
	    account_subsidy_budget?: number;
	    account_subsidy_decay?: number;
	    key: PublicKey | string;
	    maximum_block_size?: number;
	    new_signing_key?: PublicKey | string | null;
	    hbd_exchange_rate?: PriceType;
	    hbd_interest_rate?: number;
	    url?: string;
	}
	export const buildWitnessUpdateOp: (owner: string, props: WitnessProps) => WitnessSetPropertiesOperation;
	export const operationOrders: {
	    vote: number;
	    comment: number;
	    transfer: number;
	    transfer_to_vesting: number;
	    withdraw_vesting: number;
	    limit_order_create: number;
	    limit_order_cancel: number;
	    feed_publish: number;
	    convert: number;
	    account_create: number;
	    account_update: number;
	    witness_update: number;
	    account_witness_vote: number;
	    account_witness_proxy: number;
	    pow: number;
	    custom: number;
	    report_over_production: number;
	    delete_comment: number;
	    custom_json: number;
	    comment_options: number;
	    set_withdraw_vesting_route: number;
	    limit_order_create2: number;
	    claim_account: number;
	    create_claimed_account: number;
	    request_account_recovery: number;
	    recover_account: number;
	    change_recovery_account: number;
	    escrow_transfer: number;
	    escrow_dispute: number;
	    escrow_release: number;
	    pow2: number;
	    escrow_approve: number;
	    transfer_to_savings: number;
	    transfer_from_savings: number;
	    cancel_transfer_from_savings: number;
	    custom_binary: number;
	    decline_voting_rights: number;
	    reset_account: number;
	    set_reset_account: number;
	    claim_reward_balance: number;
	    delegate_vesting_shares: number;
	    account_create_with_delegation: number;
	    witness_set_properties: number;
	    account_update2: number;
	    create_proposal: number;
	    update_proposal_votes: number;
	    remove_proposal: number;
	    update_proposal: number;
	    collateralized_convert: number;
	    recurrent_transfer: number;
	    fill_convert_request: number;
	    author_reward: number;
	    curation_reward: number;
	    comment_reward: number;
	    liquidity_reward: number;
	    interest: number;
	    fill_vesting_withdraw: number;
	    fill_order: number;
	    shutdown_witness: number;
	    fill_transfer_from_savings: number;
	    hardfork: number;
	    comment_payout_update: number;
	    return_vesting_delegation: number;
	    comment_benefactor_reward: number;
	    producer_reward: number;
	    clear_null_account_balance: number;
	    proposal_pay: number;
	    sps_fund: number;
	    hardfork_hive: number;
	    hardfork_hive_restore: number;
	    delayed_voting: number;
	    consolidate_treasury_balance: number;
	    effective_comment_vote: number;
	    ineffective_delete_comment: number;
	    sps_convert: number;
	    expired_account_notification: number;
	    changed_recovery_account: number;
	    transfer_to_vesting_completed: number;
	    pow_reward: number;
	    vesting_shares_split: number;
	    account_created: number;
	    fill_collateralized_convert_request: number;
	    system_warning: number;
	    fill_recurrent_transfer: number;
	    failed_recurrent_transfer: number;
	};
	/**
	 * Make bitmask filter to be used with getAccountHistory call
	 * @param allowedOperations Array of operations index numbers
	 */
	export function makeBitMaskFilter(allowedOperations: number[]): any[];

}
declare module 'dhive/helpers/blockchain' {
	/**
	 * @file Hive blockchain helpers.
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
	/// <reference types="node" />
	import { Client } from 'dhive/client';
	export enum BlockchainMode {
	    /**
	     * Only get irreversible blocks.
	     */
	    Irreversible = 0,
	    /**
	     * Get all blocks.
	     */
	    Latest = 1
	}
	export interface BlockchainStreamOptions {
	    /**
	     * Start block number, inclusive. If omitted generation will start from current block height.
	     */
	    from?: number;
	    /**
	     * End block number, inclusive. If omitted stream will continue indefinitely.
	     */
	    to?: number;
	    /**
	     * Streaming mode, if set to `Latest` may include blocks that are not applied to the final chain.
	     * Defaults to `Irreversible`.
	     */
	    mode?: BlockchainMode;
	}
	export class Blockchain {
	    readonly client: Client;
	    constructor(client: Client);
	    /**
	     * Get latest block number.
	     */
	    getCurrentBlockNum(mode?: BlockchainMode): Promise<number>;
	    /**
	     * Get latest block header.
	     */
	    getCurrentBlockHeader(mode?: BlockchainMode): Promise<import("..").BlockHeader>;
	    /**
	     * Get latest block.
	     */
	    getCurrentBlock(mode?: BlockchainMode): Promise<import("..").SignedBlock>;
	    /**
	     * Return a asynchronous block number iterator.
	     * @param options Feed options, can also be a block number to start from.
	     */
	    getBlockNumbers(options?: BlockchainStreamOptions | number): AsyncGenerator<number, void, unknown>;
	    /**
	     * Return a stream of block numbers, accepts same parameters as {@link getBlockNumbers}.
	     */
	    getBlockNumberStream(options?: BlockchainStreamOptions | number): NodeJS.ReadableStream;
	    /**
	     * Return a asynchronous block iterator, accepts same parameters as {@link getBlockNumbers}.
	     */
	    getBlocks(options?: BlockchainStreamOptions | number): AsyncGenerator<import("..").SignedBlock, void, unknown>;
	    /**
	     * Return a stream of blocks, accepts same parameters as {@link getBlockNumbers}.
	     */
	    getBlockStream(options?: BlockchainStreamOptions | number): NodeJS.ReadableStream;
	    /**
	     * Return a asynchronous operation iterator, accepts same parameters as {@link getBlockNumbers}.
	     */
	    getOperations(options?: BlockchainStreamOptions | number): AsyncGenerator<import("..").AppliedOperation, void, unknown>;
	    /**
	     * Return a stream of operations, accepts same parameters as {@link getBlockNumbers}.
	     */
	    getOperationsStream(options?: BlockchainStreamOptions | number): NodeJS.ReadableStream;
	}

}
declare module 'dhive/helpers/broadcast' {
	/**
	 * @file Broadcast API helpers.
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
	import { AuthorityType } from 'dhive/chain/account';
	import { Asset } from 'dhive/chain/asset';
	import { AccountUpdateOperation, CommentOperation, CommentOptionsOperation, CustomJsonOperation, DelegateVestingSharesOperation, Operation, TransferOperation, VoteOperation } from 'dhive/chain/operation';
	import { SignedTransaction, Transaction, TransactionConfirmation } from 'dhive/chain/transaction';
	import { Client } from 'dhive/client';
	import { PrivateKey, PublicKey } from 'dhive/crypto';
	export interface CreateAccountOptions {
	    /**
	     * Username for the new account.
	     */
	    username: string;
	    /**
	     * Password for the new account, if set, all keys will be derived from this.
	     */
	    password?: string;
	    /**
	     * Account authorities, used to manually set account keys.
	     * Can not be used together with the password option.
	     */
	    auths?: {
	        owner: AuthorityType | string | PublicKey;
	        active: AuthorityType | string | PublicKey;
	        posting: AuthorityType | string | PublicKey;
	        memoKey: PublicKey | string;
	    };
	    /**
	     * Creator account, fee will be deducted from this and the key to sign
	     * the transaction must be the creators active key.
	     */
	    creator: string;
	    /**
	     * Account creation fee. If omitted fee will be set to lowest possible.
	     */
	    fee?: string | Asset | number;
	    /**
	     * Account delegation, amount of VESTS to delegate to the new account.
	     * If omitted the delegation amount will be the lowest possible based
	     * on the fee. Can be set to zero to disable delegation.
	     */
	    delegation?: string | Asset | number;
	    /**
	     * Optional account meta-data.
	     */
	    metadata?: {
	        [key: string]: any;
	    };
	}
	export class BroadcastAPI {
	    readonly client: Client;
	    /**
	     * How many milliseconds in the future to set the expiry time to when
	     * broadcasting a transaction, defaults to 1 minute.
	     */
	    expireTime: number;
	    constructor(client: Client);
	    /**
	     * Broadcast a comment, also used to create a new top level post.
	     * @param comment The comment/post.
	     * @param key Private posting key of comment author.
	     */
	    comment(comment: CommentOperation[1], key: PrivateKey): Promise<TransactionConfirmation>;
	    /**
	     * Broadcast a comment and set the options.
	     * @param comment The comment/post.
	     * @param options The comment/post options.
	     * @param key Private posting key of comment author.
	     */
	    commentWithOptions(comment: CommentOperation[1], options: CommentOptionsOperation[1], key: PrivateKey): Promise<TransactionConfirmation>;
	    /**
	     * Broadcast a vote.
	     * @param vote The vote to send.
	     * @param key Private posting key of the voter.
	     */
	    vote(vote: VoteOperation[1], key: PrivateKey): Promise<TransactionConfirmation>;
	    /**
	     * Broadcast a transfer.
	     * @param data The transfer operation payload.
	     * @param key Private active key of sender.
	     */
	    transfer(data: TransferOperation[1], key: PrivateKey): Promise<TransactionConfirmation>;
	    /**
	     * Broadcast custom JSON.
	     * @param data The custom_json operation payload.
	     * @param key Private posting or active key.
	     */
	    json(data: CustomJsonOperation[1], key: PrivateKey): Promise<TransactionConfirmation>;
	    /**
	     * Create a new account on testnet.
	     * @param options New account options.
	     * @param key Private active key of account creator.
	     */
	    createTestAccount(options: CreateAccountOptions, key: PrivateKey): Promise<TransactionConfirmation>;
	    /**
	     * Update account.
	     * @param data The account_update payload.
	     * @param key The private key of the account affected, should be the corresponding
	     *            key level or higher for updating account authorities.
	     */
	    updateAccount(data: AccountUpdateOperation[1], key: PrivateKey): Promise<TransactionConfirmation>;
	    /**
	     * Delegate vesting shares from one account to the other. The vesting shares are still owned
	     * by the original account, but content voting rights and bandwidth allocation are transferred
	     * to the receiving account. This sets the delegation to `vesting_shares`, increasing it or
	     * decreasing it as needed. (i.e. a delegation of 0 removes the delegation)
	     *
	     * When a delegation is removed the shares are placed in limbo for a week to prevent a satoshi
	     * of VESTS from voting on the same content twice.
	     *
	     * @param options Delegation options.
	     * @param key Private active key of the delegator.
	     */
	    delegateVestingShares(options: DelegateVestingSharesOperation[1], key: PrivateKey): Promise<TransactionConfirmation>;
	    /**
	     * Sign and broadcast transaction with operations to the network. Throws if the transaction expires.
	     * @param operations List of operations to send.
	     * @param key Private key(s) used to sign transaction.
	     */
	    sendOperations(operations: Operation[], key: PrivateKey | PrivateKey[]): Promise<TransactionConfirmation>;
	    /**
	     * Sign a transaction with key(s).
	     */
	    sign(transaction: Transaction, key: PrivateKey | PrivateKey[]): SignedTransaction;
	    /**
	     * Broadcast a signed transaction to the network.
	     */
	    send(transaction: SignedTransaction): Promise<TransactionConfirmation>;
	    /**
	     * Convenience for calling `condenser_api`.
	     */
	    call(method: string, params?: any[]): Promise<any>;
	}

}
declare module 'dhive/helpers/database' {
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
	import { ExtendedAccount } from 'dhive/chain/account';
	import { Price } from 'dhive/chain/asset';
	import { BlockHeader, SignedBlock } from 'dhive/chain/block';
	import { Discussion } from 'dhive/chain/comment';
	import { DynamicGlobalProperties } from 'dhive/chain/misc';
	import { ChainProperties, VestingDelegation } from 'dhive/chain/misc';
	import { AppliedOperation } from 'dhive/chain/operation';
	import { SignedTransaction } from 'dhive/chain/transaction';
	import { Client } from 'dhive/client';
	/**
	 * Possible categories for `get_discussions_by_*`.
	 */
	export type DiscussionQueryCategory = 'active' | 'blog' | 'cashout' | 'children' | 'comments' | 'feed' | 'hot' | 'promoted' | 'trending' | 'votes' | 'created';
	export interface DisqussionQuery {
	    /**
	     * Name of author or tag to fetch.
	     */
	    tag?: string;
	    /**
	     * Number of results, max 100.
	     */
	    limit: number;
	    filter_tags?: string[];
	    select_authors?: string[];
	    select_tags?: string[];
	    /**
	     * Number of bytes of post body to fetch, default 0 (all)
	     */
	    truncate_body?: number;
	    /**
	     * Name of author to start from, used for paging.
	     * Should be used in conjunction with `start_permlink`.
	     */
	    start_author?: string;
	    /**
	     * Permalink of post to start from, used for paging.
	     * Should be used in conjunction with `start_author`.
	     */
	    start_permlink?: string;
	    parent_author?: string;
	    parent_permlink?: string;
	}
	export class DatabaseAPI {
	    readonly client: Client;
	    constructor(client: Client);
	    /**
	     * Convenience for calling `database_api`.
	     */
	    call(method: string, params?: any[]): Promise<any>;
	    /**
	     * Return state of server.
	     */
	    getDynamicGlobalProperties(): Promise<DynamicGlobalProperties>;
	    /**
	     * Return median chain properties decided by witness.
	     */
	    getChainProperties(): Promise<ChainProperties>;
	    /**
	     * Return all of the state required for a particular url path.
	     * @param path Path component of url conforming to condenser's scheme
	     *             e.g. `@almost-digital` or `trending/travel`
	     */
	    getState(path: string): Promise<any>;
	    /**
	     * Return median price in HBD for 1 HIVE as reported by the witnesses.
	     */
	    getCurrentMedianHistoryPrice(): Promise<Price>;
	    /**
	     * Get list of delegations made by account.
	     * @param account Account delegating
	     * @param from Delegatee start offset, used for paging.
	     * @param limit Number of results, max 1000.
	     */
	    getVestingDelegations(account: string, from?: string, limit?: number): Promise<VestingDelegation[]>;
	    /**
	     * Return server config. See:
	     * https://github.com/steemit/steem/blob/master/libraries/protocol/include/steemit/protocol/config.hpp
	     */
	    getConfig(): Promise<{
	        [name: string]: string | number | boolean;
	    }>;
	    /**
	     * Return header for *blockNum*.
	     */
	    getBlockHeader(blockNum: number): Promise<BlockHeader>;
	    /**
	     * Return block *blockNum*.
	     */
	    getBlock(blockNum: number): Promise<SignedBlock>;
	    /**
	     * Return all applied operations in *blockNum*.
	     */
	    getOperations(blockNum: number, onlyVirtual?: boolean): Promise<AppliedOperation[]>;
	    /**
	     * Return array of discussions (a.k.a. posts).
	     * @param by The type of sorting for the discussions, valid options are:
	     *           `active` `blog` `cashout` `children` `comments` `created`
	     *           `feed` `hot` `promoted` `trending` `votes`. Note that
	     *           for `blog` and `feed` the tag is set to a username.
	     */
	    getDiscussions(by: DiscussionQueryCategory, query: DisqussionQuery): Promise<Discussion[]>;
	    /**
	     * Return array of account info objects for the usernames passed.
	     * @param usernames The accounts to fetch.
	     */
	    getAccounts(usernames: string[]): Promise<ExtendedAccount[]>;
	    /**
	     * Returns the details of a transaction based on a transaction id.
	     */
	    getTransaction(txId: string): Promise<SignedTransaction>;
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
	    getAccountHistory(account: string, from: number, limit: number, operation_bitmask?: [number, number]): Promise<[[number, AppliedOperation]]>;
	    /**
	     * Verify signed transaction.
	     */
	    verifyAuthority(stx: SignedTransaction): Promise<boolean>;
	    /** return rpc node version */
	    getVersion(): Promise<object>;
	}

}
declare module 'dhive/chain/hivemind' {
	export interface CommunityDetail {
	    id: number;
	    name: string;
	    title: string;
	    about: string;
	    lang: string;
	    type_id: number;
	    is_nsfw: false;
	    subscribers: number;
	    sum_pending: number;
	    num_pending: number;
	    num_authors: number;
	    created_at: string;
	    avatar_url: string;
	    context: object;
	    description: string;
	    flag_text: string;
	    settings: {};
	    team?: string[];
	    admins?: string[];
	}
	export interface Notifications {
	    id: number;
	    type: string;
	    score: number;
	    date: string;
	    msg: string;
	    url: string;
	}

}
declare module 'dhive/helpers/hivemind' {
	/**
	 * Hivemind database query wrapper
	 */
	import { Account } from 'dhive/chain/account';
	import { Discussion } from 'dhive/chain/comment';
	import { CommunityDetail, Notifications } from 'dhive/chain/hivemind';
	import { Client } from 'dhive/client';
	interface PostsQuery {
	    /**
	     * Number of posts to fetch
	     */
	    limit?: number;
	    /**
	     * Sorting posts
	     */
	    sort: 'trending' | 'hot' | 'created' | 'promoted' | 'payout' | 'payout_comments' | 'muted';
	    /**
	     * Filtering with tags
	     */
	    tag?: string[] | string;
	    /**
	     * Observer account
	     */
	    observer?: string;
	    /**
	     * Paginating last post author
	     */
	    start_author?: string;
	    /**
	     * Paginating last post permlink
	     */
	    start_permlink?: string;
	}
	/**
	 * Omitting sort extended from BridgeParam
	 */
	interface AccountPostsQuery extends Omit<PostsQuery, 'sort'> {
	    account: string;
	    sort: 'posts';
	}
	interface CommunityQuery {
	    name: string;
	    observer: string;
	}
	interface AccountNotifsQuery {
	    account: Account['name'];
	    limit: number;
	    type?: 'new_community' | 'pin_post';
	}
	interface ListCommunitiesQuery {
	    /**
	     * Paginating last
	     */
	    last?: string;
	    /**
	     * Number of communities to fetch
	     */
	    limit: number;
	    /**
	     * To be developed, not ready yet
	     */
	    query?: string | any;
	    /**
	     * Observer account
	     */
	    observer?: Account['name'];
	}
	export class HivemindAPI {
	    readonly client: Client;
	    constructor(client: Client);
	    /**
	     * Convenience of calling hivemind api
	     * @param method
	     * @param params
	     */
	    call(method: string, params?: any): Promise<any>;
	    /**
	     * Get trending, hot, recent community posts from Hivemind
	     * @param options
	     */
	    getRankedPosts(options: PostsQuery): Promise<Discussion[]>;
	    /**
	     * Get posts by particular account from Hivemind
	     * @param options
	     */
	    getAccountPosts(options: AccountPostsQuery): Promise<Discussion[]>;
	    /**
	     * Get community details such as who are the admin,
	     * moderators, how many subscribers, etc..
	     * @param options
	     */
	    getCommunity(options: CommunityQuery): Promise<CommunityDetail[]>;
	    /**
	     * List all subscriptions by particular account
	     * @param account the account you want to query
	     * @returns {Array} return role, what community the account joined
	     */
	    listAllSubscriptions(account: Account['name'] | object): Promise<Discussion[]>;
	    /**
	     * Get particular account notifications feed
	     * @param options
	     */
	    getAccountNotifications(options?: AccountNotifsQuery): Promise<Notifications[]>;
	    /**
	     * List all available communities on hivemind
	     * @param options
	     */
	    listCommunities(options: ListCommunitiesQuery): Promise<CommunityDetail[]>;
	}
	export {};

}
declare module 'dhive/helpers/key' {
	/**
	 * @file Account by key API helpers.
	 * @author Bartłomiej (@engrave) Górnicki
	 */
	import { PublicKey } from 'dhive/crypto';
	import { Client } from 'dhive/client';
	export interface AccountsByKey {
	    accounts: string[][];
	}
	export class AccountByKeyAPI {
	    readonly client: Client;
	    constructor(client: Client);
	    /**
	     * Convenience for calling `account_by_key_api`.
	     */
	    call(method: string, params?: any): Promise<any>;
	    /**
	     * Returns all accounts that have the key associated with their owner or active authorities.
	     */
	    getKeyReferences(keys: (PublicKey | string)[]): Promise<AccountsByKey>;
	}

}
declare module 'dhive/chain/rc' {
	import { SMTAsset } from 'dhive/chain/asset';
	import { Bignum } from 'dhive/chain/misc';
	export interface RCParams {
	    resource_history_bytes: Resource;
	    resource_new_accounts: Resource;
	    resource_market_bytes: Resource;
	    resource_state_bytes: Resource;
	    resource_execution_time: Resource;
	}
	export interface Resource {
	    resource_dynamics_params: DynamicParam;
	    price_curve_params: PriceCurveParam;
	}
	export interface DynamicParam {
	    resource_unit: number;
	    budget_per_time_unit: number;
	    pool_eq: Bignum;
	    max_pool_size: Bignum;
	    decay_params: {
	        decay_per_time_unit: Bignum;
	        decay_per_time_unit_denom_shift: number;
	    };
	    min_decay: number;
	}
	export interface PriceCurveParam {
	    coeff_a: Bignum;
	    coeff_b: Bignum;
	    shift: number;
	}
	export interface RCPool {
	    resource_history_bytes: Pool;
	    resource_new_accounts: Pool;
	    resource_market_bytes: Pool;
	    resource_state_bytes: Pool;
	    resource_execution_time: Pool;
	}
	export interface Pool {
	    pool: Bignum;
	}
	export interface RCAccount {
	    account: string;
	    rc_manabar: {
	        current_mana: Bignum;
	        last_update_time: number;
	    };
	    max_rc_creation_adjustment: SMTAsset | string;
	    max_rc: Bignum;
	}
	export interface Manabar {
	    current_mana: number;
	    max_mana: number;
	    percentage: number;
	}

}
declare module 'dhive/helpers/rc' {
	import { Account } from 'dhive/chain/account';
	import { Manabar, RCAccount, RCParams, RCPool } from 'dhive/chain/rc';
	import { Client } from 'dhive/client';
	export class RCAPI {
	    readonly client: Client;
	    constructor(client: Client);
	    /**
	     * Convenience for calling `rc_api`.
	     */
	    call(method: string, params?: any): Promise<any>;
	    /**
	     * Returns RC data for array of usernames
	     */
	    findRCAccounts(usernames: string[]): Promise<RCAccount[]>;
	    /**
	     * Returns the global resource params
	     */
	    getResourceParams(): Promise<RCParams>;
	    /**
	     * Returns the global resource pool
	     */
	    getResourcePool(): Promise<RCPool>;
	    /**
	     * Makes a API call and returns the RC mana-data for a specified username
	     */
	    getRCMana(username: string): Promise<Manabar>;
	    /**
	     * Makes a API call and returns the VP mana-data for a specified username
	     */
	    getVPMana(username: string): Promise<Manabar>;
	    /**
	     * Calculates the RC mana-data based on an RCAccount - findRCAccounts()
	     */
	    calculateRCMana(rc_account: RCAccount): Manabar;
	    /**
	     * Calculates the RC mana-data based on an Account - getAccounts()
	     */
	    calculateVPMana(account: Account): Manabar;
	    /**
	     * Internal convenience method to reduce redundant code
	     */
	    private _calculateManabar;
	}

}
declare module 'dhive/helpers/transaction' {
	/**
	 * @file Transaction status API helpers.
	 * @author Bartłomiej (@engrave) Górnicki
	 */
	import { Client } from 'dhive/client';
	export type TransactionStatus = 'unknown' | 'within_mempool' | 'within_reversible_block' | 'within_irreversible_block' | 'expired_reversible' | 'expired_irreversible' | 'too_old';
	export class TransactionStatusAPI {
	    readonly client: Client;
	    constructor(client: Client);
	    /**
	     * Convenience for calling `transaction_status_api`.
	     */
	    call(method: string, params?: any): Promise<any>;
	    /**
	     * Returns the status of a given transaction id
	     */
	    findTransaction(transaction_id: string, expiration?: string): Promise<{
	        status: TransactionStatus;
	    }>;
	}

}
declare module 'dhive/client' {
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
	/// <reference types="node" />
	import { Blockchain } from 'dhive/helpers/blockchain';
	import { BroadcastAPI } from 'dhive/helpers/broadcast';
	import { DatabaseAPI } from 'dhive/helpers/database';
	import { HivemindAPI } from 'dhive/helpers/hivemind';
	import { AccountByKeyAPI } from 'dhive/helpers/key';
	import { RCAPI } from 'dhive/helpers/rc';
	import { TransactionStatusAPI } from 'dhive/helpers/transaction';
	/**
	 * Library version.
	 */
	export const VERSION: string;
	/**
	 * Main Hive network chain id.
	 */
	export const DEFAULT_CHAIN_ID: Buffer;
	/**
	 * Main Hive network address prefix.
	 */
	export const DEFAULT_ADDRESS_PREFIX = "STM";
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
	    chainId?: string;
	    /**
	     * Hive address prefix. Defaults to main network:
	     * `STM`
	     */
	    addressPrefix?: string;
	    /**
	     * Send timeout, how long to wait in milliseconds before giving
	     * up on a rpc call. Note that this is not an exact timeout,
	     * no in-flight requests will be aborted, they will just not
	     * be retried any more past the timeout.
	     * Can be set to 0 to retry forever. Defaults to 60 * 1000 ms.
	     */
	    timeout?: number;
	    /**
	     * Specifies the amount of times the urls (RPC nodes) should be
	     * iterated and retried in case of timeout errors.
	     * (important) Requires url parameter to be an array (string[])!
	     * Can be set to 0 to iterate and retry forever. Defaults to 3 rounds.
	     */
	    failoverThreshold?: number;
	    /**
	     * Whether a console.log should be made when RPC failed over to another one
	     */
	    consoleOnFailover?: boolean;
	    /**
	     * Retry backoff function, returns milliseconds. Default = {@link defaultBackoff}.
	     */
	    backoff?: (tries: number) => number;
	    /**
	     * Node.js http(s) agent, use if you want http keep-alive.
	     * Defaults to using https.globalAgent.
	     * @see https://nodejs.org/api/http.html#http_new_agent_options.
	     */
	    agent?: any;
	    /**
	     * Deprecated - don't use
	     */
	    rebrandedApi?: boolean;
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
	    readonly options: ClientOptions;
	    /**
	     * Address to Hive RPC server.
	     * String or String[] *read-only*
	     */
	    address: string | string[];
	    /**
	     * Database API helper.
	     */
	    readonly database: DatabaseAPI;
	    /**
	     * RC API helper.
	     */
	    readonly rc: RCAPI;
	    /**
	     * Broadcast API helper.
	     */
	    readonly broadcast: BroadcastAPI;
	    /**
	     * Blockchain helper.
	     */
	    readonly blockchain: Blockchain;
	    /**
	     * Hivemind helper.
	     */
	    readonly hivemind: HivemindAPI;
	    /**
	     * Accounts by key API helper.
	     */
	    readonly keys: AccountByKeyAPI;
	    /**
	     * Transaction status API helper.
	     */
	    readonly transaction: TransactionStatusAPI;
	    /**
	     * Chain ID for current network.
	     */
	    readonly chainId: Buffer;
	    /**
	     * Address prefix for current network.
	     */
	    readonly addressPrefix: string;
	    private timeout;
	    private backoff;
	    private failoverThreshold;
	    private consoleOnFailover;
	    currentAddress: string;
	    /**
	     * @param address The address to the Hive RPC server,
	     * e.g. `https://api.hive.blog`. or [`https://api.hive.blog`, `https://another.api.com`]
	     * @param options Client options.
	     */
	    constructor(address: string | string[], options?: ClientOptions);
	    /**
	     * Create a new client instance configured for the testnet.
	     */
	    static testnet(options?: ClientOptions): Client;
	    /**
	     * Make a RPC call to the server.
	     *
	     * @param api     The API to call, e.g. `database_api`.
	     * @param method  The API method, e.g. `get_dynamic_global_properties`.
	     * @param params  Array of parameters to pass to the method, optional.
	     *
	     */
	    call(api: string, method: string, params?: any): Promise<any>;
	    updateOperations(rebrandedApi: any): void;
	}

}
declare module 'dhive/chain/deserializer' {
	import * as ByteBuffer from '@ecency/bytebuffer';
	export type Deserializer = (buffer: ByteBuffer) => void;
	export const types: {
	    EncryptedMemoD: any;
	};

}
declare module 'dhive/helpers/aes' {
	/// <reference types="node" />
	import { PrivateKey, PublicKey } from 'dhive/crypto';
	export const encrypt: (private_key: PrivateKey, public_key: PublicKey, message: Buffer, nonce?: string) => any;
	export const decrypt: (private_key: PrivateKey, public_key: PublicKey, nonce: any, message: any, checksum: number) => any;
	/**
	 * This method does not use a checksum, the returned data must be validated some other way.
	 * @arg {string|Buffer} ciphertext - binary format
	 * @return {Buffer} the decrypted message
	 */
	export const cryptoJsDecrypt: (message: Buffer, tag: any, iv: any) => Buffer;
	/**
	 * This method does not use a checksum, the returned data must be validated some other way.
	 * @arg {string|Buffer} plaintext - binary format
	 * @return {Buffer} binary
	 */
	export const cryptoJsEncrypt: (message: Buffer, tag: any, iv: any) => Buffer;

}
declare module 'dhive/memo' {
	import { PrivateKey, PublicKey } from 'dhive/crypto';
	export const Memo: {
	    decode: (private_key: string | PrivateKey, memo: string) => string;
	    encode: (private_key: string | PrivateKey, public_key: string | PublicKey, memo: string, testNonce?: string | undefined) => string;
	};

}
declare module 'dhive' {
	/**
	 * @file dhive exports.
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
	import * as utils from 'dhive/utils';
	export { utils };
	export * from 'dhive/helpers/blockchain';
	export * from 'dhive/helpers/database';
	export * from 'dhive/helpers/rc';
	export * from 'dhive/helpers/key';
	export * from 'dhive/helpers/hivemind';
	export * from 'dhive/chain/account';
	export * from 'dhive/chain/asset';
	export * from 'dhive/chain/block';
	export * from 'dhive/chain/comment';
	export * from 'dhive/chain/misc';
	export * from 'dhive/chain/operation';
	export * from 'dhive/chain/serializer';
	export * from 'dhive/chain/transaction';
	export * from 'dhive/chain/hivemind';
	export * from 'dhive/client';
	export * from 'dhive/crypto';
	export * from 'dhive/memo';

}
declare module 'dhive/index-browser' {
	/**
	 * @file dhive entry point for browsers.
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
	import 'core-js/features/array/from';
	import 'core-js/features/map';
	import 'core-js/features/number';
	import 'core-js/features/promise';
	import 'core-js/features/symbol';
	import 'core-js/features/symbol/async-iterator';
	import 'regenerator-runtime/runtime';
	import 'whatwg-fetch';
	export * from 'dhive';

}
declare module 'dhive/index-node' {
	/**
	 * @file dhive entry point for node.js.
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
	export * from 'dhive';

}
