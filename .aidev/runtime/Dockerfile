# The image AIDEV runs this project's suites in (`environment.image` in
# .aidev/project.yaml). Suites run with `--network none` and the caller's uid, so
# everything they need is in the image.
#
# Node comes from common-ci-configuration's node-test-tools image, the one hive's
# CI templates use; this file pins no Node version of its own. dhive installs with
# yarn classic (yarn.lock) and builds with make, neither of which that image has,
# so this adds `make` and yarn 1, and a yarn cache filled by a frozen install of
# yarn.lock, so `yarn install --offline --frozen-lockfile` links node_modules in
# the sandbox. Install scripts are not run (here or in the sandbox): the only one
# that matters, secp256k1's native build, falls back to its pure-JS
# implementation, and the others (core-js's banner) do nothing the suites need.
#
# .aidev/runtime/build.sh builds it on the digest node-test-tools:develop names at
# the time; the result is pinned as `environment.image`. Rebuild it whenever
# yarn.lock changes (or, once dhive moves to pnpm, rewrite it the way the pnpm
# projects' runtimes are written).
ARG BASE_IMAGE=registry.gitlab.syncad.com/hive/common-ci-configuration/node-test-tools:develop
FROM ${BASE_IMAGE}
USER root
# The suite runs as an arbitrary uid with no passwd entry, so HOME must be a
# directory anyone can write.
ENV HOME=/tmp \
    YARN_CACHE_FOLDER=/opt/yarn-cache \
    CI=1 \
    DO_NOT_TRACK=1
RUN apt-get update \
    && apt-get install -y --no-install-recommends make \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g --no-fund --no-audit yarn@1.22.22 \
    && yarn --version
COPY package.json yarn.lock /tmp/yarn-fetch/
RUN cd /tmp/yarn-fetch \
    && yarn install --frozen-lockfile --ignore-scripts --non-interactive --no-progress \
    && cd / && rm -rf /tmp/yarn-fetch /tmp/.npm /tmp/.cache /tmp/.yarn* \
    && chmod -R a+rwX /opt/yarn-cache
