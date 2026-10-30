# Automated contributions

This directory configures the automated development platform that contributes to this
repository. This note says which branches it uses here and how its work reaches the
project's main line.

## Branches

- `aidev/integration` — the integration branch. Automated work lands here and nowhere else.
- `master` — the project's main line; reached from `aidev/integration` only by merge request (`aidev handoff`). Merge it **keeping the source branch**: `aidev/integration` is protected for that reason.
- `ai/*` — one branch per task, created and deleted by the platform. Do not commit to them.
- `session/*` — a session's accumulated work, landed on the integration branch as a batch.

## How work reaches the main line

Task and session branches never reach `aidev/integration` through merge requests; the platform
lands them after its own verification. `aidev/integration` reaches `master` by this project's
usual process, merge requests included — the platform never merges into any other branch.

The project's CI is `.gitlab-ci.yml`: ccc's `node-test-tools` image, ccc's pnpm install with
catalog fallback, then `make lib bundle`, `make eslint` and `make unit-test` (the same offline test
files as `test` below). Its images are not pinned by this profile (both CI and the test runtime
take Node and pnpm from common-ci-configuration).

## Suites run before work lands

Declared in `.aidev/project.yaml` under `verification`, all through `.aidev/run-checks.sh`,
which writes `test-results/<slot>/junit.xml` (one case per step, the step's log as the
failure body). Every run first installs dependencies offline from the lockfile
(`.aidev/pnpm-deps.sh`), one case `install`; the slots name the steps after it:

- `quick` — lint build test
- `full` — lint build bundle test
- `baseline` — build test
- `canary` — lint build bundle test
- `static` — lint
- `coverage` — coverage
- `system` — build bundle test

Steps: `lint` is `eslint -c .eslintrc.json src/**/*.ts` exactly as `make eslint` runs it (bash
without globstar, so `src/*/*.ts`); `build` is `make lib` (tsc into `lib/`, `.js` and `.d.ts`,
gitignored); `bundle` is the Makefile's browserify + tsify + babelify | derequire pipeline for
`dist/dhive.js`, written into `test-results/<slot>/` because `dist/` is committed and the gates
must not rewrite it (`dist/dhive.d.ts`, the `.gz` and `docs/` are not regenerated either);
`test` is mocha with tsx, mocha's xunit report kept as `test-results/<slot>/mocha-xunit.xml`;
`coverage` is the same files under nyc (`-r lcov`, as `make ci-test`), reports in
`test-results/coverage/coverage/`. `make lint` (tslint `--fix`) is not run: it rewrites the tree.

The suites run with no network. Test files that call a Hive node are left out of `test` and
`coverage` by name (`TESTS_NEED_NETWORK` in `run-checks.sh`), each failing offline with a
timeout or `EAI_AGAIN`: `blockchain.ts`, `database.ts`, `hivemind.ts` (`new Client(TEST_NODE)`,
default `https://api.hive.blog`), `broadcast.ts`, `key.ts`, `operations.ts`, `transaction.ts`
(`Client.testnet()`, `https://testnet.openhive.network`, creating testnet accounts), `client.ts`
(rpc calls and failover between live nodes). `rc.ts` constructs clients but its tests are pure
calculations, so it runs.

## Test runtime

`.aidev/runtime/Dockerfile` builds on common-ci-configuration's `node-test-tools:develop` (Node
and pnpm come from there; this repository pins neither), adds `make`, and runs `pnpm fetch` of
`pnpm-lock.yaml` into the image's pnpm store (`/opt/pnpm-store`, already preloaded with ccc's
catalogs). Install scripts are not run: secp256k1 falls back to its pure-JS implementation.
Rebuild and re-pin it with `.aidev/runtime/build.sh --push` when the Dockerfile, `package.json`,
`pnpm-lock.yaml` or ccc's catalog file changes, or to follow a new `node-test-tools:develop`, and
put the printed `repo@sha256:…` into `environment.image`. `environment.packages` lets a
lockfile-only move (ccc's catalog re-sync) run from the current store or a fetch. The
`pnpm-workspace.yaml` symlink resolves only with the `npm-common-config` submodule checked out;
`pnpm-deps.sh` fails the `install` case naming it otherwise.

## Known state at onboarding (2026-10-29)

- `install`, `lint` (0 errors, 86 warnings), `build`, `bundle` and `test` pass offline:
  16 tests in `asset.ts`, `memo.ts`, `misc.ts`, `rc.ts` (and the helper `common.ts`).
  `coverage`: about 50% of lines.
- `test/crypto.ts` and `test/serializers.ts` were left out then (they imported `bytebuffer`,
  not a dependency); since the pnpm move they import `@ecency/bytebuffer` and run: 50 tests,
  `coverage` about 61% of lines.
