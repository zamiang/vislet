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

    if date.year() > 2009 && date.year() < 2015
      initials = getInitials(json['Complaint'], 3).toLowerCase()

      # Merge heat/hot water with heat since the term changed in 2014
      if initials == 'heawat'
        initials = 'heat'

      # Merge damaged and dead tree and overgrown tree
      if initials == 'damtre' or initials == 'ovetre'
        initials = 'deatre'

      if initials == 'miscol(almat'
        initials = 'miscol'

      # Merge street light condition and traffic signal condition
      if initials == 'trasigcon'
        initials = 'strligcon'

      # Merge commercial noise with noise
      if initials == 'noi-con' or initials == 'noi-str'
        initials = 'nois'

      threeData.push {
        complaintType: initials
        nta: json.ntacode
        month: date.months() + 1
        year: date.year()
        hour: date.hours()
      }

lr.on 'end', ->
  # All lines are read, file is closed now.
  console.log threeData.length

  if preProcess
    ## Complaint types
    complaints = {}
    for item in threeData
      complaints[item['complaint']] = getInitials(item['complaint'], 3).toLowerCase()

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
