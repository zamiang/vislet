Backbone = require 'backbone'
Sale = require '../models/sale.coffee'
neighborhoodNames = require('../data/nyc-neighborhood-names.json')
d3 = require 'd3'
moment = require 'moment'

module.exports = class Sales extends Backbone.Collection

  model: Sale

  months: [1..12]
  years: [2003..2014]
  buildingClasses: ["01  ONE FAMILY DWELLINGS","02  TWO FAMILY DWELLINGS","03  THREE FAMILY DWELLINGS","04  TAX CLASS 1 CONDOS","05  TAX CLASS 1 VACANT LAND","06  TAX CLASS 1 - OTHER","07  RENTALS - WALKUP APARTMENTS","09  COOPS - WALKUP APARTMENTS","10  COOPS - ELEVATOR APARTMENTS","12  CONDOS - WALKUP APARTMENTS","13  CONDOS - ELEVATOR APARTMENTS","14  RENTALS - 4-10 UNIT","15  CONDOS - 2-10 UNIT RESIDENTIAL","17  CONDO COOPS","22  STORE BUILDINGS","28  COMMERCIAL CONDOS","29  COMMERCIAL GARAGES","43  CONDO OFFICE BUILDINGS","44  CONDO PARKING","08  RENTALS - ELEVATOR APARTMENTS","18  TAX CLASS 3 - UNTILITY PROPERTIES","21  OFFICE BUILDINGS","30  WAREHOUSES","47  CONDO NON-BUSINESS STORAGE","16  CONDOS - 2-10 UNIT WITH COMMERCIAL UNIT","23  LOFT BUILDINGS","27  FACTORIES","31  COMMERCIAL VACANT LAND","32  HOSPITAL AND HEALTH FACILITIES","33  EDUCATIONAL FACILITIES","35  INDOOR PUBLIC AND CULTURAL FACILITIES","37  RELIGIOUS FACILITIES","38  ASYLUMS AND HOMES","41  TAX CLASS 4 - OTHER","46  CONDO STORE BUILDINGS","26  OTHER HOTELS","11  SPECIAL CONDO BILLING LOTS","48  CONDO TERRACES/GARDENS/CABANAS","42  CONDO CULTURAL/MEDICAL/EDUCATIONAL/ETC","25  LUXURY HOTELS","36  OUTDOOR RECREATIONAL FACILITIES","11A CONDO-RENTALS","34  THEATRES","49  CONDO WAREHOUSES/FACTORY/INDUS","01  ONE FAMILY HOMES","02  TWO FAMILY HOMES","03  THREE FAMILY HOMES","17  CONDOPS","40  SELECTED GOVERNMENTAL FACILITIES","18  TAX CLASS 3 - UTILITY PROPERTIES","39  TRANSPORTATION FACILITIES"]

  salesDataKeys: [
    'residentialSaleTally'
    'residentialSaleWithPriceTally'
    'residentialPriceTally'
    'residentialPriceAverage'
    'commercialSaleTally'
    'commercialSaleWithPriceTally'
    'commercialPriceTally'
    'commercialPriceAverage'
  ]

  createMonthlyHash: ->
    hash = {}
    for year in @years
      for month in @months
        # We don't have data for the last month of 2014
        unless year == 2014 && month == 12
          hash["#{month}-01-#{year}"] = 0
    hash

  createYearlyBuildingClassHash: ->
    hash = {}
    for year in @years
      hash[year] = {}
      for buildingClass in @buildingClasses
        hash[year][buildingClass.substring(0,2)] = 0
    hash

  createNeighborhoodDataHash: ->
    data = {}
    for key in Object.keys(neighborhoodNames)
      data[key] =
        residentialSaleTally: @createMonthlyHash()
        residentialSaleWithPriceTally: @createMonthlyHash()
        residentialPriceTally: @createMonthlyHash()
        residentialPriceAverage: @createMonthlyHash()
        commercialSaleTally: @createMonthlyHash()
        commercialSaleWithPriceTally: @createMonthlyHash()
        commercialPriceTally: @createMonthlyHash()
        commercialPriceAverage: @createMonthlyHash()
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
        data[key][options.dataKey][date] = if data[key][options.countKey][date] > 0 then data[key][options.totalKey][date] / data[key][options.countKey][date] else 0
        delete data[key][options.countKey][date]
        delete data[key][options.totalKey][date]

  tallyCounts: (sale, data, key) ->
    return unless data[key]
    dateKey = "#{sale.get('month') + 1}-01-#{sale.get('year')}"
    if sale.get('residentialUnits')
      data[key].residentialSaleTally[dateKey]++
      if sale.get('price') > 0
        data[key].residentialPriceTally[dateKey] += Number(sale.get('price'))
        data[key].residentialSaleWithPriceTally[dateKey]++
    else if sale.get('commercialUnits')
      data[key].commercialSaleTally[dateKey]++
      if sale.get('price') > 0
        data[key].commercialPriceTally[dateKey] += Number(sale.get('price'))
        data[key].commercialSaleWithPriceTally[dateKey]++

    # Tally building class
    if sale.get('buildingClass')?.length > 0
      data[key].buildingClass[sale.get('year')][sale.get('buildingClass').substring(0,2)]++

  getSalesTotals: (originalData, key) ->
    # Compute averages
    totals = {}
    for ntaID in Object.keys(originalData)
      unless ntaID == 'ALL'
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
              date: moment(itemKey, 'M-DD-YYYY').valueOf()
              value: Number(data[itemKey].toFixed(2))
            }

        totals = @getSalesTotals(originalData, key)
        flattenedData["#{key}-mean"] =
          for totalKey in Object.keys(totals)
            {
              date: moment(totalKey, 'M-DD-YYYY').valueOf()
              value: Number(d3.mean(totals[totalKey]).toFixed(2))
            }

      flattenedData['buildingClass'] = @formatBuildingClassData flattenedData, originalData[ntaID]['buildingClass']
      formattedData[ntaID] = flattenedData
    formattedData

  parseYear: d3.time.format("%Y").parse
  formatBuildingClassData: (flattenedData, data) ->
    flattenedData = {}
    dataKeys = Object.keys(data[@years[0]])
    for dataKey in dataKeys
      flattenedData[dataKey] = []
      for year in @years
        flattenedData[dataKey].push { date: @parseYear(String(year)).valueOf(), value: Number(data[year][dataKey] / 100) }
    flattenedData
