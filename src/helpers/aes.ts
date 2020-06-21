const ByteBuffer = require('bytebuffer')
import { createCipheriv, createDecipheriv, randomBytes, createHash, createHmac } from "crypto";
import * as assert from 'assert';
import { PrivateKey, PublicKey } from '../crypto';
const Long = ByteBuffer.Long
/**
    Spec: http://localhost:3002/steem/@dantheman/how-to-encrypt-a-memo-when-transferring-steem
    @throws {Error|TypeError} - "Invalid Key, ..."
    @arg {PrivateKey} private_key - required and used for decryption
    @arg {PublicKey} public_key - required and used to calcualte the shared secret
    @arg {string} [nonce = uniqueNonce()] - assigned a random unique uint64

    @return {object}
    @property {string} nonce - random or unique uint64, provides entropy when re-using the same private/public keys.
    @property {Buffer} message - Plain text message
    @property {number} checksum - shared secret checksum
*/
export function encrypt(private_key: PrivateKey, public_key: PublicKey, message: any, nonce) {
    // Change message to varint32 prefixed encoded string
    let mbuf = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN)
    mbuf.writeVString(message)
    message = Buffer.from(mbuf.flip().toBinary());

    let aesKey = private_key.encapsulate(public_key);
    return crypt(aesKey, uniqueNonce(), message)
}

/**
    Spec: http://localhost:3002/steem/@dantheman/how-to-encrypt-a-memo-when-transferring-steem
    @arg {PrivateKey} private_key - required and used for decryption
    @arg {PublicKey} public_key - required and used to calcualte the shared secret
    @arg {string} nonce - random or unique uint64, provides entropy when re-using the same private/public keys.
    @arg {Buffer} message - Encrypted or plain text message
    @arg {number} checksum - shared secret checksum
    @throws {Error|TypeError} - "Invalid Key, ..."
    @return {Buffer} - message
*/
export function decrypt(private_key: PrivateKey, public_key: PublicKey, nonce, message: any, checksum: number) {
    let aesKey = public_key.decapsulate(private_key);

    return crypt(aesKey, nonce, message, checksum).message
}

/**
    @arg {Buffer} message - Encrypted or plain text message (see checksum)
    @arg {number} checksum - shared secret checksum (null to encrypt, non-null to decrypt)
*/
function crypt(aesKey: Buffer, nonce: number | Buffer, message: ByteBuffer | string, checksum?: number) {

    nonce = toLongObj(nonce)
    // Appending nonce to buffer "ebuf" and rehash with sha512
    let ebuf: any = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN)
    ebuf.writeUint64(nonce)
    ebuf.append(aesKey.toString('binary'), 'binary')
    ebuf.flip();
    ebuf = Buffer.from(ebuf.toBinary(), 'binary')
    const encryption_key = createHash('sha512').update(ebuf).digest()

    const iv = encryption_key.slice(32, 48)
    const tag = encryption_key.slice(0, 32)

    // check if first 64 bit of sha256 hash treated as uint64_t truncated to 32 bits.
    let check: Buffer | Number = createHash('sha256').update(encryption_key).digest()
    check = check.slice(0, 4)
    const cbuf: any = ByteBuffer.fromBinary(check.toString('binary'), ByteBuffer.LITTLE_ENDIAN)
    check = <Number>cbuf.readUint32()

    if (checksum) {
        if (check !== checksum)
            throw new Error('Invalid nonce')
        message = cryptoJsDecrypt(message, tag, iv)
    } else {
        message = cryptoJsEncrypt(message, tag, iv)
    }
    return { nonce, message, checksum: check }
}

/** This method does not use a checksum, the returned data must be validated some other way.
    @arg {string|Buffer} ciphertext - binary format
    @return {Buffer}
*/
function cryptoJsDecrypt(message, tag, iv) {
    assert(message, "Missing cipher text")
    message = toBinaryBuffer(message)
    const decipher = createDecipheriv('aes-256-cbc', tag, iv)
    message = Buffer.concat([decipher.update(message), decipher.final()])
    return message
}

/** This method does not use a checksum, the returned data must be validated some other way.
    @arg {string|Buffer} plaintext - binary format
    @return {Buffer} binary
*/
function cryptoJsEncrypt(message, tag, iv) {
    assert(message, "Missing plain text")
    message = toBinaryBuffer(message)
    const cipher = createCipheriv('aes-256-cbc', tag, iv)
    message = Buffer.concat([cipher.update(message), cipher.final()])
    return message
}

/** @return {string} unique 64 bit unsigned number string.  Being time based, this is careful to never choose the same nonce twice.  This value could be recorded in the blockchain for a long time.
*/
let unique_nonce_entropy: any = null;

function uniqueNonce() {
    if (unique_nonce_entropy === null) {
        var uint8randomArr = new Uint8Array(2)
        for (var i = 0; i < 2; ++i) { uint8randomArr[i] = randomBytes(2).readUInt8(i) }
        unique_nonce_entropy = uint8randomArr[0] << 8 | uint8randomArr[1]
    }
    let long = Long.fromNumber(Date.now())
    const entropy = ++unique_nonce_entropy % 0xFFFF
    long = long.shiftLeft(16).or(Long.fromNumber(entropy));
    return long.toString()
}

const toLongObj = o => (o ? Long.isLong(o) ? o : Long.fromString(o) : o)
const toBinaryBuffer = o => (o ? Buffer.isBuffer(o) ? o : Buffer.from(o, 'binary') : o)
