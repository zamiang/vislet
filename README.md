# Vislet

This is an [Ezel](https://github.com/artsy/ezel) project setup to be a
static site deployed via [gulp](http://gulpjs.com/) to S3. It serves as an
example of a workflow for developing static sites that require
rich interaction.

## Development workflow

To get started:
- `$ npm -g install gulp`
- Run the server with `$ gulp server`
- In a new tab, run `$ gulp watch`

./dest contains assets for development

./public contains assets for production

## Deploying

To deploy, create an `aws.json` file like so
```json
{
  "key": "key",
  "secret": "secret",
  "bucket": "www.url.com",
  "region": "us-east-1"
}
```
Deploy by running `gulp deploy`. Gulp deploy will:

1. freshly compile the assets and html files to ./dest
2. generate asset hash and move to ./public
3. update references to assets in *.html files and move html files to ./public
4. compress assets using uglify
5. upload assets and html to s3

## TODO

- Gulp should run tests
- Should auto-deploy on commit via Travis
