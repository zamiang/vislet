d3 = require 'd3'
_ = require 'underscore'
moment = require 'moment'
complaintTypes = require '../data/complaint-types.json'
neighborhoodNames = require '../data/nyc-neighborhood-names.json'
population = require '../data/population.json'

module.exports =

  months: [1..12]
  hours: [0..23]
  years: [2010..2014]

  validComplaintTypes: [
    "illpar"
    "watsys"
    "blodri"
    "derveh"
    "sewe"
    "strligcon"
    "trasigcon"
    # "gencon" Recorded daily
    "deatre"
    "sancon"
    "heat" # Recorded daily
    "dircon"
    "miscol"
    "buil"
    "concom"
    # "roocon"
    'rode' # Recorded daily
    "nois"
    "bromunmet"
    "taxcom"
    # firsafdir-f58
    # concom
    # strcon
    # watsys
    # illpar
    # gencon
    # eapins-f59
    # fooest
    # vend
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

  createHourlyComplaintTypeHash: (value=0) ->
    hash = {}
    for hour in @hours
      hash[hour] = {}
      for complaintType in @complaintTypes
        hash[hour][complaintType] = value
    hash

  createDataHash: ->
    @resTotal = 0

    data = {}
    for key in @neighborhoodNames
      data[key] =
        complaintTally: @createMonthyHash()
        complaintType: @createHourlyComplaintTypeHash()
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

    # @computeComplaintTypePercent data, 'complaintType'

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
      data[key].complaintType[complaint.hour][complaint.complaintType]++

  getComplaintTotals: (originalData, key) ->
    # Compute averages
    totals = {}
    for ntaID in Object.keys(originalData)
      data = originalData[ntaID][key]
      for itemKey in Object.keys(data)
        totals[itemKey] ||= []
        totals[itemKey].push data[itemKey]
    totals

  formatDecimal: (number) ->
    Number(Number(number).toFixed(2))

  averageByPopulation: (data, nta) ->
    if nta == 'ALL'
      pops = for name in @neighborhoodNames
        if population[name]
          population[name][1]
        else
          0

      popTotal = _.reduce(pops, ((memo, num) -> memo + num), 0)
      dataTotal = _.reduce(data, ((memo, num) -> memo + num), 0)

      @formatDecimal dataTotal / (popTotal / 1000)
    else
      if data < 1 or population[nta][1] < 1
        return 0
      else
        @formatDecimal(data / (population[nta][1] / 1000))

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
              value: @averageByPopulation data[dateKey], ntaID
            }

        if ntaID == 'ALL'
          totals = @getComplaintTotals(originalData, key)
          flattenedData["#{key}-mean"] =
            for totalKey in Object.keys(totals)
              {
                date: moment(totalKey, 'M-YYYY').valueOf()
                value: @averageByPopulation totals[totalKey], ntaID
              }

      flattenedData.complaintType = @formatComplaintTypeData originalData[ntaID].complaintType, ntaID
      formattedData[ntaID] = flattenedData
    formattedData

  formatComplaintTypeData: (data, ntaID) ->
    flattenedData = {}

    for complaintType in @validComplaintTypes
      flattenedData[complaintType] = []
      for dateKey in Object.keys(data)
        flattenedData[complaintType].push {
          date: moment(new Date()).hours(dateKey).minutes(0).seconds(0).valueOf(),
          value: @averageByPopulation data[dateKey][complaintType], ntaID
        }
    flattenedData
