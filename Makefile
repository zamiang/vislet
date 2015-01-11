#
# Make -- the OG build tool.
# Add any build tasks here and abstract complex build scripts into `lib` that
# can be run in a Makefile task like `coffee lib/build_script`.
#
# Remember to set your text editor to use 4 size non-soft tabs.
#

BIN = node_modules/.bin
CDN_DOMAIN_production = d150vr5z67ra23
MIN_FILE_SIZE = 1000

# Start the server
s:
	$(BIN)/coffee index.coffee

# Run all of the project-level tests, followed by app-level tests
test: assets
	$(BIN)/mocha $(shell find test -name '*.coffee' -not -path 'test/helpers/*')
	$(BIN)/mocha $(shell find apps/*/test -name '*.coffee' -not -path 'test/helpers/*')

# Generate minified assets from the /assets folder and output it to /public.
assets:
	mkdir -p public/assets
	$(foreach file, $(shell find assets -name '*.coffee' | cut -d '.' -f 1), \
		$(BIN)/browserify $(file).coffee -t jadeify -t caching-coffeeify > public/$(file).js; \
		$(BIN)/uglifyjs public/$(file).js > public/$(file).min.js; \
		gzip -f public/$(file).min.js; \
	)
	$(BIN)/stylus assets -o public/assets
	$(foreach file, $(shell find assets -name '*.styl' | cut -d '.' -f 1), \
		$(BIN)/sqwish public/$(file).css -o public/$(file).min.css; \
		gzip -f public/$(file).min.css; \
	)

# TODO: Put this in a foreach and iterate through all js and css files
verify:
	if [ $(shell wc -c < public/assets/chicago.min.css.gz) -gt $(MIN_FILE_SIZE) ] ; then echo ; echo "Chicago CSS exists" ; else echo ; echo "Chicago CSS asset compilation failed" ; exit 1 ; fi
	if [ $(shell wc -c < public/assets/chicago.min.js.gz) -gt  $(MIN_FILE_SIZE) ] ; then echo ; echo "Chicago JS exists" ; else echo; echo "Chicago JS asset compilation failed" ; exit 1 ; fi

# Runs all the necessary build tasks to push to staging or production.
# Run with `make deploy env=staging` or `make deploy env=production`.
deploy: assets verify
	$(BIN)/bucketassets --files **/public/** -s $(S3_SECRET) -k $(S3_KEY) -b vislet-production
	git push git@heroku.com:vislet-production.git master
	heroku config:add COMMIT_HASH=$(shell git rev-parse --short HEAD) --app=vislet-production

.PHONY: test assets
