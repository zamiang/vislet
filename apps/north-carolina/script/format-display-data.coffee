d3 = require 'd3'
_ = require 'underscore'
moment = require 'moment'

module.exports =

  districts: [0..13]

  censusKeys:
    "B01001e1": "Total Population"
    "B02001e1": "Total Population"
    "B02001e2": "Total White Population"
    "B02001e3": "Total Black Population"
    "B02001e4": "Total American Indian Population"
    "B02001e5": "Total Asian Population"
    "B02001e6": "Total Pacific Islander Population"
    "B02001e7": "Total Other Race Population"
    "B02001e7": "Total Mixed Race Population"

    "B09002e1": "Have children under 18"
    "B09017e1": "65 and Older"

    "B15002e15": "Male Bachelor's degree"
    "B15002e11": "Male HS graduate"
    "B15002e28": "Female HS graduate"
    "B15002e32": "Female Bachelor's degree"

    "B17017e2": "Households below poverty line"

    "B21001e2": "Total Veteran"
    "B21001e3": "Total Nonveteran"

    "B23025e4": "Employed"
    "B23025e5": "Unmployed"
    "B23025e6": "Armed Forces"

    "C24010e31": "Male Farming"
    "C24010e67": "Female Farming"

  getData: (features) ->
    formattedData = for feature in features
      properties = feature.properties
      data = {
        district: properties.district
      }
      for key in Object.keys(@censusKeys)
        data[@censusKeys[key]] = properties[key]
      data
