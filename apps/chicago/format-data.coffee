fs = require('fs')
data = require './data/chicago-crimes.json'
CrimesCollection = require './collections/crimes.coffee'

crimesData =
  for item in data.features
    item.properties

if false
  ## Crime Types
  crimeTypes = {}
  for item in crimesData
    crimeTypes[item['Primary Ty']] = item['Primary Ty'].substring(0,2)

  console.log crimeTypes

  fs.writeFile "./apps/chicago/data/crime-types.json", JSON.stringify(crimeTypes), (err) ->
    if (err)
      console.log(err)
    else
      console.log("The file was saved!")

  ## Neighborhood Names
  getInitials = (name) ->
    if name.split(' ').length > 1
      (for item in name.split(' ')
        item.substring(0,1)
      ).join('')
    else
      name.substring(0, 3)

  neighborhoodNames = {}
  for item in crimesData
    neighborhoodNames[item['PRI_NEIGH']] = getInitials(item['PRI_NEIGH'])

  console.log neighborhoodNames

  fs.writeFile "./apps/chicago/data/neighborhood-names.json", JSON.stringify(neighborhoodNames), (err) ->
    if (err)
      console.log(err)
    else
      console.log("The file was saved!")

## process crime data
console.log crimesData.length
crimes = new CrimesCollection crimesData

fs.writeFile "./apps/chicago/data/chicago-crimes-display-data.json", JSON.stringify(crimes.getCrimesData()), (err) ->
  if (err)
    console.log(err)
  else
    console.log("The file was saved!")
