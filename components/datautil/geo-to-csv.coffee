json2csv = require('nice-json2csv')
sales = require('../../brooklyn-sales-geo.json')
fs = require('fs')

data = sales
  .filter((sale) -> if sale.coords?[0] then sale else false)
  .map (sale) ->
    sale.x = sale.coords[0]
    sale.y = sale.coords[1]
    sale.coords = null
    sale

fs.writeFile "./brooklyn-sales-geo.csv", json2csv.convert(data), (err) ->
  if (err)
    console.log(err)
  else
    console.log("The file was saved!")
