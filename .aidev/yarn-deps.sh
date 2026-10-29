# Sourced by run-checks.sh from the repository root: bring node_modules up to
# date with yarn.lock from the image's yarn cache, offline and frozen (CI's
# `yarn install --frozen-lockfile`, without install scripts; see
# .aidev/runtime/Dockerfile). A marker records package.json, the lockfile and
# Node it was installed for; it is written only after an install that
# succeeded, and an install whose tools don't resolve is redone.
lock_id="$(cat package.json yarn.lock | sha256sum | cut -d' ' -f1) $(node --version)"
marker=node_modules/.aidev-yarn-lock
tools_present() {
    local t
    for t in tsc eslint mocha nyc ts-node browserify derequire; do
        [ -x "node_modules/.bin/$t" ] || { echo "node_modules/.bin/$t missing" >&2; return 1; }
    done
}
if [ "$(cat "$marker" 2>/dev/null)" != "$lock_id" ] || ! tools_present 2>/dev/null; then
    echo "node_modules is not current for yarn.lock: yarn install --offline --frozen-lockfile" >&2
    yarn install --offline --frozen-lockfile --ignore-scripts --non-interactive --no-progress < /dev/null || return 1
    tools_present || return 1
    printf '%s\n' "$lock_id" > "$marker.tmp" && mv "$marker.tmp" "$marker"
fi
