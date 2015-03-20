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
