Backbone = require "backbone"
Backbone.$ = $
moment = require 'moment'
LineGraph = require('../../../components/line-graph/index.coffee')
PercentGraph = require('../../../components/line-graph/percent-graph.coffee')
StackedGraph = require('../../../components/area-chart/index.coffee')
MapViewBase = require('../../../components/svg-map/base.coffee')
neighborhoodNames = require('../data/nyc-neighborhood-names.json')
# threeData = require('../data/three-sales-display-data.json')
# buildingClasses = require('../data/building-class.json')
Slider = require('../../../components/slider/index.coffee')
topoJSON = require('../data/nyc.json')

module.exports.ThreeView = class ThreeView extends Backbone.View

  startingDataset: 'BK60'

  # TODO Refactor
  mobileWidth: 270
  getWidth: (width) -> if @isMobile then @mobileWidth else width

  initialize: ->
    @isMobile = @$el.width() < 500
    @renderMap()
    # @renderLineGraph()
    # @renderBuildingClassGraphs()

  renderMap: ->
    formatNeighborhoodName = (name) -> name?.split('-').join(', ')

    for NTA in Object.keys(neighborhoodNames)
      neighborhoodNames[NTA] = formatNeighborhoodName neighborhoodNames[NTA]

    mapview = new MapViewBase
      el: @$el
      isMobile: @isMobile
      mapLabel: "Avg Price per SQFT"
      dateFormat: "Q, YYYY"
      valueFormat: "$"
      dataset: "residentialPrices"
      translateX: -120
      translateY: 60
      scale: 1.67
      $colorKey: $('.three-svg-key')
      $map: $('#three-svg')
      # data: threeData
      topoJSON: topoJSON
      neighborhoodNames: neighborhoodNames
      ignoredIds: ['99', '98']
      rotate: [74 + 700 / 60, -38 - 50 / 60]

    mapview.on 'hover', (params) =>
      @lineGraph.animateNewArea(params.currentNTA, params.hoverNTA)
    mapview.on 'click', (params) =>
      @lineGraph.animateNewArea(params.id)
      @stackedGraph.animateNewArea(params.id)
      @stackedGraph.changeLabel "Building Class as % of sales in #{neighborhoodNames[params.id]}"

  renderBuildingClassGraphs: ->
    width = @getWidth(490)
    blogPostWidth = @getWidth(460)
    height = 230

    @stackedGraph = new StackedGraph
      el: $('#three-residential-building-class')
      width: width
      height: height
      data: salesData
      startingDataset: @startingDataset
      keys: ['buildingClass']
      label: 'Building Class as % of sales'
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
      el: $('#three-residential-price-tally')
      label: 'Avg Price Per SqFt'
      yAxisFormat: (x) -> "$#{x}"
      handleHover: @handleHover

module.exports.init = ->
  new ThreeView
    el: $ "body"
