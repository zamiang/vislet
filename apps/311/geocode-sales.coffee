sales = require('./data/raw-brooklyn-sales.json')
bblHash = require('./data/bbl-to-lat-long.json')
blockLotHash = require('./data/block-lot-to-bbl.json')
{ formatBBL } = require('../../components/numberutils/bbl.coffee')
fs = require('fs')
_s = require 'underscore.string'

# Keep track of success and failure
successCount = 0
failCount = 0
noCoords = 0
total = 0

# Takes sales that have not been geocoded and adds that information to them
data = for sale in sales
  total++
  unless sale.x
    noCoords++
    if sale.BLOCK
      sale.bbl = blockLotHash["#{sale.BLOCK}-#{sale.LOT}"]
    else if sale.block
      sale.bbl = blockLotHash["#{sale.block}-#{sale.lot}"]
    sale.bbl ||= formatBBL(3, sale.BLOCK, sale.LOT)
    if bblHash[sale.bbl]
      sale.x = bblHash[sale.bbl][0]
      sale.y = bblHash[sale.bbl][1]
      successCount++
    else
      failCount++
  sale

cleanSales =
  type: "FeatureCollection"
  crs:
    type: "name"
    properties: { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" }
  features: []

salesWithCoords = data.filter((item) -> if item.x then true else false)

cleanSales.features = for sale in salesWithCoords
  {
    type: 'Feature'
    properties:
      buildingClass: _s.trim(sale['BUILDING CLASS CATEGORY'])
      bbl: sale.bbl
      block: sale['BLOCK']
      lot: sale['LOT']
      residential: sale['RESIDENTIAL UNITS']
      commercial: sale['COMMERCIAL UNITS']
      landSqFt: sale['LAND SQUARE FEET']
      grossSqFt: sale['GROSS SQUARE FEET']
      built: sale['YEAR BUILT']
      price: sale['SALE PRICE']
      date: new Date(sale['SALE DATE']).valueOf()
   geometry:
     type: "Point"
     coordinates: [sale.y, sale.x]
  }

fs.writeFile "./apps/brooklyn/data/brooklyn-sales-geo.geojson", JSON.stringify(cleanSales), (err) ->
  console.log "total: #{total} - success: #{successCount} - fail: #{failCount} - nocoords: #{noCoords}"
  if (err)
    console.log(err)
  else
    console.log("The file was saved!")
