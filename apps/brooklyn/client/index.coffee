Backbone = require "backbone"
Backbone.$ = $
moment = require 'moment'
brooklynTopoJson = require('../data/brooklyn.json')
LineGraph = require('../../../components/line-graph/index.coffee')
PercentGraph = require('../../../components/line-graph/percent-graph.coffee')
StackedGraph = require('../../../components/area-chart/index.coffee')
neighborhoodNames = require('../data/nyc-neighborhood-names.json')
salesData = require('../data/brooklyn-sales-display-data.json')
buildingClasses = require('../data/building-class.json')
Slider = require('../../../components/slider/index.coffee')
MapView = require('./map.coffee')

module.exports.BrooklynView = class BrooklynView extends Backbone.View

  startingDataset: 'BK60'

  # TODO Refactor
  mobileWidth: 270
  getWidth: (width) -> if @isMobile then @mobileWidth else width

  initialize: ->
    @isMobile = @$el.width() < 500
    @renderMap()
    @renderLineGraph()
    @renderBuildingClassGraphs()

  renderMap: ->
    mapview = new MapView
      el: @$el
      isMobile: @isMobile

    mapview.on 'hover', (params) =>
      @lineGraph.animateNewArea(params.currentNTA, params.hoverNTA)
    mapview.on 'click', (params) =>
      @lineGraph.animateNewArea(params.id)
      @stackedGraph.animateNewArea(params.id)

  renderBuildingClassGraphs: ->
    width = @getWidth(490)
    blogPostWidth = @getWidth(460)
    height = 230

    @stackedGraph = new StackedGraph
      el: $('#brooklyn-residential-building-class')
      width: width
      height: height
      data: salesData
      startingDataset: @startingDataset
      keys: ['buildingClass']
      label: 'Building Class as % of sales'
      displayKey: (id) -> buildingClasses[id]

    # For blog post
    new StackedGraph
      el: $('#williamsburg-building-class')
      width: blogPostWidth
      height: 300
      data: salesData
      startingDataset: 'BK73'
      keys: ['buildingClass']
      label: 'Wiliamsburg Building Class as % of sales'

    new StackedGraph
      el: $('#greenpoint-building-class')
      width: blogPostWidth
      height: 300
      data: salesData
      startingDataset: 'BK76'
      keys: ['buildingClass']
      label: 'Greenpoint Building Class as % of sales'
      displayKey: (id) -> buildingClasses[id]

  renderLineGraph: ->
    width = @getWidth(490)
    blogPostWidth = @getWidth(620)
    height = 230

    @lineGraph = new LineGraph
      width: width
      height: height
      data: salesData
      startingDataset: @startingDataset
      keys: ['residentialPrices', 'residentialPrices-mean']
      el: $('#brooklyn-residential-price-tally')
      label: 'Avg Price Per SqFt'
      yAxisFormat: (x) -> "$#{x}"
      handleHover: @handleHover

    # Clinton-hill vs Canarsie
    recoveryGraph = new LineGraph
      width: blogPostWidth
      height: height
      data: salesData
      startingDataset: 'BK69'
      keys: ['residentialPrices', 'residentialPrices-mean']
      el: $('#clinton-price')
      label: 'Avg Price Per SqFt'
      yAxisFormat: (x) -> "$#{x}"
      displayKey: (id) ->
        if neighborhoodNames[id]
          neighborhoodNames[id]
        else if id == 'compare-dataset'
          neighborhoodNames['BK50']
        else
          'Borough Average'

    recoveryGraph.animateNewArea('BK69', 'BK50')

module.exports.init = ->
  new BrooklynView
    el: $ "body"
