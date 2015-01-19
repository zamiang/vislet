fs = require('fs')
CrimesCollection = require './collections/crimes.coffee'
crimesData = []
preProcess = false

LineByLineReader = require('line-by-line')
lr = new LineByLineReader('./data/chicago-crimes.json')

getInitials = (name) ->
  if name.split(' ').length > 1
    (for item in name.split(' ')
      item.substring(0,2)
    ).join('')
  else
    name.substring(0, 3)

lr.on 'error', (error) ->
  console.log error, 'error'

lr.on 'line', (line) ->
  # { "type": "Feature", "properties": { "field_1": 633, "ID": 9559040, "Case Numbe": "HX210435", "Date": "04\/04\/2014 08:30:00 AM", "Block": "018XX S KEELER AVE", "IUCR": "555", "Primary Ty": "ASSAULT", "Descriptio": "AGG PRO.EMP: HANDGUN", "Location D": "SCHOOL, PUBLIC, BUILDING", "Arrest": "FALSE", "Domestic": "FALSE", "Beat": 1012, "District": 10, "Ward": 24, "Community": 29, "FBI Code": "04A", "Year": 2014, "Updated On": "04\/06\/2014 12:38:43 AM", "x": 41.856079, "y": -87.729905, "date_1": "2014-04-04", "PRI_NEIGH": "North Lawndale", "SEC_NEIGH": "NORTH LAWNDALE" }, "geometry": { "type": "Point", "coordinates": [ -87.729904706964874, 41.856079258615807 ] } },
  if line.length > 1
    line = line.replace('} },', '} }')
    json = JSON.parse(line).properties
    crimesData.push {
      date: json['Date']
      crimeType: json['Primary Ty']
      nta: json['PRI_NEIGH']
    }

lr.on 'end', ->
  # All lines are read, file is closed now.
  console.log crimesData.length

  if preProcess
    ## Crime Types
    crimeTypes = {}
    for item in crimesData
      crimeTypes[item['crimeType']] = getInitials(item['crimeType'])

    console.log crimeTypes

    fs.writeFile "./data/crime-types.json", JSON.stringify(crimeTypes), (err) ->
      if (err)
        console.log(err)
      else
        console.log("The file was saved!")

    ## Neighborhood Names
    neighborhoodNames = {}
    for item in crimesData
      neighborhoodNames[item['nta']] = getInitials(item['nta'])

    console.log neighborhoodNames

    fs.writeFile "./data/neighborhood-names.json", JSON.stringify(neighborhoodNames), (err) ->
      if (err)
        console.log(err)
      else
        console.log("The file was saved!")

  ## process crime data
  else
    console.log 'about to process'
    crimes = new CrimesCollection crimesData
    console.log 'processed'
    fs.writeFile "./data/chicago-crimes-display-data.json", JSON.stringify(crimes.getCrimesData()), (err) ->
      if (err)
        console.log(err)
      else
        console.log("The file was saved!")
