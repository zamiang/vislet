Backbone = require "backbone"
$ = require 'jquery'
Backbone.$ = $
nycTopoJson = require('../data/nyc-neighborhoods.json')
svgMapView = require('../../../components/svg-map/index.coffee')
lineGraph = require('../../../components/line-graph/index.coffee')
percentGraph = require('../../../components/line-graph/percent-graph.coffee')
neighborhoodNames = require('../data/nyc-neighborhood-names.json')
sd = require('sharify').data

module.exports.BrooklynView = class BrooklynView extends Backbone.View

  initialize: ->
    @$label = @$('.graph-heading')
    @renderSvgMap nycTopoJson
    @renderLineGraph()
    @renderAreaChart()
    @reverseNeighborhoodHash()

  renderAreaChart: ->
    width = 500
    height = 460
    startingDataset = 'BK60'
    @percentGraph = new percentGraph
      width: width
      height: height
      data: sd.SALE_COUNTS
      startingDataset: startingDataset
      keys: ['buildingClass']
      el: $('#brooklyn-building-class')

  renderLineGraph: ->
    width = 500
    height = 120
    startingDataset = 'BK60'
    @lineGraphs = []

    @lineGraphs.push new lineGraph
      width: width
      height: height
      data: sd.SALE_COUNTS
      startingDataset: startingDataset
      keys: ['residentialSaleTally']
      el: $('#brooklyn-residential-tally')
      label: '# Sales'

    @lineGraphs.push new lineGraph
      width: width
      height: height
      data: sd.SALE_COUNTS
      startingDataset: startingDataset
      keys: ['residentialPriceAverage']
      el: $('#brooklyn-residential-price-tally')
      label: 'Average Sale Price'

    @lineGraphs.push new lineGraph
      width: width
      height: height
      data: sd.SALE_COUNTS
      startingDataset: startingDataset
      keys: ['commercialSaleTally']
      el: $('#brooklyn-commercial-tally')
      label: '# Sales'

    @lineGraphs.push new lineGraph
      width: width
      height: height
      data: sd.SALE_COUNTS
      startingDataset: startingDataset
      keys: ['residentialPriceAverage']
      el: $('#brooklyn-commercial-price-tally')
      label: 'Average Sale Price'

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
      onClick: (id) => @handleNeighborhoodClick(id)

  reverseNeighborhoodHash: ->
    @neighborhoodHash = {}
    @fullNeighborhoodHash = {}
    for key in Object.keys(neighborhoodNames)
      @neighborhoodHash[neighborhoodNames[key].split('-')[0]] = key
      @fullNeighborhoodHash[neighborhoodNames[key].split('-')[0]] = neighborhoodNames[key]

  handleNeighborhoodClick: (id) ->
    for lineGraph in @lineGraphs
      lineGraph.animateNewArea @neighborhoodHash[id]

    @percentGraph.animateNewArea @neighborhoodHash[id]
    @$label.text @fullNeighborhoodHash[id]

module.exports.init = ->
  new BrooklynView
    el: $ "body"
