# Changelog

## 1.4.0

### Upgrade checklist

1.4.0 adds APIs and fixes bugs; no public API was removed. These packaging changes
are the ones to check when upgrading from 1.3.x:

- **`exports` map.** `package.json` now has an `exports` field, which restricts what
  can be loaded through the package name. The entry point, `@hiveio/dhive/package.json`,
  every file under `dist/` and every module under `lib/` (with or without the `.js`
  extension, e.g. `@hiveio/dhive/lib/index-browser` as the README shows) still
  resolve. Paths that resolve only to a non-JavaScript file under `lib/`, such as
  `require('@hiveio/dhive/lib/index.d.ts')`, no longer resolve, nor do other
  top-level files of the package. TypeScript still finds the `.d.ts` next to each
  `lib/` module.
- **Fetch.** Under Node, dhive uses the runtime's global `fetch` when it has one. The
  `node-fetch`, `whatwg-fetch` and `https` runtime dependencies were removed. Code
  that relied on dhive installing them, or on the browser bundle installing a global
  `fetch` polyfill, has to provide them itself.
- **`agent` option.** The global fetch ignores http(s) agents. Setting
  `ClientOptions.agent` therefore routes requests through `cross-fetch` (node-fetch),
  so the agent still applies. Without an agent, the global fetch is used.
- **ES-module build.** Bundlers that read `module` or the `import` condition now get
  `lib/esm/` instead of `lib/`. Node still loads the CommonJS build for both
  `require` and `import`, and browser builds still get `dist/dhive.js`.
- **Docs links.** The regenerated docs use mixed-case file names
  (`classes/Client.html` instead of `classes/client.html`), so links into the old
  published docs break.

### Added

- `Client.mirrornet(options?)` returns a client for the Hive mirrornet
  (`https://api.fake.openhive.network`, address prefix `STM`, chain id `42000…00`).
  Like `testnet()` did, it copies the options it is given and keeps `options.agent`.
- **`client.block`**, a `BlockAPI` helper for `block_api`, which HAF API nodes serve
  from HAfAH. `getBlock(blockNum)` and `getBlockHeader(blockNum)` return the block or
  header, or `null` if the node has no such block. `getBlockRange(start, count)`
  returns up to `count` blocks; nodes reject a `count` above 1000. Blocks come in the
  `block_api` format, typed by the new `BlockApiSignedBlock`, `BlockApiBlockHeader`,
  `BlockApiTransaction`, `BlockApiOperation` (a union on `type`, e.g.
  `'vote_operation'`), `BlockApiOperationOf<O>`, `BlockApiValue<T>` and
  `BlockApiCommentOptionsOperation`. Assets and prices in them are typed `NaiAsset`
  (`{nai, amount, precision}`) and `NaiPrice`.
- **`Asset.fromNai(nai)` and `asset.toNai()`** convert between `Asset` and `NaiAsset`.
  `@@000000021` is HIVE, `@@000000013` HBD and `@@000000037` VESTS. `fromNai` throws
  on an unknown NAI, a precision that does not match the symbol, or an amount that is
  not an integer string. `toNai()` maps STEEM/TESTS to the HIVE NAI and SBD/TBD to
  the HBD NAI. `Asset.from()` also accepts a `NaiAsset`. Assets parsed with
  `fromNai`, or with `fromString` from a plain decimal, keep their exact amount, so
  `toString()` and `toNai()` stay exact for VESTS amounts beyond 2^53 units. Asset
  instances still have only `amount` and `symbol` properties.
- **ES-module build:** `lib/esm/`, declared through `module`, `exports` (`types`,
  `browser`, `module`, `node`, `import`, `require`) and `sideEffects`, so bundlers can
  tree-shake dhive. Only `lib/index-browser.js` (the polyfill entry), its ES-module
  twin and `dist/*` are listed as having side effects.

### Deprecated

- `Client.testnet()`: testnet.openhive.network no longer exists. The method now
  returns `Client.mirrornet(options)` and prints one `console.warn` per process.
  Use `Client.mirrornet()` instead.
- `client.database.getBlock()` and `client.database.getBlockHeader()`: use
  `client.block.getBlock()` and `client.block.getBlockHeader()`. The old methods
  still call `condenser_api` and return the condenser format, unchanged.

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
- **RPC error messages:** when the node's error has a blank format string, as
  hivemind's do, the `RPCError` message is now the node's `error.message`, followed
  by its assertion expression. A hivemind assert used to read only
  `category=hivemind`; it now reads, e.g., `Assert Exception: Post kaboom/boomboomboom
  does not exist`. The error data is still on the error as `jse_info`. An error stack
  entry without data no longer makes the client throw while building the message.
- **Punycode warning (DEP0040):** Node 22+ printed a deprecation warning for the
  built-in `punycode` module, loaded through node-fetch. node-fetch is now loaded
  only when `agent` is set or the runtime has no `fetch`. Through the global fetch,
  the per-attempt read timeout and failover on refused connections work as they did
  with node-fetch.
- **Reproducible bundle:** `dist/dhive.js` is built without browserify's
  `--full-paths`, so it no longer embeds the build directory in every module id and
  is byte-identical wherever it is built.

### Documentation

- `DiscussionQuery` documents which fields hivemind's
  `condenser_api.get_discussions_by_*` accepts. `filter_tags`, `select_authors`,
  `select_tags`, `parent_author` and `parent_permlink` are rejected, `limit` is at
  most 20 by default (the old "max 100" was wrong), and `truncate_body` counts
  characters. `DiscussionQueryCategory` notes that `active`, `cashout`, `children`,
  `promoted` and `votes` are not served.
- `client.database` (`DatabaseAPI`) documents that its calls go to `condenser_api`,
  and that `database_api` is reached with `client.call('database_api', ...)`.
- The README describes when to use `client.block` instead of `client.database`'s
  block reads, and how to opt into the ES-module build for browsers.

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
- The browser bundle `dist/dhive.js` is 1,028,378 bytes minified and 244,807 bytes
  gzipped. In 1.3.6 it was 948,663 and 215,054 bytes. Dependencies were
  resolved fresh (newer core-js and browserify shims), which adds size. Dropping
  the `whatwg-fetch` polyfill and browserify's full paths take some of it back.
- `docs/` is regenerated with the current TypeDoc, which uses a different page layout
  and mixed-case file names (see the upgrade checklist).
