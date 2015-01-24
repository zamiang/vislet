express = require 'express'
Backbone = require 'backbone'
sharify = require 'sharify'
path = require 'path'
bucketAssets = require('bucket-assets')
fs = require 'fs'

{ NODE_ENV, CDN_URL, S3_KEY, S3_SECRET } = config = require "../config"

module.exports = (app) ->

  # Inject some configuration & constant data into sharify
  sd = sharify.data =
    NODE_ENV: NODE_ENV
    JS_EXT: if "production" is NODE_ENV then ".min.js" else ".js"
    CSS_EXT: if "production" is NODE_ENV then ".min.css" else ".css"

  # Override Backbone to use server-side sync
  # Backbone.sync = require 'backbone-super-sync'

  # Mount sharify
  app.use sharify

  app.use(bucketAssets(
    files: __dirname + '/**/*/public/**/*'
    root: 'public'
    key: S3_KEY
    secret: S3_SECRET
    bucket: 'vislet-production'
    cdnUrl: CDN_URL
  ))

  # Development only
  if 'development' is NODE_ENV
    # Compile assets on request in development
    app.use require('stylus').middleware
      src: path.resolve(__dirname, '../')
      dest: path.resolve(__dirname, '../public')
    app.use require('browserify-dev-middleware')
      src: path.resolve(__dirname, '../')
      transforms: [require('jadeify'), require('caching-coffeeify')]

  # Test only
  if 'test' is NODE_ENV
    # Mount fake API server
    app.use '/__api', require('../test/helpers/integration.coffee').api

  # Mount apps
  app.use require '../apps/home'
  app.use require '../apps/brooklyn'
  app.use require '../apps/chicago'
  app.use require '../apps/311'

  # Mount static middleware for sub apps, components, and project-wide
  fs.readdirSync(path.resolve __dirname, '../apps').forEach (fld) ->
    app.use express.static(path.resolve __dirname, "../apps/#{fld}/public")
  fs.readdirSync(path.resolve __dirname, '../components').forEach (fld) ->
    app.use express.static(path.resolve __dirname, "../components/#{fld}/public")
  app.use express.static(path.resolve __dirname, '../public')
