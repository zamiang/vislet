{ NODE_ENV, REDIS_URL } = require "../config"

module.exports = (->
  redis = require("redis")
  if NODE_ENV == 'development'
    client = redis.createClient()
  else if NODE_ENV != 'test'
    red = require('url').parse(REDIS_URL || '')
    client = redis.createClient(red.port, red.hostname)
    client.auth(red.auth.split(':')[1])
  client
)()
