d3 = require 'd3'
moment = require 'moment'
Backbone = require 'backbone'
Sale = require '../models/sale.coffee'
neighborhoodNames = require('../data/nyc-neighborhood-names.json')
buildingClasses = require('../data/building-class.json')

module.exports = class Sales extends Backbone.Collection

  model: Sale

  quarters: [1..4]
  years: [2003..2014]

  validResidentialBuildingClasses: ["01", "02", "03", "07", "09", "10", "13", "15", "28"]

  salesDataKeys: [
    'residentialSaleTally'
    'residentialSaleWithPriceTally'
    'residentialPriceTally'
    'residentialPriceAverage'
    # 'commercialSaleTally'
    # 'commercialSaleWithPriceTally'
    # 'commercialPriceTally'
    # 'commercialPriceAverage'
  ]

  createQuarterlyHash: (isArray) ->
    hash = {}
    for year in @years
      for quarter in @quarters
        hash["#{quarter}-#{year}"] = if isArray then [] else 0
    hash

  createYearlyBuildingClassHash: (value=0) ->
    hash = {}
    for year in @years
     hash[year] = {}
     for buildingClass in Object.keys(buildingClasses)
       hash[year][buildingClass] = value
    hash

  createNeighborhoodDataHash: ->
    data = {}
    for key in Object.keys(neighborhoodNames)
      data[key] =
        residentialSaleTally: @createQuarterlyHash()
        residentialSaleWithPriceTally: @createQuarterlyHash()
        residentialPriceTally: @createQuarterlyHash()
        residentialPrices: @createQuarterlyHash(true)
        residentialPriceAverage: @createQuarterlyHash()
        commercialSaleTally: @createQuarterlyHash()
        commercialSaleWithPriceTally: @createQuarterlyHash()
        commercialPriceTally: @createQuarterlyHash()
        commercialPriceAverage: @createQuarterlyHash()
        buildingClass: @createYearlyBuildingClassHash()
    data

  getSalesData: ->
    data = @createNeighborhoodDataHash()
    for sale in @models
      @tallyCounts sale, data, 'ALL'
      @tallyCounts sale, data, sale.get('ntaCode')

    @computeBuildingClassPercent data, 'buildingClass'

    @computePriceAverage(
      {
        totalKey: 'commercialPriceTally'
        countKey: 'commercialSaleWithPriceTally'
        dataKey: 'commercialPriceAverage'
      }, data)
    @computePriceAverage(
      {
        totalKey: 'residentialPriceTally'
        countKey: 'residentialSaleWithPriceTally'
        dataKey: 'residentialPriceAverage'
      }, data)

    @formatSalesDataForDisplay data

  computeBuildingClassPercent: (data, dataKey) ->
    for key in Object.keys(neighborhoodNames)
      for date in Object.keys(data[key][dataKey])
        buildingClasses = data[key][dataKey][date]
        total = 0
        for buildingClass in Object.keys(buildingClasses)
          total += buildingClasses[buildingClass]

        for buildingClass in Object.keys(buildingClasses)
          if buildingClasses[buildingClass] > 0
            value = (buildingClasses[buildingClass] / total * 100).toFixed(2)
            buildingClasses[buildingClass] = if value > 1 then value else 0

  computePriceAverage: (options, data) ->
    for key in Object.keys(neighborhoodNames)
      for date in Object.keys(data[key][options.dataKey])
        value = if data[key][options.countKey][date] > 0 then data[key][options.totalKey][date] / data[key][options.countKey][date] else 0
        data[key][options.dataKey][date] = value
        delete data[key][options.countKey][date]
        delete data[key][options.totalKey][date]

  tallyCounts: (sale, data, key) ->
    return unless data[key]
    dateKey = "#{sale.get('quarter')}-#{sale.get('year')}"
    if sale.get('residentialUnits')
      data[key].residentialSaleTally[dateKey]++
      if sale.get('pricePerSqFt') > 10
        data[key].residentialPriceTally[dateKey] += Number(sale.get('pricePerSqFt'))
        data[key].residentialSaleWithPriceTally[dateKey]++
        data[key].residentialPrices[dateKey].push Number(sale.get('pricePerSqFt'))
    else if sale.get('commercialUnits')
      data[key].commercialSaleTally[dateKey]++
      if sale.get('pricePerSqFt') > 10
        data[key].commercialPriceTally[dateKey] += Number(sale.get('pricePerSqFt'))
        data[key].commercialSaleWithPriceTally[dateKey]++

    # Tally building class
    if sale.get('buildingClass')?.length > 0
      data[key].buildingClass["#{sale.get('year')}"][sale.get('buildingClass').substring(0,2)]++

  getSalesTotals: (originalData, key) ->
    # Compute averages
    totals = {}
    for ntaID in Object.keys(originalData)
      data = originalData[ntaID][key]
      for itemKey in Object.keys(data)
        totals[itemKey] ||= []
        totals[itemKey].push data[itemKey]
    totals

  formatSalesDataForDisplay: (originalData) ->
    formattedData = {}
    for ntaID in Object.keys(originalData)
      flattenedData = {}
      for key in @salesDataKeys
        data = originalData[ntaID][key]
        flattenedData[key] =
          for itemKey in Object.keys(data)
            {
              date: moment(itemKey, 'Q-YYYY').valueOf()
              value: Number(data[itemKey].toFixed(2))
            }

        if ntaID == 'ALL'
          totals = @getSalesTotals(originalData, key)
          flattenedData["#{key}-mean"] =
            for totalKey in Object.keys(totals)
              {
                date: moment(totalKey, 'Q-YYYY').valueOf()
                value: Number(d3.mean(totals[totalKey]).toFixed(2))
              }
      if ntaID == 'BK73'
        data = originalData[ntaID]['residentialPrices']
        flattenedData["williamsburgTrend"] =
          for itemKey in Object.keys(data)
            data[itemKey].sort(d3.ascending)
            {
              date: moment(itemKey, 'Q-YYYY').valueOf()
              pct25: d3.quantile(data[itemKey], .25)
              pct50: d3.quantile(data[itemKey], .5)
              pct75: d3.quantile(data[itemKey], .75)
            }

      flattenedData['buildingClass'] = @formatBuildingClassData flattenedData, originalData[ntaID]['buildingClass']
      formattedData[ntaID] = flattenedData
    formattedData

  parseYear: d3.time.format("%Y").parse
  formatBuildingClassData: (flattenedData, data) ->
    flattenedData = {}
    dateKeys = Object.keys(data)
    dataKeys = @validResidentialBuildingClasses # Object.keys(data[dateKeys[0]])
    for dataKey in dataKeys
      flattenedData[dataKey] = []
      for dateKey in dateKeys
        date = moment(dateKey, 'YYYY').valueOf()
        flattenedData[dataKey].push { date: date, value: Number(data[dateKey][dataKey] / 100) }
    flattenedData
