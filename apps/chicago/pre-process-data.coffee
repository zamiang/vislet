fs = require('fs')
moment = require 'moment'
crimesData = []
preProcess = false

LineByLineReader = require('line-by-line')
lr = new LineByLineReader('./data/chicago-crimes.json')

lr.on 'error', (error) ->
  console.log error, 'error'

lr.on 'line', (line) ->
  # { "type": "Feature", "properties": { "field_1": 633, "ID": 9559040, "Case Numbe": "HX210435", "Date": "04\/04\/2014 08:30:00 AM", "Block": "018XX S KEELER AVE", "IUCR": "555", "Primary Ty": "ASSAULT", "Descriptio": "AGG PRO.EMP: HANDGUN", "Location D": "SCHOOL, PUBLIC, BUILDING", "Arrest": "FALSE", "Domestic": "FALSE", "Beat": 1012, "District": 10, "Ward": 24, "Community": 29, "FBI Code": "04A", "Year": 2014, "Updated On": "04\/06\/2014 12:38:43 AM", "x": 41.856079, "y": -87.729905, "date_1": "2014-04-04", "PRI_NEIGH": "North Lawndale", "SEC_NEIGH": "NORTH LAWNDALE" }, "geometry": { "type": "Point", "coordinates": [ -87.729904706964874, 41.856079258615807 ] } },
  if line.length > 1
    line = line.replace('} },', '} }')
    json = JSON.parse(line).properties

    date = moment(json['Date'], 'MM/DD/YYYY hh:mm:SS A')

    crimesData.push {
      crimeType: getInitials(json['Primary Ty'])
      nta: getInitials(json['PRI_NEIGH'])
      # quarter: date.quarter()
      month: date.months() + 1
      year: date.year()
    }

lr.on 'end', ->
  console.log 'about to write file'
  fs.writeFile "./data/chicago-crimes-clean.json", JSON.stringify(crimesData), (err) ->
    if (err)
      console.log(err)
    else
      console.log("The file was saved!")
