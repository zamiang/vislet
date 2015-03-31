fs = require('fs')
formatDisplayData = require './script/format-display-data.coffee'
{ features } = require('./data/census-block-by-district.json')
rawVotes = require('./data/vote-tally.json')

console.log 'about to process'
data = formatDisplayData.getData features, rawVotes
console.log 'processed - about to save'
fs.writeFile "./data/display-data.json", JSON.stringify(data), (err) ->
   if (err)
     console.log(err)
   else
     console.log("The file was saved!")
