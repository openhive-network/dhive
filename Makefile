
SHELL := /bin/bash
PATH  := ./node_modules/.bin:$(PATH)

SRC_FILES := $(shell find src -name '*.ts')

VERSION := $(shell node -p 'require("./package.json").version')

define VERSION_TEMPLATE
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = '$(VERSION)';
endef

all: lib bundle docs

export VERSION_TEMPLATE
lib: $(SRC_FILES) tsconfig.json tsconfig.esm.json node_modules
	tsc -p tsconfig.json --outDir lib && \
	echo "$$VERSION_TEMPLATE" > lib/version.js && \
	tsc -p tsconfig.esm.json && \
	echo "export default '$(VERSION)';" > lib/esm/version.js
	touch lib

dist/%.js: lib
	browserify $(filter-out $<,$^) --debug \
		--standalone dhive --plugin tsify \
		--transform [ babelify --extensions .ts ] \
		| derequire > $@
	terser $@ \
		--source-map "content=inline,url=$(notdir $@).map,filename=$@.map" \
		--compress "dead_code,collapse_vars,reduce_vars,keep_infinity,drop_console,passes=2" \
		--output $@ || rm $@

dist/dhive.js: src/index-browser.ts

dist/dhive.d.ts: $(SRC_FILES) node_modules
	dts-generator --name dhive --project . --out dist/dhive.d.ts
	perl -i -pe"s@'dhive/index'@'dhive'@g" dist/dhive.d.ts

dist/%.gz: dist/dhive.js
	gzip -9 -n -f -c $(basename $@) > $(basename $@).gz

bundle: dist/dhive.js.gz dist/dhive.d.ts

.PHONY: coverage
coverage: lib
	nyc -r html -r text -e .ts -i tsx/cjs mocha --exit --reporter nyan --require tsx/cjs test/*.ts

.PHONY: test
test: lib
	mocha --exit --require tsx/cjs -r test/_node.js test/*.ts --grep '$(grep)'

.PHONY: ci-test
ci-test: eslint lib
	nyc -r lcov -e .ts -i tsx/cjs mocha --exit --reporter tap --require tsx/cjs test/*.ts

# Test files that call a live Hive node (api.hive.blog, testnet.openhive.network
# and the failover nodes in test/client.ts); unit-test leaves them out.
NETWORK_TESTS := test/blockchain.ts test/broadcast.ts test/client.ts test/database.ts \
	test/hivemind.ts test/key.ts test/operations.ts test/transaction.ts
UNIT_TESTS := $(filter-out $(NETWORK_TESTS),$(wildcard test/*.ts))

# test/package.ts imports the built package (lib/ and lib/esm/) as consumers do.
.PHONY: unit-test
unit-test: lib
	mkdir -p reports
	mocha --exit --timeout 20000 --require tsx/cjs -r test/_node.js \
		--reporter xunit --reporter-option output=reports/unit-tests.xml $(UNIT_TESTS)

.PHONY: check-reproducible-bundle
check-reproducible-bundle:
	test/reproducible-bundle.sh

.PHONY: eslint
eslint: node_modules
	eslint -c .eslintrc.json src/**/*.ts

.PHONY: browser-test
browser-test: dist/dhive.js
	BUILD_NUMBER="$$(git rev-parse --short HEAD)-$$(date +%s)" \
		karma start test/_karma-sauce.js

.PHONY: browser-test-local
browser-test-local: dist/dhive.js
	karma start test/_karma.js

.PHONY: lint
lint: node_modules
	tslint -p tsconfig.json -c tslint.json -t stylish --fix

node_modules:
	pnpm install --frozen-lockfile

docs: $(SRC_FILES) node_modules
	typedoc --gitRevision master --out docs src/index.ts
	find docs -name "*.html" | xargs perl -i -pe's~$(shell pwd)~.~g'
	echo "Served at <https://openhive-network.github.io/dhive>" > docs/README.md
	touch docs

.PHONY: clean
clean:
	rm -rf lib/
	rm -f dist/*
	rm -rf docs/

.PHONY: distclean
distclean: clean
	rm -rf node_modules/
