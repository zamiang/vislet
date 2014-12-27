sales = require('../../brooklyn-sales-geo.json')
{ formatBBL } = require('../numberutils/bbl.coffee')
fs = require('fs')

bbls = {}

blockLot = sales
  .filter((sale) ->
    if sale.coords[0]
      false
    else if bbls[formatBBL(sale.block, sale.lot)]
      false
    else
      bbls[formatBBL(sale.block, sale.lot)] = true
      true
  )
  .map (sale) -> [sale.block,sale.lot]

console.log blockLot.length, 'missing'

fs.writeFile "./missing-bbl.json", JSON.stringify(blockLot), (err) ->
  if (err)
    console.log(err)
  else
    console.log("The file was saved!")
