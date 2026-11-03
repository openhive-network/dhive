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

import assert = require('assert')

export interface SMTAsset {
  amount: string | number
  precision: number
  nai: string
}

/**
 * Asset symbol string.
 */
export type AssetSymbol =
  | 'HIVE'
  | 'VESTS'
  | 'HBD'
  | 'TESTS'
  | 'TBD'
  | 'STEEM'
  | 'SBD'

const NAI_SYMBOLS: { [nai: string]: AssetSymbol } = {
  '@@000000013': 'HBD',
  '@@000000021': 'HIVE',
  '@@000000037': 'VESTS'
}

/**
 * Class representing a hive asset, e.g. `1.000 HIVE` or `12.112233 VESTS`.
 */
export class Asset {
  /**
   * Exact amount in the smallest unit, kept when the asset was parsed from an
   * exact representation so that NAI conversion does not go through a float.
   */
  private units?: string

  constructor(
    public readonly amount: number,
    public readonly symbol: AssetSymbol
  ) {}

  /**
   * Create a new Asset instance from the NAI format used by `block_api`,
   * e.g. `{nai: '@@000000013', amount: '1000', precision: 3}` for `1.000 HBD`.
   * Throws if the NAI is unknown, the precision does not match its symbol or
   * the amount is not an integer string.
   */
  public static fromNai(nai: NaiAsset): Asset {
    const symbol = Object.prototype.hasOwnProperty.call(NAI_SYMBOLS, nai.nai)
      ? NAI_SYMBOLS[nai.nai]
      : undefined
    if (!symbol) {
      throw new Error(`Unknown asset NAI: ${nai.nai}`)
    }
    const precision = Asset.symbolPrecision(symbol)
    if (nai.precision !== precision) {
      throw new Error(
        `Invalid precision for NAI ${nai.nai} (${symbol}): expected ${precision} got: ${nai.precision}`
      )
    }
    if (typeof nai.amount !== 'string' || !/^-?\d+$/.test(nai.amount)) {
      throw new Error(`Invalid NAI asset amount: ${String(nai.amount)}`)
    }
    return Asset.fromUnits(nai.amount, symbol)
  }

  /**
   * Create a new Asset instance from a string, e.g. `42.000 HIVE`.
   */
  public static fromString(string: string, expectedSymbol?: AssetSymbol) {
    const [amountString, symbol] = string.split(' ')
    if (
      !['HIVE', 'VESTS', 'HBD', 'TESTS', 'TBD', 'SBD', 'STEEM'].includes(symbol)
    ) {
      throw new Error(`Invalid asset symbol: ${symbol}`)
    }
    if (expectedSymbol && symbol !== expectedSymbol) {
      throw new Error(
        `Invalid asset, expected symbol: ${expectedSymbol} got: ${symbol}`
      )
    }
    const units = Asset.decimalToUnits(
      amountString,
      Asset.symbolPrecision(symbol as AssetSymbol)
    )
    if (units !== undefined) {
      return Asset.fromUnits(units, symbol as AssetSymbol)
    }
    const amount = Number.parseFloat(amountString)
    if (!Number.isFinite(amount)) {
      throw new Error(`Invalid asset amount: ${amountString}`)
    }
    return new Asset(amount, symbol as AssetSymbol)
  }

  /**
   * Convenience to create new Asset.
   * @param symbol Symbol to use when created from number. Will also be used to validate
   *               the asset, throws if the passed value has a different symbol than this.
   */
  public static from(
    value: string | Asset | number | NaiAsset,
    symbol?: AssetSymbol
  ) {
    if (typeof value === 'object' && value !== null && !(value instanceof Asset)) {
      value = Asset.fromNai(value)
    }
    if (value instanceof Asset) {
      if (symbol && value.symbol !== symbol) {
        throw new Error(
          `Invalid asset, expected symbol: ${symbol} got: ${value.symbol}`
        )
      }
      return value
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      return new Asset(value, symbol || 'STEEM')
    } else if (typeof value === 'string') {
      return Asset.fromString(value, symbol)
    } else {
      throw new Error(`Invalid asset '${String(value)}'`)
    }
  }

  /**
   * Return the smaller of the two assets.
   */
  public static min(a: Asset, b: Asset) {
    assert(
      a.symbol === b.symbol,
      'can not compare assets with different symbols'
    )
    return a.amount < b.amount ? a : b
  }

  /**
   * Return the larger of the two assets.
   */
  public static max(a: Asset, b: Asset) {
    assert(
      a.symbol === b.symbol,
      'can not compare assets with different symbols'
    )
    return a.amount > b.amount ? a : b
  }

  private static fromUnits(units: string, symbol: AssetSymbol): Asset {
    const asset = new Asset(
      Number(Asset.unitsToDecimal(units, Asset.symbolPrecision(symbol))),
      symbol
    )
    asset.units = units
    return asset
  }

  private static symbolPrecision(symbol: AssetSymbol): number {
    return symbol === 'VESTS' ? 6 : 3
  }

  /**
   * Convert a plain decimal string to a normalized integer string of the
   * smallest unit, or undefined if it is not representable exactly.
   */
  private static decimalToUnits(decimal: string, precision: number) {
    const match = /^(-?)(\d+)(?:\.(\d*))?$/.exec(decimal)
    if (!match || (match[3] || '').length > precision) {
      return undefined
    }
    const [, sign, int, frac = ''] = match
    const digits = (int + frac + '0'.repeat(precision - frac.length)).replace(
      /^0+(?=\d)/,
      ''
    )
    return digits === '0' ? digits : sign + digits
  }

