d3 = require 'd3'
_ = require 'underscore'
moment = require 'moment'

module.exports =

  districts: [0..13]

  censusKeys:
    "B01001e1": "Pop"
    "B02001e2": "White"
    "B02001e3": "Black"
    # "B02001e4": "American Indian Pop"
    "B02001e5": "Asian"
    # "B02001e6": "Pacific Islander Pop"
    # "B02001e7": "Other"
    # "B02001e7": "Mixed"

    "B09002e1": "Have children under 18"
    "B09017e1": "65+"

    "B17017e2": "hh below poverty line"

    "B21001e2": "Veteran"
    # "B21001e3": "Total Nonveteran"

    "B23025e4": "Employed"
    "B23025e5": "Unemployed"
    "B23025e6": "Armed Forces"

  combineCensusKeys:
    "B15002e11": "Male HS graduate"
    "B15002e28": "Female HS graduate"

    "B15002e15": "Male Bachelor's degree"
    "B15002e32": "Female Bachelor's degree"

    "C24010e31": "Male Farming"
    "C24010e67": "Female Farming"

  getData: (features) ->
    formattedData = for feature in features
      properties = feature.properties
      data =
        district: properties.district
        point: feature.geometry.coordinates # [ -77.606377690079185, 35.174859146207325 ]
        id: properties.GEOID

      for key in Object.keys(@censusKeys)
        data[@censusKeys[key]] = properties[key] # / properties['B01001e1']) * 100

      data['HS graduate'] = properties["B15002e11"] + properties["B15002e28"]
      data['Bachelors degree'] = properties["B15002e15"] + properties["B15002e32"]
      data['farming'] = properties["C24010e31"] + properties["C24010e67"]

      # Remove any decimals to save space
      for key in Object.keys(data)
        data[key] = Math.round(data[key])

      data
