Backbone = require 'backbone'
Sale = require '../models/sale.coffee'
neighborhoodNames = require('../data/nyc-neighborhood-names.json')

module.exports = class Sales extends Backbone.Collection

  model: Sale

  months: [1..12]
  years: [2003..2014]

  createHash: ->
    hash = {}
    for year in @years
      for month in @months
        hash["#{month}-01-#{year}"] = 0
    hash

  createNeighborhoodDataHash: ->
    data = {}
    for key in Object.keys(neighborhoodNames)
      data[key] =
        residentialSaleTally: @createHash()
        residentialSaleWithPriceTally: @createHash()
        residentialPriceTally: @createHash()
        residentialPriceAverage: @createHash()
        commercialSaleTally: @createHash()
        commercialSaleWithPriceTally: @createHash()
        commercialPriceTally: @createHash()
        commercialPriceAverage: @createHash()
    data

  # Counts number of commercial and residential sales for each NTA
  getCommercialResidentialCounts: ->
    data = @createNeighborhoodDataHash()
    for sale in @models
      @tallyCounts sale, data, 'ALL'
      @tallyCounts sale, data, sale.get('ntaCode')

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

    data

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
