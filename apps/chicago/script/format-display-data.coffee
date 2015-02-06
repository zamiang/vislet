_ = require 'underscore'
d3 = require 'd3'
moment = require 'moment'
crimeTypes = require '../data/crime-types.json'
neighborhoodNames = require '../data/neighborhood-names.json'
population = require '../data/chicago-population-2000-2010.json'

module.exports =

  months: [1..12]
  years: [2001..2014]
  hours: [0..23]

  validCrimeTypes: [
    "ASS",
    "NAR",
    "BAT",
    "THE",
    "HOM",
    "ROB",
    "BUR",
    "SEOF",
    "CRDA"
  ]

  crimesDataKeys: [
    'crimeTally'
  ]

  # Look at by hour of day?
  createMonthyHash: (isArray) ->
    hash = {}
    for year in @years
      for month in @months
        hash["#{month}-#{year}"] = if isArray then [] else 0
    hash

  createYearlyCrimeTypeHash: (value=0) ->
    hash = {}
    for year in @years
      hash[year] = {}
      for crimeType in @crimeTypes
        hash[year][crimeType] = value
    hash

  createHourlyCrimeTypeHash: (value=0) ->
    hash = {}
    for hour in @hours
      hash[hour] = {}
      for crimeType in @crimeTypes
        hash[hour][crimeType] = value
    hash

  createDataHash: ->
    @resTotal = 0

    data = {}
    for key in Object.keys(neighborhoodNames)
      data[key] =
        crimeTally: @createMonthyHash()
        crimeType: @createHourlyCrimeTypeHash()
    data

  formatCrimeTypes: ->
    names = {}
    for name in Object.keys(crimeTypes)
      names[crimeTypes[name]] = name
    names

  getCrimesData: (models) ->
    @crimeTypes = Object.keys @formatCrimeTypes()

    data = @createDataHash()
    for crime in models
      @tallyCounts crime, data, crime.nta

    @formatCrimesDataForDisplay data

  computeCrimeTypePercent: (data, dataKey) ->
    for key in Object.keys(neighborhoodNames)
      for date in Object.keys(data[key][dataKey])
        crimeTypes = data[key][dataKey][date]
        total = 0
        for crimeType in @crimeTypes
          total += crimeTypes[crimeType]

        for crimeType in @crimeTypes
          value = 0
          if crimeTypes[crimeType] > 0
            value = (crimeTypes[crimeType] / total * 100).toFixed(2)
          crimeTypes[crimeType] = if value > 1 then value else 0

  tallyCounts: (crime, data, key) ->
    return unless data[key]
    if crime.year > 2014
      return

    dateKey = "#{crime.month}-#{crime.year}"

    data[key].crimeTally[dateKey]++
    @resTotal++

    if crime.crimeType?.length > 0
      data[key].crimeType[crime.hour][crime.crimeType]++

  getCrimeTotals: (originalData, key) ->
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
      pops = for name in Object.keys(neighborhoodNames)
        n = neighborhoodNames[name]
        if population[n]
          population[n]["TOTAL-2010"]
        else
          0

      popTotal = _.reduce(pops, ((memo, num) -> memo + num), 0)
      dataTotal = _.reduce(data, ((memo, num) -> memo + num), 0)

      @formatDecimal dataTotal / (popTotal / 1000)
    else
      name = neighborhoodNames[nta]
      if population[name]
        if data < 1 or population[name]["TOTAL-2010"] < 1
          0
        else
          pop = population[name]["TOTAL-2010"]
          @formatDecimal data / (pop / 1000)
      else
        0

  formatCrimesDataForDisplay: (originalData) ->
    formattedData = {}
    for ntaID in Object.keys(originalData)
      flattenedData = {}
      for key in @crimesDataKeys
        data = originalData[ntaID][key]
        flattenedData[key] =
          for dateKey in Object.keys(data)
            {
              date: moment(dateKey, 'M-YYYY').valueOf()
              value: @averageByPopulation data[dateKey], ntaID
            }

        if ntaID == 'ALL'
          totals = @getCrimeTotals(originalData, key)
          flattenedData["#{key}-mean"] =
            for totalKey in Object.keys(totals)
              {
                date: moment(totalKey, 'M-YYYY').valueOf()
                value: @averageByPopulation d3.mean(totals[totalKey]), ntaID
              }

      flattenedData.crimeType = @formatCrimeTypeData originalData[ntaID].crimeType, ntaID
      formattedData[ntaID] = flattenedData
    formattedData

  formatCrimeTypeData: (data, ntaID) ->
    flattenedData = {}
    for crimeType in @validCrimeTypes
      flattenedData[crimeType] = []
      for dateKey in Object.keys(data)
        flattenedData[crimeType].push {
          date: moment(new Date()).hours(dateKey).minutes(0).seconds(0).valueOf(),
          value: @averageByPopulation data[dateKey][crimeType], ntaID
        }
    flattenedData
