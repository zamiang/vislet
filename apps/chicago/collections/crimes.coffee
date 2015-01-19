d3 = require 'd3'
moment = require 'moment'
Backbone = require 'backbone'
Crime = require '../models/crime.coffee'
crimeTypes = require '../data/crime-types.json'
neighborhoodNames = require '../data/neighborhood-names.json'

module.exports = class Crimes extends Backbone.Collection

  model: Crime

  months: [1..12]
  years: [2001..2014]

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
      for crimeType in Object.keys(crimeTypes)
        hash[year][crimeType] = value
    hash

  createDataHash: ->
    @resTotal = 0

    data = {}
    for key in Object.keys(neighborhoodNames)
      data[key] =
        crimeTally: @createMonthyHash()
        crimeType: @createYearlyCrimeTypeHash()
    data

  getCrimesData: ->
    data = @createDataHash()
    for crime in @models
      @tallyCounts crime, data, crime.get('nta')

    @computeCrimeTypePercent data, 'crimeType'

    @formatCrimesDataForDisplay data

  computeCrimeTypePercent: (data, dataKey) ->
    for key in Object.keys(neighborhoodNames)
      for date in Object.keys(data[key][dataKey])
        crimeTypes = data[key][dataKey][date]
        total = 0
        for crimeType in Object.keys(crimeTypes)
          total += crimeTypes[crimeType]

        for crimeType in Object.keys(crimeTypes)
          value = 0
          if crimeTypes[crimeType] > 0
            value = (crimeTypes[crimeType] / total * 100).toFixed(2)
          crimeTypes[crimeType] = if value > 1 then value else 0

  tallyCounts: (crime, data, key) ->
    return unless data[key]
    if crime.get('year') > 2014
      return

    dateKey = "#{crime.get('month')}-#{crime.get('year')}"

    data[key].crimeTally[dateKey]++
    @resTotal++

    if crime.get('crimeType')?.length > 0
      data[key].crimeType["#{crime.get('year')}"][crime.get('crimeType')]++

  getCrimesTotals: (originalData, key) ->
    # Compute averages
    totals = {}
    for ntaID in Object.keys(originalData)
      data = originalData[ntaID][key]
      for itemKey in Object.keys(data)
        totals[itemKey] ||= []
        for item in data[itemKey]
          totals[itemKey].push item
    totals

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
              value: data[dateKey]
            }

      flattenedData.crimeType = @formatCrimeTypeData originalData[ntaID].crimeType
      formattedData[ntaID] = flattenedData
    formattedData

  formatCrimeTypeData: (data) ->
    flattenedData = {}
    for crimeType in Object.keys(crimeTypes)
      flattenedData[crimeType] = []
      for dateKey in Object.keys(data)
        date = moment(dateKey, 'YYYY').valueOf()
        flattenedData[crimeType].push { date: date, value: Number((data[dateKey][crimeType] / 100).toFixed(4)) }
    flattenedData
