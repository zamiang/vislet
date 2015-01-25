fs = require('fs')
moment = require('moment')
threeData = []
preProcess = false
formatDisplayData = require './script/format-display-data.coffee'
getInitials = require '../../components/datautil/get-initials.coffee'

LineByLineReader = require('line-by-line')
lr = new LineByLineReader('./data/311-by-neighborhood.json')

lr.on 'error', (error) ->
  console.log error, 'error'

lr.on 'line', (line) ->
  # { "type": "Feature", "properties": { "Created Da": "01\/22\/2015 02:15:20 AM", "Complaint": "Rodent", "Descriptor": "Rat Sighting", "ntacode": "BX75" }, "geometry": { "type": "Point", "coordinates": [ -73.884723615114126, 40.835408138863833 ] } },
  if line.length > 1
    json = JSON.parse(line.replace('} },', "} }")).properties
    date = moment(json['Created Da'], 'MM/DD/YYYY hh:mm:SS A')

    threeData.push {
      complaintType: getInitials(json['Complaint'], 3)
      nta: json.ntacode
      month: date.months() + 1
      year: date.year()
    }

lr.on 'end', ->
  # All lines are read, file is closed now.
  console.log threeData.length

  if preProcess
    ## Complaint types
    complaints = {}
    for item in threeData
      complaints[item['complaintType']] = getInitials(item['complaintType'], 3)

    console.log complaints

    fs.writeFile "./data/complaint-types.json", JSON.stringify(complaints), (err) ->
      if (err)
        console.log(err)
      else
        console.log("The file was saved!")

  ## process 311 data
  else
    console.log 'about to process'
    three = formatDisplayData.getData threeData
    console.log 'processed - about to save'
    fs.writeFile "./data/display-data.json", JSON.stringify(three), (err) ->
      if (err)
        console.log(err)
      else
        console.log("The file was saved!")
