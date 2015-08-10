# Vislet

This is an [Ezel](https://github.com/artsy/ezel) project setup to be a
static site deployed via [gulp](http://gulpjs.com/) to S3. It serves as an
example of a workflow for developing static sites that require
rich interaction and unique asset packages per page.

## Development workflow

To get started:
- `$ npm -g install gulp`
- `$ npm install`
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
Deploy by running `gulp deploy`. Deploy will:

1. freshly compile all assets and html files to ./dest
1. generate asset hash for individual assets
1. move assets to ./public and rename files to include asset hash
1. move html files to ./public
1. update references to assets in *.html
1. compress assets using uglify
1. upload assets, images and html to s3

## TODO

- Gulp should run tests
- auto-deploy on commit via Travis
