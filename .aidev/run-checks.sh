#!/usr/bin/env bash
# Run the checks named after the suite and write test-results/<suite>/junit.xml.
#
#   .aidev/run-checks.sh <suite> <step>...
#
# dhive's CI is .gitlab-ci.yml (`pnpm install --frozen-lockfile`, then `make lib
# bundle`, `make eslint` and `make unit-test`). Every run first installs
# node_modules offline and frozen (.aidev/pnpm-deps.sh), one junit case
# `install`. Steps, each one junit case (its log the failure body):
#
#   lint      `eslint -c .eslintrc.json src/**/*.ts`, as `make eslint` runs it
#             (in bash without globstar, so src/*/*.ts)
#   build     `make lib`: tsc -p tsconfig.json --outDir lib (.js and .d.ts,
#             gitignored) plus lib/version.js; lib/ is removed first so make
#             cannot call it up to date
#   bundle    the browserify + tsify + babelify | derequire pipeline of the
#             Makefile's dist/dhive.js rule, written into test-results/<suite>/
#             instead: dist/ is committed and the gates must not rewrite it
#   test      mocha (tsx) over the test files not in TESTS_NEED_NETWORK;
#             mocha's xunit report is kept as test-results/<suite>/mocha-xunit.xml
#   coverage  the same files under nyc (ci-test's `nyc -r lcov`), reports in
#             test-results/<suite>/coverage
#
# Runs offline in the image of .aidev/runtime/Dockerfile.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
root="$PWD"
suite="${1:?usage: $0 <suite> <step>...}"; shift
out="$root/test-results/$suite"
rm -rf "$out"; mkdir -p "$out"
cases="$out/cases.tsv"; : > "$cases"
source .aidev/junit-helpers.sh
export PATH="$root/node_modules/.bin:$PATH"

# Test files left out of `test` and `coverage` (see .aidev/README.md): they call
# a Hive node, unreachable under --network none. Client.testnet() is
# https://testnet.openhive.network; TEST_NODE (test/common.ts) defaults to
# https://api.hive.blog. client.ts also reaches wrongapi.hive.blog and
# hive-test-beeabode.roelandp.nl.
TESTS_NEED_NETWORK=(
    test/blockchain.ts    # new Client(TEST_NODE): block/operation streams
    test/broadcast.ts     # Client.testnet(): broadcasts from testnet accounts
    test/client.ts        # rpc calls, failover between live nodes
    test/database.ts      # Client.testnet() and new Client(TEST_NODE)
    test/hivemind.ts      # Client.testnet() and new Client(TEST_NODE)
    test/key.ts           # Client.testnet(): account_by_key_api
    test/operations.ts    # Client.testnet(): creates accounts, broadcasts
    test/transaction.ts   # Client.testnet(): transaction_status_api
)
MOCHA_TIMEOUT="${MOCHA_TIMEOUT:-20000}"

offline_tests() {
    local skipped=" ${TESTS_NEED_NETWORK[*]} " f
    for f in test/*.ts; do
        case "$skipped" in *" $f "*) continue ;; esac
        echo "$f"
    done
}
mapfile -t OFFLINE_TESTS < <(offline_tests)
MOCHA_ARGS=(--exit --timeout "$MOCHA_TIMEOUT" --require tsx/cjs -r test/_node.js
    --reporter xunit --reporter-option "output=$out/mocha-xunit.xml" "${OFFLINE_TESTS[@]}")
# Run directly or under nyc; nyc's child does not inherit bash's exported
# functions, so it gets the command itself, not a function.
mocha_offline() {
    "$@" mocha "${MOCHA_ARGS[@]}" \
        && echo "mocha: ${#OFFLINE_TESTS[@]} files, xunit in $out/mocha-xunit.xml" \
        || { rc=$?; grep -E '<failure|<testsuite' "$out/mocha-xunit.xml" 2>/dev/null | head -40; return $rc; }
}
bundle() {
    browserify src/index-browser.ts --debug --full-paths --standalone dhive --plugin tsify \
        --transform [ babelify --extensions .ts ] | derequire > "$out/dhive.js" \
        && [ -s "$out/dhive.js" ] && ls -l "$out/dhive.js"
}

status=0
record() { # name rc seconds log
    if [ "$2" -eq 0 ]; then
        printf 'case\t%s\tpass\t%s\t\n' "$1" "$3" >> "$cases"
    else
        status=1
        printf 'case\t%s\tfail\t%s\texit %s\t%s\n' "$1" "$3" "$2" "$4" >> "$cases"
    fi
}
step() {
    local name="$1"; shift
    local log="$out/$name.log" t0=$SECONDS rc=0
    echo "== $name" >&2
    ( cd "$root" && "$@" ) > "$log" 2>&1 < /dev/null || rc=$?
    [ "$rc" -eq 0 ] || tail -40 "$log" >&2
    record "$name" "$rc" "$((SECONDS - t0))" "$log"
    return "$rc"
}

# The install is a case of its own: a lockfile the image's store cannot serve
# fails here, not as a missing tool in a later step.
t0=$SECONDS
if ! ( source "$root/.aidev/pnpm-deps.sh" ) > "$out/install.log" 2>&1; then
    tail -40 "$out/install.log" >&2
    record install 1 "$((SECONDS - t0))" "$out/install.log"
    junit_write_cases "$out/junit.xml" "$suite" "$cases"
    exit 1
fi
record install 0 "$((SECONDS - t0))" "$out/install.log"

for s in "$@"; do
    case "$s" in
        lint) step lint bash -c 'eslint -c .eslintrc.json src/**/*.ts' ;;
        build) step build bash -c 'rm -rf lib && make lib' ;;
        bundle) step bundle bundle ;;
        test) step test mocha_offline ;;
        coverage) step coverage mocha_offline nyc --temp-dir "$out/nyc-temp" --report-dir "$out/coverage" \
            -r lcov -r text-summary -e .ts -i tsx/cjs ;;
        *) printf 'case\t%s\tfail\t0\tunknown step\n' "$s" >> "$cases"; status=1 ;;
    esac
done
junit_write_cases "$out/junit.xml" "$suite" "$cases"
exit "$status"
