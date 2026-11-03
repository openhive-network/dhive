#!/usr/bin/env bash
# Build dist/dhive.js in two fresh copies of this checkout at different paths and
# check the bundles are byte-identical and name neither build directory.
#
#   test/reproducible-bundle.sh   (or `make check-reproducible-bundle`)
#
# Each copy gets its own `pnpm install --prefer-offline --frozen-lockfile`, so the pnpm
# store must already hold the lockfile's packages. The copies are removed on exit.
set -euo pipefail
cd "$(dirname "$0")/.."
work="$(mktemp -d "${TMPDIR:-/tmp}/dhive-repro.XXXXXX")"
trap 'rm -rf "$work"' EXIT

dirs=("$work/a" "$work/second/checkout/dhive")
for dir in "${dirs[@]}"; do
    mkdir -p "$dir"
    tar -c --exclude=./node_modules --exclude=./lib --exclude=./dist --exclude=./docs \
        --exclude=./test-results --exclude=./reports --exclude=./.git . | tar -x -C "$dir"
    mkdir "$dir/dist"
    echo "== building in $dir" >&2
    ( cd "$dir" && pnpm install --prefer-offline --frozen-lockfile --ignore-scripts --reporter=append-only < /dev/null \
        && make dist/dhive.js ) > "$dir.log" 2>&1 || { tail -40 "$dir.log" >&2; exit 1; }
done

status=0
if cmp "${dirs[0]}/dist/dhive.js" "${dirs[1]}/dist/dhive.js"; then
    echo "dist/dhive.js is byte-identical: $(wc -c < "${dirs[0]}/dist/dhive.js") bytes"
else
    status=1
fi
if grep -qF "$work" "${dirs[0]}/dist/dhive.js" "${dirs[1]}/dist/dhive.js"; then
    echo "dist/dhive.js names its build directory" >&2
    status=1
fi
exit "$status"
