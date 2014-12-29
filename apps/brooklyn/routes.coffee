data = require './data/brooklyn-sales.json'
SalesCollection = require './collections/sales.coffee'
key = 'brooklyn-data'
client = require '../../lib/redis.coffee'

@index = (req, res, next) ->
  client.get key, (err, cachedJSON) ->
    res.locals.sd.SALE_COUNTS =
      if cachedJSON
        cachedJSON
      else
        sales = new SalesCollection(data)
        counts = sales.getCommercialResidentialCounts()
        client.set(key, counts)
        counts
    res.render "index"
