Backbone = require "backbone"
$ = require 'jquery'
Backbone.$ = $
nycTopoJson = require('../data/nyc-neighborhoods.json')
svgMapView = require('../../../components/svg-map/index.coffee')
lineGraph = require('../../../components/line-graph/index.coffee')
sd = require('sharify').data

module.exports.BrooklynView = class BrooklynView extends Backbone.View

  initialize: ->
    @renderSvgMap nycTopoJson
    @renderLineGraph()

  renderLineGraph: ->
    data = sd.SALE_COUNTS['ALL']
    new lineGraph
      width: 1000
      height: 500
      data: data
      keys: ['residentialSaleTally', 'commercialSaleTally']
      el: $('#brooklyn-sale-tally')

  renderSvgMap: (topojson) ->
    neighborhoods = []
    topojson.objects.nycneighborhoods.geometries = topojson.objects.nycneighborhoods.geometries.filter (neighborhood) ->
      neighborhood.id = neighborhood.id.split('-')[0]
      neighborhoods.push neighborhood.id
      unless neighborhood.id and neighborhood.properties.BoroCode == 3 and neighborhood.id != 'park'
        return false
      true

    @neighborhoods = neighborhoods

    new svgMapView
      el: $('#brooklyn-svg')
      topojson: topojson
      key: 'nycneighborhoods'
      ignoredId: 'park'

module.exports.init = ->
  new BrooklynView
    el: $ "body"
