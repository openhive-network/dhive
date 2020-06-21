import * as ByteBuffer from 'bytebuffer'
import { PublicKey } from '../crypto';

export type Deserializer = (buffer: ByteBuffer) => void

const PublicKeyDeserializer = (
        buf: ByteBuffer
) => {
        let c: ByteBuffer = fixed_buf(buf, 33)
        return PublicKey.fromBuffer(c)
}

const UInt64Deserializer = (b: ByteBuffer) => {
        return b.readUint64();
}

const UInt32Deserializer = (b: ByteBuffer) => {
        return b.readUint32();
}

const BinaryDeserializer = (b: ByteBuffer) => {
        let b_copy: ByteBuffer;
        var len = b.readVarint32();
        b_copy = b.copy(b.offset, b.offset + len), b.skip(len);
        return Buffer.from(b_copy.toBinary(), 'binary');
}

const BufferDeserializer = (keyDeserializers: [string, Deserializer][]) => (
        buf: ByteBuffer | Buffer
) => {
        let obj = {};
        for (const [key, deserializer] of keyDeserializers) {
                try {
                        //Decodes a binary encoded string to a ByteBuffer.
                        buf = ByteBuffer.fromBinary(buf.toString("binary"), ByteBuffer.LITTLE_ENDIAN);
                        obj[key] = deserializer(buf)
                } catch (error) {
                        error.message = `${key}: ${error.message}`
                        throw error
                }
        }
        return obj;
}

function fixed_buf(b: ByteBuffer, len: number): Buffer | any {
        if (!b) {
                throw Error('No buffer found on first parameter')
        } else {
                let b_copy = b.copy(b.offset, b.offset + len);
                b.skip(len);
                return Buffer.from(b_copy.toBinary(), 'binary');
        }
}

const EncryptedMemoDeserializer = BufferDeserializer([
        ['from', PublicKeyDeserializer],
        ['to', PublicKeyDeserializer],
        ['nonce', UInt64Deserializer],
        ['check', UInt32Deserializer],
        ['encrypted', BinaryDeserializer]
]);

export const types = {
        EncryptedMemoD: EncryptedMemoDeserializer
}
