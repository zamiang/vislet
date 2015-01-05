Backbone = require 'backbone'
moment = require 'moment'

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
    @setupDate()

  setupDate: ->
    # Dates are 5 hours off (EST) and need to be reset to GMT
    date = moment(@get('date')).add(5, 'hours')
    @set
      quarter: date.quarter()
      month: date.months()
      year: date.year()
