# Changelog

## Unreleased

### Added

- **ES-module build:** `lib/esm/`, declared through `module`, `exports` (`types`,
  `browser`, `module`, `node`, `import`, `require`) and `sideEffects`, so bundlers can
  tree-shake dhive. Node keeps loading the CommonJS build for both `require` and
  `import`; browser builds keep getting `dist/dhive.js`. Deep paths under `lib/` and
  `dist/` stay importable.

### Fixed

- **Reproducible bundle:** `dist/dhive.js` is built without browserify's
  `--full-paths`, so it no longer embeds the build directory in every module id and
  is byte-identical wherever it is built.

## 1.4.0

### Added

- `Client.mirrornet(options?)` returns a client for the Hive mirrornet
  (`https://api.fake.openhive.network`, address prefix `STM`, chain id `42000…00`).
  Like `testnet()` did, it copies the options it is given and keeps `options.agent`.

### Deprecated

- `Client.testnet()`: testnet.openhive.network no longer exists. The method now
  returns `Client.mirrornet(options)` and prints one `console.warn` per process.
  Use `Client.mirrornet()` instead.

### Fixed

- **User-Agent:** under Node, requests now send `User-Agent: dhive/<version>`. A
  broken `typeof self` check had always skipped it. The header is added to the
  request's existing headers, so `Accept` and `Content-Type` are kept.
- **`PublicKey.fromBuffer`:** returns a real `PublicKey` instead of a plain `{ key }`
  object. Its declared return type is now `PublicKey`.
- **`PrivateKey.multiply`:** uses the private key itself. It used the `secret` field,
  which is never assigned, so the shared secret it returned was wrong.
- **Failover accounting:** a node that answers 429 or 503 is now recorded as failing
  once, not twice. A node that is skipped because it is still rate-limited is no
  longer counted as a new failure. Failover starts from the client's current node if
  the health tracker still considers it healthy, and from the first node otherwise.

### TypeScript declarations

The library is now built with TypeScript 6 (it was built with 3.8). The output still
targets ES6 / CommonJS. Compared with 1.3.x, the published `.d.ts`:

- writes `export type` instead of `export declare type`. Union members are reordered,
  and `| undefined` is dropped from optional parameters. Both changes are equivalent
  to the old declarations.
- imports ByteBuffer as `import ByteBuffer = require(...)`. It is the same module and
  is still untyped.
- types `PublicKey.fromBuffer`'s parameter as `key: ByteBuffer`, which is still `any`.
- keeps `DEFAULT_CHAIN_ID`, `NETWORK_ID`, `Signature.toBuffer` and `transactionDigest`
  typed as plain `Buffer`. They are not `Buffer<ArrayBuffer>`, so older `@types/node`
  versions can still parse them.
- keeps `/// <reference types="node" />` for consumers through one reference in
  `index.ts`.
- keeps `HexBuffer.toString(encoding?: string)`.

The declarations type-check for a TypeScript 3.8 consumer with `@types/node` 13, and
for a TypeScript 6 consumer.

### Build and packaging

- The project moved from yarn to pnpm and to the shared catalogs of
  common-ci-configuration, and from ESLint 6 to ESLint 8, with GitLab CI.
- Dependencies were resolved fresh (newer core-js and browserify shims), so the
  browser bundle `dist/dhive.js` is larger: 1,244,872 bytes minified and 257,214
  bytes gzipped. In 1.3.6 it was 948,663 and 215,054 bytes.
- `docs/` is regenerated with the current TypeDoc, which uses a different page layout.
