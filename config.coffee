module.exports =
  NODE_ENV: 'development'
  PORT: '4000'
  APP_URL: 'http://www.vislet.com'
  NYC_API_ID: null
  NYC_API_KEY: null
  REDIS_URL: null
  CDN_URL: '//d150vr5z67ra23.cloudfront.net/'
  S3_KEY: null
  S3_SECRET: null

for key, val of module.exports
  val = (process.env[key] or val)
  module.exports[key] = try JSON.parse(val) catch then val

# Warn if this file is included client-side
alert("WARNING: Do not require config.coffee, please require('sharify').data instead.") if window?
