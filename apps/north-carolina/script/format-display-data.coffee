d3 = require 'd3'
_ = require 'underscore'
moment = require 'moment'

module.exports =

  districts: [0..13]

  censusKeys:
    "B01001e1": "pop"
    "B02001e2": "white"
    "B02001e3": "black"
    # "B02001e4": "American Indian Pop"
    "B02001e5": "asian"
    # "B02001e6": "Pacific Islander Pop"
    # "B02001e7": "Other"
    # "B02001e7": "Mixed"

    "B09002e1": "children"
    "B09017e1": "65"

    "B17017e2": "poverty"

    "B21001e2": "veteran"
    # "B21001e3": "Total Nonveteran"

    "B23025e4": "employed"
    "B23025e5": "unemployed"
    "B23025e6": "armed"

  combineCensusKeys:
    "B15002e11": "Male HS graduate"
    "B15002e28": "Female HS graduate"

    "B15002e15": "Male Bachelor's degree"
    "B15002e32": "Female Bachelor's degree"

    "C24010e31": "Male Farming"
    "C24010e67": "Female Farming"

  tallyVotesByPrec: (rawVotes) ->
    votes = {}
    for vote in rawVotes
      unless votes[vote.precinct_abbrv]
        votes[vote.precinct_abbrv] = { REP: 0, DEM: 0, UNA: 0, LIB: 0, total: 0 }

      votes[vote.precinct_abbrv][vote.party_cd] += Number(vote.total_voters)
      votes[vote.precinct_abbrv].total += Number(vote.total_voters)

    votes

  getData: (features, rawVotes) ->
    votes = @tallyVotesByPrec rawVotes
    failTally = 0

    formattedData = for feature in features
      if feature.geometry.coordinates
        properties = feature.properties
        data =
          district: properties.district
          point: feature.geometry.coordinates
          id: properties.GEOID

        for key in Object.keys(@censusKeys)
          data[@censusKeys[key]] = properties[key] # / properties['B01001e1']) * 100

        # data['hs graduate'] = properties["B15002e11"] + properties["B15002e28"]
        # data['farming'] = properties["C24010e31"] + properties["C24010e67"]

        data['bachelors'] = properties["B15002e15"] + properties["B15002e32"]

        precID = properties.prec_id

        if votes[precID]
          data.democrat = (votes[precID].DEM / votes[precID].total) * 100
          data.republican = (votes[precID].REP / votes[precID].total) * 100
          # data.total = votes[precID].total
        else
          failTally++
          console.log 'fail', precID

        data
