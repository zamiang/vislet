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
        commercialSaleTally: @createHash()
        commercialSaleWithPriceTally: @createHash()
        commercialPriceTally: @createHash()
        residentialSaleTally: @createHash()
        residentialSaleWithPriceTally: @createHash()
        residentialPriceTally: @createHash()
    data

  # Counts number of commercial and residential sales for each NTA
  getCommercialResidentialCounts: ->
    data = @createNeighborhoodDataHash()
    for sale in @models
      @tallyCounts sale, data, 'ALL'
      @tallyCounts sale, data, sale.get('ntaCode')
    data

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
