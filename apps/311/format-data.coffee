fs = require('fs')
data = require './data/brooklyn-sales.json'
SalesCollection = require './collections/sales.coffee'

console.log data.features.length
salesData =
  for item in data.features
    item.properties

sales = new SalesCollection salesData

fs.writeFile "./apps/brooklyn/data/brooklyn-sales-display-data.json", JSON.stringify(sales.getSalesData()), (err) ->
  if (err)
    console.log(err)
  else
    console.log("The file was saved!")
