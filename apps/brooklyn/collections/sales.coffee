Backbone = require 'backbone'
Sale = require '../models/sale.coffee'

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

  # Counts number of commercial and residential sales. Does not count
  # number of units - just number of sales.
  getCommercialResidentialCounts: ->
    commercialSaleTally = @createHash()
    commercialSaleWithPriceTally = @createHash()
    commercialPriceTally = @createHash()
    residentialSaleTally = @createHash()
    residentialSaleWithPriceTally = @createHash()
    residentialPriceTally = @createHash()

    for sale in @models
      if sale.get('residentialUnits')
        residentialSaleTally[sale.get('year')][sale.get('month')]++
        if sale.get('price') > 0
          residentialPriceTally[sale.get('year')][sale.get('month')] += Number(sale.get('price'))
          residentialSaleWithPriceTally[sale.get('year')][sale.get('month')]++
      else if sale.get('commercialUnits')
        commercialSaleTally[sale.get('year')][sale.get('month')]++
        if sale.get('price') > 0
          commercialPriceTally[sale.get('year')][sale.get('month')] += Number(sale.get('price'))
          commercialSaleWithPriceTally[sale.get('year')][sale.get('month')]++

    {
      commercialSaleTally: commercialSaleTally
      commercialSaleWithPriceTally: commercialSaleWithPriceTally
      commercialPriceTally: commercialPriceTally
      residentialSaleTally: residentialSaleTally
      residentialSaleWithPriceTally: residentialSaleWithPriceTally
      residentialPriceTally: residentialPriceTally
    }
