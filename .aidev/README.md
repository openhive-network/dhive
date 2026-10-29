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

The project's CI is `.travis.yml` / `.circleci/config.yml` (Node 8–10 images, `yarn install
--frozen-lockfile`, `yarn test` = `make ci-test`); there is no `.gitlab-ci.yml`, so GitLab runs no
pipeline on `ai/*` or `session/*` branches. Its Node images are not pinned by this profile (the
test runtime takes Node from common-ci-configuration); it has no other job images.

## Suites run before work lands

Declared in `.aidev/project.yaml` under `verification`, all through `.aidev/run-checks.sh`,
which writes `test-results/<slot>/junit.xml` (one case per step, the step's log as the
failure body). Every run first installs dependencies offline from the lockfile
(`.aidev/yarn-deps.sh`), one case `install`; the slots name the steps after it:

- `quick` — lint build test
- `full` — lint build bundle test
- `baseline` — build test
- `canary` — lint build bundle test
- `static` — lint
- `coverage` — coverage
- `system` — build bundle test

Steps: `lint` is `eslint -c .eslintrc.json src/**/*.ts` exactly as `make ci-test` runs it (bash
without globstar, so `src/*/*.ts`); `build` is `make lib` (tsc into `lib/`, `.js` and `.d.ts`,
gitignored); `bundle` is the Makefile's browserify + tsify + babelify | derequire pipeline for
`dist/dhive.js`, written into `test-results/<slot>/` because `dist/` is committed and the gates
must not rewrite it (`dist/dhive.d.ts`, the `.gz` and `docs/` are not regenerated either);
`test` is mocha with ts-node, mocha's xunit report kept as `test-results/<slot>/mocha-xunit.xml`;
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
comes from there; this repository pins no Node of its own in it), adds `make` and yarn 1, and a
yarn cache filled by a frozen install of `yarn.lock`. Install scripts are not run: secp256k1
falls back to its pure-JS implementation. Rebuild and re-pin it with
`.aidev/runtime/build.sh --push` when the Dockerfile, `package.json` or `yarn.lock` changes, or to
follow a new `node-test-tools:develop`, and put the printed `repo@sha256:…` into
`environment.image`. A change that moves dhive to pnpm has to rewrite the runtime
(Dockerfile, `build.sh` inputs, `yarn-deps.sh`) and `environment.inputs` with it.

## Known state at onboarding (2026-10-29)

- `install`, `lint` (0 errors, 86 warnings), `build`, `bundle` and `test` pass offline:
  16 tests in `asset.ts`, `memo.ts`, `misc.ts`, `rc.ts` (and the helper `common.ts`).
  `coverage`: about 50% of lines.
- `test/crypto.ts` and `test/serializers.ts` are left out (`TESTS_FAILING`): they import
  `bytebuffer`, which is not a dependency (src moved to `@ecency/bytebuffer`), so mocha cannot
  load them, with or without network.
