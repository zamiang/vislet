Backbone = require 'backbone'
moment = require 'moment'
_ = require 'underscore'
_s = require 'underscore.string'

# {
# "buildingClass":"01  ONE FAMILY DWELLINGS",
# "taxClass":"1",
# "block":6363,
# "lot":119,
# "apartmentNumber":null,
# "residentialUnits":1,
# "commercialUnits":0,
# "totalUnits":1,
# "landSqFt":"2,058",
# "grossSqFt":"1,492",
# "built":1930,
# "taxClassAtSale":1,
# "buildingCode":"A9",
# "zip":11214,
# "price":"$670,000",
# "date":1397620800000,
# "bbl":3063630119,
# "ntaCode":"BK27",
# "ntaName":"Bath Beach"
# }

module.exports = class Sale extends Backbone.Model

  initialize: ->
    @set
      'buildingClass': _s.trim(@get('buildingCl'))

    @setupDate()
    @setupPricePerSqFt()

  setupPricePerSqFt: ->
    if @get('price') && @get('grossSqFt')
      price = Number(String(@get('price')).replace('$', '').replace(',', '').replace(',', '').replace(',', ''))
      sqft = Number(String(@get('grossSqFt')).replace(',', '').replace(',', ''))
      minSqFt = 300
      maxSqFt = 10000
      minPrice = 10000

      @set
        price: price
        sqft: sqft

      if sqft > maxSqFt or sqft < minSqFt or price < minPrice
        # Probably transfer of owership or residential land sale
        # console.log "Excluded:", price, sqft, @get('landSqFt'), @get('ntacode')
        return

      if price / sqft < 30
        # Not sure what is going on here
        # console.log "Excluded:", price, sqft, @get('landSqFt'), @get('ntacode')
        return

      @set
        pricePerSqFt: price / sqft

  setupDate: ->
    date = moment(Math.floor(@get('date'))).add(5, 'hours')
    @set
      quarter: date.quarter()
      month: date.months()
      year: date.year()
