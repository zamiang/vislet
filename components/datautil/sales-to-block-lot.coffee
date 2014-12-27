sales = require('../../brooklyn-sales-clean.json')
fs = require('fs')

data = for item in sales
  [item.block, item.lot]

fs.writeFile "./block-lot.json", JSON.stringify(data), (err) ->
  if (err)
    console.log(err)
  else
    console.log("The file was saved!")
