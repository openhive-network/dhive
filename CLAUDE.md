# dhive - Hive Blockchain RPC Client

## Project Overview

dhive is a TypeScript RPC client library for the Hive blockchain. It provides a robust API for interacting with Hive nodes, supporting both Node.js and browser environments. The library handles blockchain operations, cryptographic signing, transaction broadcasting, and chain state queries.

**Version**: 1.3.2
**License**: BSD-3-Clause-No-Military-License

## Tech Stack

- **Language**: TypeScript 3.8.3
- **Target**: ES6 / CommonJS
- **Build System**: Make + browserify + tsify
- **Minifier**: Terser
- **Testing**: Mocha + Karma (browser) + nyc (coverage)
- **Linting**: ESLint + TSLint
- **Documentation**: TypeDoc

### Key Dependencies

| Package | Purpose |
|---------|---------|
| secp256k1 | ECDSA cryptography |
| @ecency/bytebuffer | Binary serialization |
| cross-fetch | HTTP client (isomorphic) |
| bs58 | Base58 encoding |
| verror | Error handling |

## Directory Structure

```
src/
├── chain/              # Blockchain data types and serialization
│   ├── account.ts      # Account and authority types
│   ├── asset.ts        # Asset/balance types
│   ├── block.ts        # Block structures
│   ├── operation.ts    # All blockchain operations
│   ├── serializer.ts   # Binary serialization
│   └── transaction.ts  # Transaction types
├── helpers/            # High-level API modules
│   ├── blockchain.ts   # Block streaming
│   ├── broadcast.ts    # Transaction broadcasting
│   ├── database.ts     # Chain state queries
│   ├── rc.ts           # Resource Credits API
│   └── hivemind.ts     # Hivemind API
├── client.ts           # Main RPC client
├── crypto.ts           # Key management and signing
├── memo.ts             # Encrypted memo handling
├── index.ts            # Main exports
├── index-node.ts       # Node.js entry point
└── index-browser.ts    # Browser entry point

test/                   # Test suite (Mocha)
examples/               # Usage examples
dist/                   # Browser bundle output
lib/                    # Compiled CommonJS output
docs/                   # Generated TypeDoc
```

## Development Commands

### Building

```bash
make all          # Full build: lib + bundle + docs
make lib          # Compile TypeScript to lib/
make bundle       # Create browser bundle dist/dhive.js
make docs         # Generate TypeDoc documentation
make clean        # Remove lib/, dist/, docs/
```

### Testing

```bash
make test                  # Run tests with ts-node
make ci-test               # ESLint + tests with coverage (TAP)
make coverage              # Generate HTML coverage report
make browser-test          # Browser tests via Sauce Labs
make browser-test-local    # Browser tests via local Karma
```

### Linting

```bash
make lint         # Run tslint with auto-fix
yarn lint         # Run ESLint
```

## Key Files

| File | Purpose |
|------|---------|
| `src/client.ts` | Main Client class - entry point for all API calls |
| `src/crypto.ts` | PrivateKey, PublicKey, Signature classes |
| `src/chain/operation.ts` | All blockchain operation types |
| `src/chain/serializer.ts` | Binary serialization for transactions |
| `src/helpers/broadcast.ts` | Transaction signing and broadcasting |
| `tsconfig.json` | TypeScript configuration |
| `Makefile` | Build automation |

## Coding Conventions

### Style Rules (enforced by ESLint/TSLint)

- No semicolons
- Single quotes only
- 4-space indentation
- Max 120 characters per line
- Explicit member accessibility (public/private)
- No console.log statements
- Prefer arrow functions
- Object shorthand syntax

### Patterns

- Async/await for all async operations
- AsyncIterator for streaming (getBlockStream)
- Separate entry points for Node.js vs browser
- VError for error wrapping with context

### File Organization

- Chain types in `src/chain/`
- High-level APIs in `src/helpers/`
- Each helper module handles one concern (database, broadcast, etc.)

## CI/CD Notes

### CircleCI (.circleci/config.yml)

- Tests on Node.js 8, 9, 10
- Uses yarn with frozen lockfile
- Caches node_modules
- Outputs TAP format results

### Travis CI (.travis.yml)

- Node.js 8, 9, 10 matrix
- Publishes coverage to coveralls.io

### Build Outputs

- `lib/` - CommonJS modules
- `dist/dhive.js` - Browser bundle (922KB, 209KB gzipped)
- `dist/dhive.d.ts` - TypeScript definitions
- CDN: `https://unpkg.com/@hiveio/dhive@latest/dist/dhive.js`

## Quick Reference

### Basic Usage

```typescript
import { Client, PrivateKey } from '@hiveio/dhive'

const client = new Client(['https://api.hive.blog'])

// Query blockchain
const account = await client.database.getAccounts(['username'])

// Broadcast transaction
const key = PrivateKey.fromString('5K...')
await client.broadcast.vote({ voter: 'user', author: 'author', permlink: 'post', weight: 10000 }, key)
```

### Main API Modules

- `client.database` - Chain state queries
- `client.broadcast` - Transaction broadcasting
- `client.blockchain` - Block streaming
- `client.rc` - Resource Credits
- `client.hivemind` - Hivemind queries
