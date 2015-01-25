d3 = require 'd3'
moment = require 'moment'
complaintTypes = require '../data/complaint-types.json'
neighborhoodNames = require '../data/nyc-neighborhood-names.json'

module.exports =

  months: [1..12]
  years: [2010..2014]

  validComplaintTypes: [
    "HEAT",
    "CONS",
    "BAT",
    "PubAss",
    "Drin",
    "ROB",
    "GENE",
    "SAFE",
    "Nois",
    "Rode",
    "Traf"
  ]

  complaintsDataKeys: [
    'complaintTally'
  ]

  # Look at by hour of day?
  createMonthyHash: (isArray) ->
    hash = {}
    for year in @years
      for month in @months
        hash["#{month}-#{year}"] = if isArray then [] else 0
    hash

  createYearlyComplaintTypeHash: (value=0) ->
    hash = {}
    for year in @years
      hash[year] = {}
      for complaintType in @complaintTypes
        hash[year][complaintType] = value
    hash

  createDataHash: ->
    @resTotal = 0

    data = {}
    for key in @neighborhoodNames
      data[key] =
        complaintTally: @createMonthyHash()
        complaintType: @createYearlyComplaintTypeHash()
    data

  formatComplaintTypes: ->
    names = {}
    for name in Object.keys(complaintTypes)
      names[complaintTypes[name]] = name
    names

  getData: (models) ->
    @neighborhoodNames = Object.keys neighborhoodNames
    @complaintTypes = Object.keys @formatComplaintTypes()

    data = @createDataHash()
    for complaint in models
      @tallyCounts complaint, data, complaint.nta

    @computeComplaintTypePercent data, 'complaintType'

    @formatComplaintsDataForDisplay data

  computeComplaintTypePercent: (data, dataKey) ->
    for key in @neighborhoodNames
      for date in Object.keys(data[key][dataKey])
        complaintTypes = data[key][dataKey][date]
        total = 0
        for complaintType in @complaintTypes
          total += complaintTypes[complaintType]

        for complaintType in @complaintTypes
          value = 0
          if complaintTypes[complaintType] > 0
            value = (complaintTypes[complaintType] / total * 100).toFixed(2)
          complaintTypes[complaintType] = if value > 1 then value else 0

  tallyCounts: (complaint, data, key) ->
    return unless data[key]
    if complaint.year > 2014
      return

    dateKey = "#{complaint.month}-#{complaint.year}"

    data[key].complaintTally[dateKey]++
    @resTotal++

    if complaint.complaintType?.length > 0
      data[key].complaintType[complaint.year][complaint.complaintType]++

  getComplaintTotals: (originalData, key) ->
    # Compute averages
    totals = {}
    for ntaID in Object.keys(originalData)
      data = originalData[ntaID][key]
      for itemKey in Object.keys(data)
        totals[itemKey] ||= []
        totals[itemKey].push data[itemKey]
    totals

  formatComplaintsDataForDisplay: (originalData) ->
    formattedData = {}
    for ntaID in Object.keys(originalData)
      flattenedData = {}
      for key in @complaintsDataKeys
        data = originalData[ntaID][key]
        flattenedData[key] =
          for dateKey in Object.keys(data)
            {
              date: moment(dateKey, 'M-YYYY').valueOf()
              value: data[dateKey]
            }

        if ntaID == 'ALL'
          totals = @getComplaintTotals(originalData, key)
          flattenedData["#{key}-mean"] =
            for totalKey in Object.keys(totals)
              {
                date: moment(totalKey, 'M-YYYY').valueOf()
                value: Number(d3.mean(totals[totalKey]).toFixed(2))
              }

      flattenedData.complaintType = @formatComplaintTypeData originalData[ntaID].complaintType
      formattedData[ntaID] = flattenedData
    formattedData

  formatComplaintTypeData: (data) ->
    flattenedData = {}

    types = []
    for type in Object.keys(complaintTypes)
      types.push complaintTypes[type]

    for complaintType in @validComplaintTypes
      flattenedData[complaintType] = []
      for dateKey in Object.keys(data)
        date = moment(dateKey, 'YYYY').valueOf()
        flattenedData[complaintType].push { date: date, value: Number((data[dateKey][complaintType] / 100).toFixed(4)) }
    flattenedData
