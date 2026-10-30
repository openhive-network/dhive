# The image AIDEV runs this project's suites in (`environment.image` in
# .aidev/project.yaml). Suites run with `--network none` and the caller's uid, so
# everything they need is in the image.
#
# Node and pnpm come from common-ci-configuration's node-test-tools image, the one
# hive's CI templates use; this file pins no version of its own. That image's pnpm
# store (/opt/pnpm-store, npm_config_store_dir) is preloaded with ccc's catalogs;
# this adds `make`, which dhive builds with and the image lacks, and fetches the
# rest of pnpm-lock.yaml into the same store, so
# `pnpm install --offline --frozen-lockfile` links node_modules in the sandbox.
# Install scripts are not run (pnpm 10 runs none that are not approved): the only
# one that matters, secp256k1's native build, falls back to its pure-JS
# implementation.
#
# .aidev/runtime/build.sh builds it on the digest node-test-tools:develop names at
# the time; the result is pinned as `environment.image`. Rebuild it whenever
# pnpm-lock.yaml changes.
ARG BASE_IMAGE=registry.gitlab.syncad.com/hive/common-ci-configuration/node-test-tools:develop
FROM ${BASE_IMAGE}
USER root
# The suite runs as an arbitrary uid with no passwd entry, so HOME must be a
# directory anyone can write.
ENV HOME=/tmp \
    CI=1 \
    DO_NOT_TRACK=1
RUN apt-get update \
    && apt-get install -y --no-install-recommends make \
    && rm -rf /var/lib/apt/lists/*
# pnpm-workspace.yaml is ccc's catalog file (build.sh copies the symlink's target).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml /tmp/pnpm-fetch/
RUN cd /tmp/pnpm-fetch \
    && pnpm --version \
    && pnpm fetch --frozen-lockfile \
    && cd / && rm -rf /tmp/pnpm-fetch /tmp/.cache /tmp/.local /tmp/.npm \
    && chmod -R a+rwX "${npm_config_store_dir}"
