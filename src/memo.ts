import * as ByteBuffer from "bytebuffer";
import { PrivateKey, PublicKey } from "./crypto";
import * as bs58 from "bs58";
import { Types } from "./chain/serializer";
import * as Aes from "./helpers/aes";
import { types } from './chain/deserializer'

function encode(private_key: PrivateKey | string, public_key: PublicKey | string, memo: string, testNonce?: number) {
    if (!/^#/.test(memo)) return memo
    memo = memo.substring(1)

    private_key = toPrivateObj(private_key) as PrivateKey
    public_key = toPublicObj(public_key) as PublicKey

    const { nonce, message, checksum } = Aes.encrypt(private_key, public_key, memo, testNonce);

    let mbuf = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN)
    Types.EncryptedMemo(mbuf, {
        from: private_key.createPublic(),
        to: public_key,
        nonce,
        check: checksum,
        encrypted: message
    });
    mbuf.flip();
    const data = Buffer.from(mbuf.toBuffer());
    return '#' + bs58.encode(data);
}

function decode(private_key: PrivateKey | string, memo: any) {
    if (!/^#/.test(memo)) return memo
    memo = memo.substring(1)
    // checkEncryption()

    private_key = toPrivateObj(private_key) as PrivateKey

    memo = bs58.decode(memo)
    memo = types.EncryptedMemoD(Buffer.from(memo, 'binary'))

    const { from, to, nonce, check, encrypted } = memo
    const pubkey = private_key.createPublic().toString()
    const otherpub = pubkey === new PublicKey(from.key).toString() ? new PublicKey(to.key) : new PublicKey(from.key)
    memo = Aes.decrypt(private_key, otherpub, nonce, encrypted, check)

    // remove varint length prefix
    const mbuf = ByteBuffer.fromBinary(memo.toString('binary'), ByteBuffer.LITTLE_ENDIAN)
    try {
        mbuf.mark()
        return '#' + mbuf.readVString()
    } catch (e) {
        mbuf.reset()
        // Sender did not length-prefix the memo
        memo = Buffer.from(mbuf.toString('binary'), 'binary').toString('utf-8')
        return '#' + memo
    }
}

const toPrivateObj = o => (o ? o.key ? o : PrivateKey.fromString(o) : o/*null or undefined*/)
const toPublicObj = o => (o ? o.key ? o : PublicKey.fromString(o) : o/*null or undefined*/)

export const memo = {
    encode,
    decode
}
