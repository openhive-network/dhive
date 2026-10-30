#!/usr/bin/env bash
# Build (and with --push, publish) the test runtime image of .aidev/runtime/Dockerfile
# and print the digest-pinned reference to put in .aidev/project.yaml's
# `environment.image`. See .aidev/README.md.
#
# The tag is `aidev-<hash>` of the image inputs (the Dockerfile, the files it
# copies, and the digest the followed base tag names now). When
# <repository>:aidev-<hash> is already in the registry nothing is built: the
# script prints its digest.
#
#   .aidev/runtime/build.sh           # registry digest, or build locally and print the local tag
#   .aidev/runtime/build.sh --push    # registry digest, or build + push and print repo@sha256:<digest>
#   .aidev/runtime/build.sh --tag     # print the input-hash tag only
#
# AIDEV_RUNTIME_BUILDER names a buildx builder (e.g. a region builder whose
# mirror serves registry.gitlab.syncad.com); the current builder otherwise.
set -euo pipefail
cd "$(dirname "$0")/../.."
REPOSITORY="${AIDEV_RUNTIME_REPOSITORY:-registry.gitlab.syncad.com/hive/dhive/aidev-tests}"
BASE_IMAGE="$(sed -n 's/^ARG BASE_IMAGE=//p' .aidev/runtime/Dockerfile)"
# The files the Dockerfile copies (its build context holds only these).
CONTEXT_FILES=(package.json yarn.lock)
INPUTS=(.aidev/runtime/Dockerfile "${CONTEXT_FILES[@]}")
input_hash() {
    local base_digest
    base_digest="$(docker buildx imagetools inspect "$BASE_IMAGE" --format '{{json .Manifest}}' \
        | grep -o '"digest": *"sha256:[0-9a-f]*"' | head -1 | grep -o 'sha256:[0-9a-f]*')"
    {
        sha256sum "${INPUTS[@]}"
        echo "${base_digest:?cannot resolve $BASE_IMAGE}"
    } | sha256sum | cut -c1-16
}
TAG="aidev-$(input_hash)"
case "${1:-}" in
    --tag) echo "$TAG"; exit 0 ;;
    ""|--push) ;;
    *) echo "usage: $0 [--push|--tag]" >&2; exit 2 ;;
esac
registry_digest() {
    docker buildx imagetools inspect "$REPOSITORY:$TAG" --format '{{json .Manifest}}' 2>/dev/null \
        | grep -o '"digest": *"sha256:[0-9a-f]*"' | head -1 | grep -o 'sha256:[0-9a-f]*' || true
}
digest="$(registry_digest)"
if [ -n "$digest" ]; then
    echo "$REPOSITORY:$TAG exists in the registry; not building" >&2
    echo "$REPOSITORY@$digest"
    exit 0
fi
echo "$REPOSITORY:$TAG is not in the registry; building it" >&2
context="$(mktemp -d)"
trap 'rm -rf "$context"' EXIT
# Only the files the Dockerfile copies: the repository root holds node_modules.
cp -L "${CONTEXT_FILES[@]}" "$context/"
build=(docker buildx build --pull --provenance=false -f .aidev/runtime/Dockerfile -t "$REPOSITORY:$TAG")
[ -z "${AIDEV_RUNTIME_BUILDER:-}" ] || build+=(--builder "$AIDEV_RUNTIME_BUILDER")
if [ "${1:-}" != "--push" ]; then
    "${build[@]}" --load "$context" >&2
    echo "$REPOSITORY:$TAG"
    exit 0
fi
"${build[@]}" --push --metadata-file "$context/metadata.json" "$context" >&2
digest="$(grep -o '"containerimage.digest": *"sha256:[0-9a-f]*"' "$context/metadata.json" | grep -o 'sha256:[0-9a-f]*')"
echo "$REPOSITORY@${digest:?no digest in buildx metadata}"
