import "mocha";
import * as assert from "assert";
import { memo } from "../src/memo"
const {encode, decode} = memo

import {
    DEFAULT_ADDRESS_PREFIX,
    DEFAULT_CHAIN_ID,
    Operation,
    PrivateKey,
    PublicKey,
    Signature,
    cryptoUtils,
    Transaction,
    Types
} from "./../src";

const private_key = PrivateKey.fromSeed("")
const public_key = private_key.createPublic()

describe("memo encryption", function () {
    it('encrypt/decrypt memo', () => {
        const nonce = 1462976530069648
        const text = '#tngflx9099'

        const cypertext = encode(private_key, public_key, text, nonce)
        const plaintext = decode(private_key, cypertext)
        assert.equal(plaintext, text)
    })

    it('plain text', () => {
        const plaintext1 = encode(''/*private_key*/, ''/*public_key*/, 'memo')
        assert.equal(plaintext1, 'memo')

        const plaintext2 = decode(''/*private_key*/, plaintext1)
        assert.equal(plaintext2, 'memo')
    })

    it('encryption obj params', () => {
        const cypertext = encode(private_key, public_key, '#memo')
        const plaintext = decode(private_key, cypertext)
        assert.equal(plaintext, '#memo')
    })

    it('encryption string params', () => {
        const cypertext = encode(private_key.toString(), public_key.toString(), '#memo2')
        const plaintext = decode(private_key.toString(), cypertext)
        assert.equal(plaintext, '#memo2')
    })
});
