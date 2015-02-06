fs = require('fs')
moment = require('moment')
crimesData = []
pastFirstLine = false
formatDisplayData = require './script/format-display-data.coffee'
getInitials = require '../../components/datautil/get-initials.coffee'
LineByLineReader = require('line-by-line')
lr = new LineByLineReader('./data/crimes.csv')

lr.on 'line', (line) ->
  if pastFirstLine
    result = line.split(',')
    date = moment(result[2], 'MM/DD/YYYY hh:mm:SS A')

    crimesData.push {
      crimeType: getInitials(result[5], 2)
      nta: result[13]
      month: date.months() + 1
      year: date.year()
      hour: date.hours()
    }
  else
    pastFirstLine = true

# When we are done, test that the parsed output matched what expected
lr.on 'end', ->
  # All lines read, file is closed now.
  console.log crimesData.length, crimesData[0]

  console.log 'about to process'
  crimes = formatDisplayData.getCrimesData crimesData
  console.log 'processed - about to save'
  fs.writeFile "./data/chicago-crimes-display-data.json", JSON.stringify(crimes), (err) ->
    if (err)
      console.log(err)
    else
      console.log("The file was saved!")
