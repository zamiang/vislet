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

  # excludes "16", "17", "23" since they are very uncommon in Brooklyn
  validResidentialBuildingClasses: ["01", "02", "03", "04", "07", "08", "09", "10", "12", "13", "15", "28"]

  salesDataKeys: [
    'residentialPrices'
    # 'commercialPrices'
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
    @resTotal = 0
    @resWithSaleCount = 0

    data = {}
    for key in Object.keys(neighborhoodNames)
      data[key] =
        residentialSaleTally: @createQuarterlyHash()
        residentialPrices: @createQuarterlyHash(true)
        commercialSaleTally: @createQuarterlyHash()
        commercialPrices: @createQuarterlyHash(true)
        buildingClass: @createYearlyBuildingClassHash()
    data

  getSalesData: ->
    data = @createNeighborhoodDataHash()
    for sale in @models
      @tallyCounts sale, data, 'ALL'
      @tallyCounts sale, data, sale.get('ntacode')

    @computeBuildingClassPercent data, 'buildingClass'
]
    console.log "Total Residential Sales: #{@resTotal}, Total With Price per SqFt #{@resWithSaleCount}"

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

  tallyCounts: (sale, data, key) ->
    return unless data[key]
    dateKey = "#{sale.get('quarter')}-#{sale.get('year')}"
    if sale.get('residentia') > 0 and sale.get('commercial') < 1
      data[key].residentialSaleTally[dateKey]++
      @resTotal++
      if sale.get('pricePerSqFt') and sale.get('buildingClass').substring(0,2) in @validResidentialBuildingClasses
        data[key].residentialPrices[dateKey].push Number(sale.get('pricePerSqFt'))
        @resWithSaleCount++
    else if sale.get('commercialUnits')
      data[key].commercialSaleTally[dateKey]++
      if sale.get('pricePerSqFt')
        data[key].commercialPrices[dateKey].push Number(sale.get('pricePerSqFt'))

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
        for item in data[itemKey]
          totals[itemKey].push item
    totals

  formatSalesDataForDisplay: (originalData) ->
    formattedData = {}
    for ntaID in Object.keys(originalData)
      flattenedData = {}
      for key in @salesDataKeys
        data = originalData[ntaID][key]
        flattenedData[key] =
          for itemKey in Object.keys(data)
            data[itemKey].sort(d3.ascending)
            mean = d3.mean(data[itemKey])
            {
              date: moment(itemKey, 'Q-YYYY').valueOf()
              value: if mean then Number(mean.toFixed(2)) else 0
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
          flattenedData["williamsburgTrend"] =
            for itemKey in Object.keys(data)
              data[itemKey].sort(d3.ascending)
              {
                date: moment(itemKey, 'Q-YYYY').valueOf()
                pct25: Number(d3.quantile(data[itemKey], .25).toFixed(2))
                value: Number(d3.mean(data[itemKey]).toFixed(2))
                pct75: Number(d3.quantile(data[itemKey], .75).toFixed(2))
              }

      flattenedData['buildingClass'] = @formatBuildingClassData flattenedData, originalData[ntaID]['buildingClass']
      formattedData[ntaID] = flattenedData
    formattedData

  parseYear: d3.time.format("%Y").parse
  formatBuildingClassData: (flattenedData, data) ->
    flattenedData = {}
    dateKeys = Object.keys(data)
    dataKeys = @validResidentialBuildingClasses
    for dataKey in dataKeys
      flattenedData[dataKey] = []
      for dateKey in dateKeys
        date = moment(dateKey, 'YYYY').valueOf()
        flattenedData[dataKey].push { date: date, value: Number((data[dateKey][dataKey] / 100).toFixed(4)) }
    flattenedData
