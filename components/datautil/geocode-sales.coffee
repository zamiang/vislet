sales = require('../../brooklyn-sales-geo.json')
bblHash = require('../../bbl-to-lat-long.json')
blockLotHash = require('../../block-lot-to-bbl.json')
{ formatBBL } = require('../numberutils/bbl.coffee')
fs = require('fs')

# Keep track of success and failure
successCount = 0
failCount = 0
noCoords = 0
total = 0

# Takes sales that have not been geocoded and adds that information to them
data = for sale in sales
  total++
  unless sale.coords
    noCoords++
    sale.bbl = blockLotHash["#{sale.block}-#{sale.lot}"]
    # sale.bbl = formatBBL(3, sale.block, sale.lot)
    if bblHash[sale.bbl]
      sale.coords = bblHash[sale.bbl]
      successCount++
    else
      failCount++
  sale

fs.writeFile "./brooklyn-sales-geo.json", JSON.stringify(data), (err) ->
  console.log "total: #{total} - success: #{successCount} - fail: #{failCount} - nocoords: #{noCoords}"
  if (err)
    console.log(err)
  else
    console.log("The file was saved!")
