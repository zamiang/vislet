module.exports =
  NODE_ENV: 'development'
  PORT: '4000'
  APP_URL: 'http://www.vislet.com'
  ASSET_PATH: '/assets/'
  NYC_API_ID: null
  NYC_API_KEY: null

# Override any values with env variables if they exist.
# You can set JSON-y values for env variables as well such as "true" or
# "['foo']" and config will attempt to JSON.parse them into non-string types.
for key, val of module.exports
  val = (process.env[key] or val)
  module.exports[key] = try JSON.parse(val) catch then val

# Warn if this file is included client-side
alert("WARNING: Do not require config.coffee, please require('sharify').data instead.") if window?
