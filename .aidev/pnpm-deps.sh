# Sourced by run-checks.sh from the repository root: bring node_modules up to
# date with pnpm-lock.yaml from the image's pnpm store, offline and frozen (CI's
# `pnpm install --frozen-lockfile`, without install scripts; see
# .aidev/runtime/Dockerfile). A marker records package.json, the lockfile, ccc's
# catalogs and Node it was installed for; it is written only after an install that
# succeeded, and an install whose tools don't resolve is redone.
if [ ! -f pnpm-workspace.yaml ]; then
    echo "pnpm-workspace.yaml does not resolve: is the npm-common-config submodule checked out?" >&2
    return 1
fi
lock_id="$(cat package.json pnpm-lock.yaml pnpm-workspace.yaml | sha256sum | cut -d' ' -f1) $(node --version)"
marker=node_modules/.aidev-pnpm-lock
tools_present() {
    local t
    for t in tsc eslint mocha nyc tsx browserify derequire; do
        [ -x "node_modules/.bin/$t" ] || { echo "node_modules/.bin/$t missing" >&2; return 1; }
    done
}
if [ "$(cat "$marker" 2>/dev/null)" != "$lock_id" ] || ! tools_present 2>/dev/null; then
    echo "node_modules is not current for pnpm-lock.yaml: pnpm install --offline --frozen-lockfile" >&2
    pnpm install --offline --frozen-lockfile --ignore-scripts --reporter=append-only < /dev/null || return 1
    tools_present || return 1
    printf '%s\n' "$lock_id" > "$marker.tmp" && mv "$marker.tmp" "$marker"
fi