  private static unitsToDecimal(units: string, precision: number) {
    const sign = units.startsWith('-') ? '-' : ''
    let digits = sign ? units.slice(1) : units
    if (digits.length <= precision) {
      digits = '0'.repeat(precision - digits.length + 1) + digits
    }
    const point = digits.length - precision
    const fraction = precision > 0 ? '.' + digits.slice(point) : ''
    return sign + digits.slice(0, point) + fraction
  }

  /**
   * Return asset precision.
   */
  public getPrecision(): number {
    return Asset.symbolPrecision(this.symbol)
  }

  /**
   * returns a representation of this asset using only STEEM SBD for
   * legacy purposes
   */
  public steem_symbols(): Asset {
    switch (this.symbol) {
      case 'HIVE':
        return Asset.from(this.amount, 'STEEM')
      case 'HBD':
        return Asset.from(this.amount, 'SBD')
      default:
        return this
    }
  }

  /**
   * Return a string representation of this asset, e.g. `42.000 HIVE`.
   */
  public toString(): string {
    const amount =
      this.units !== undefined
        ? Asset.unitsToDecimal(this.units, this.getPrecision())
        : this.amount.toFixed(this.getPrecision())
    return `${amount} ${this.symbol}`
  }

  /**
   * Return this asset in the NAI format used by `block_api`. The legacy
   * STEEM/SBD and testnet TESTS/TBD symbols map to the HIVE and HBD NAIs.
   */
  public toNai(): NaiAsset {
    const precision = this.getPrecision()
    const units =
      this.units !== undefined
        ? this.units
        : Asset.decimalToUnits(this.amount.toFixed(precision), precision)
    if (units === undefined) {
      throw new Error(`Can not convert ${this.amount} ${this.symbol} to NAI`)
    }
    return { amount: units, nai: this.nai(), precision }
  }

  /**
   * Return a new Asset instance with amount added.
   */
  public add(amount: Asset | string | number): Asset {
    const other = Asset.from(amount, this.symbol)
    assert(this.symbol === other.symbol, 'can not add with different symbols')
    return new Asset(this.amount + other.amount, this.symbol)
  }

  /**
   * Return a new Asset instance with amount subtracted.
   */
  public subtract(amount: Asset | string | number): Asset {
    const other = Asset.from(amount, this.symbol)
    assert(
      this.symbol === other.symbol,
      'can not subtract with different symbols'
    )
    return new Asset(this.amount - other.amount, this.symbol)
  }

  /**
   * Return a new Asset with the amount multiplied by factor.
   */
  public multiply(factor: Asset | string | number): Asset {
    const other = Asset.from(factor, this.symbol)
    assert(
      this.symbol === other.symbol,
      'can not multiply with different symbols'
    )
    return new Asset(this.amount * other.amount, this.symbol)
  }

  /**
   * Return a new Asset with the amount divided.
   */
  public divide(divisor: Asset | string | number): Asset {
    const other = Asset.from(divisor, this.symbol)
    assert(
      this.symbol === other.symbol,
      'can not divide with different symbols'
    )
    return new Asset(this.amount / other.amount, this.symbol)
  }

  /**
   * For JSON serialization, same as toString().
   */
  public toJSON(): string {
    return this.toString()
  }

  private nai(): string {
    switch (this.symbol) {
      case 'HIVE':
      case 'STEEM':
      case 'TESTS':
        return '@@000000021'
      case 'HBD':
      case 'SBD':
      case 'TBD':
        return '@@000000013'
      case 'VESTS':
        return '@@000000037'
    }
  }
}

export type PriceType = Price | { base: Asset | string; quote: Asset | string }

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
  /**
   * @param base  - represents a value of the price object to be expressed relatively to quote
   *                asset. Cannot have amount == 0 if you want to build valid price.
   * @param quote - represents an relative asset. Cannot have amount == 0, otherwise
   *                asertion fail.
   *
   * Both base and quote shall have different symbol defined.
   */
  constructor(public readonly base: Asset, public readonly quote: Asset) {
    assert(
      base.amount !== 0 && quote.amount !== 0,
      'base and quote assets must be non-zero'
    )
    assert(
      base.symbol !== quote.symbol,
      'base and quote can not have the same symbol'
    )
  }

  /**
   * Convenience to create new Price.
   */
  public static from(value: PriceType) {
    if (value instanceof Price) {
      return value
    } else {
      return new Price(Asset.from(value.base), Asset.from(value.quote))
    }
  }

  /**
   * Return a string representation of this price pair.
   */
  public toString() {
    return `${this.base}:${this.quote}`
  }

  /**
   * Return a new Asset with the price converted between the symbols in the pair.
   * Throws if passed asset symbol is not base or quote.
   */
  public convert(asset: Asset) {
    if (asset.symbol === this.base.symbol) {
      assert(this.base.amount > 0)
      return new Asset(
        (asset.amount * this.quote.amount) / this.base.amount,
        this.quote.symbol
      )
    } else if (asset.symbol === this.quote.symbol) {
      assert(this.quote.amount > 0)
      return new Asset(
        (asset.amount * this.base.amount) / this.quote.amount,
        this.base.symbol
      )
    } else {
      throw new Error(`Can not convert ${asset} with ${this}`)
    }
  }
}

/**
 * Asset in the NAI (numeric asset identifier) format used by `block_api`,
 * e.g. `{nai: '@@000000013', amount: '1000', precision: 3}` for `1.000 HBD`.
 * `amount` is the integer number of the smallest units, as a string.
 */
export interface NaiAsset {
    nai: string
    amount: string
    precision: number
}

/**
 * Price whose sides are NAI assets.
 */
export interface NaiPrice {
    base: NaiAsset
    quote: NaiAsset
}
