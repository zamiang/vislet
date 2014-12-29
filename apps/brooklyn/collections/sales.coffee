Backbone = require 'backbone'
Sale = require '../models/sale.coffee'
neighborhoodNames = require('../data/nyc-neighborhood-names.json')

module.exports = class Sales extends Backbone.Collection

  model: Sale

  months: [0...12]
  years: [2003..2014]

  createHash: ->
    hash = {}
    for year in @years
      monthHash = {}
      for month in @months
        monthHash[month] = 0
      hash[year] = monthHash
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

  # Counts number of commercial and residential sales. Does not count
  # number of units - just number of sales.
  getCommercialResidentialCounts: ->
    data = @createNeighborhoodDataHash()
    for sale in @models
      @tallyCounts sale, data, 'ALL'
      @tallyCounts sale, data, sale.get('ntaCode')
    data

  tallyCounts: (sale, data, key) ->
    return unless data[key]
    if sale.get('residentialUnits')
      data[key].residentialSaleTally[sale.get('year')][sale.get('month')]++
      if sale.get('price') > 0
        data[key].residentialPriceTally[sale.get('year')][sale.get('month')] += Number(sale.get('price'))
        data[key].residentialSaleWithPriceTally[sale.get('year')][sale.get('month')]++
    else if sale.get('commercialUnits')
      data[key].commercialSaleTally[sale.get('year')][sale.get('month')]++
      if sale.get('price') > 0
        data[key].commercialPriceTally[sale.get('year')][sale.get('month')] += Number(sale.get('price'))
        data[key].commercialSaleWithPriceTally[sale.get('year')][sale.get('month')]++
