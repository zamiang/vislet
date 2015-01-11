Backbone = require "backbone"
$ = require 'jquery'
Backbone.$ = $
moment = require 'moment'
brooklynTopoJson = require('../data/brooklyn.json')
svgMapView = require('../../../components/svg-map/index.coffee')
LineGraph = require('../../../components/line-graph/index.coffee')
PercentGraph = require('../../../components/line-graph/percent-graph.coffee')
StackedGraph = require('../../../components/area-chart/index.coffee')
neighborhoodNames = require('../data/nyc-neighborhood-names.json')
salesData = require('../data/brooklyn-sales-display-data.json')
buildingClasses = require('../data/building-class.json')
Label = require('../models/label.coffee')
Slider = require('../../../components/slider/index.coffee')

module.exports.BrooklynView = class BrooklynView extends Backbone.View

  startingDataset: 'BK60'
  lineGraphs: []
  dateFormat: "Q, YYYY"
  speed: 200
  isCholoropleth: true
  events:
    'click .tab' : 'tabClick'
    'click .back' : 'colorMapClick'

  initialize: ->
    @selectedLabel = new Label(visible: true, $el: @$('.selected-neighborhood-name'), selector: '.graph-heading')
    @hoveredLabel = new Label(visible: true, $el: @$('.hover-neighborhood-name'), selector: '.graph-heading')
    @$back = @$('.brooklyn-svg.back')
    @NTAs = Object.keys(salesData)
    @mapColorHash = @getMapColorHash()
    @renderSvgMap brooklynTopoJson
    @renderLineGraph()
    @renderBuildingClassGraphs()
    @renderSlider()

  renderSlider: ->
    width = 502
    height = 38
    data =
      for item in salesData['ALL']['residentialPrices']
        item.date

    @slider = new Slider
      el: $('#brooklyn-date-slider')
      width: width
      height: height
      data: data
      animateStart: true
      handleSelect: (date) => @colorMap(new Date(date).valueOf())

  tabClick: (event) ->
    $target = $(event.target)
    return if $target.hasClass('active')
    @$('.tab').removeClass 'active'
    $target.addClass 'active'
    @$('.sales-group').hide()
    @$(".#{$target.attr('data-class')}").show()

  # Allows for easy referencing of map values for coloring the map
  getMapColorHash: ->
    mapColorHash = {}
    dataset = "residentialPrices"
    for NTA in @NTAs
      unless NTA == 'ALL'
        for item in salesData[NTA][dataset]
          mapColorHash[item.date] ||= []
          mapColorHash[item.date].push
            id: NTA
            value: item.value
    mapColorHash

  colorMap: (date) =>
    label = "Avg Price Per SqFt"
    data = @mapColorHash[date]
    @svgMap.colorMap data, 0, 1000, label
    @svgMap.updateMapTitle "Q#{moment(date).format(@dateFormat)} #{label}"

  colorMapClick: ->
    @colorMap(@slider.getValue())
    @$back.fadeOut @speed
    @slider.$el.fadeIn(200)
    @isCholoropleth = true
    false

  handleGraphHover: (currentNTA, hoverNTA) =>
    return if @isCholoropleth

    neighborhoodName = neighborhoodNames[hoverNTA]
    for lineGraph in @lineGraphs
      lineGraph.animateNewArea(currentNTA, hoverNTA)

    @hoveredLabel.set
      visible: true
      text: @formatNeighborhoodName(neighborhoodName)

  renderBuildingClassGraphs: ->
    width = 490
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
      el: $('#bushwick-building-class')
      width: 460
      height: height
      data: salesData
      startingDataset: 'BK77'
      keys: ['buildingClass']
      label: 'Bushwick Building Class as % of sales'
      displayKey: (id) -> buildingClasses[id]

    new StackedGraph
      el: $('#heights-building-class')
      width: 460
      height: height
      data: salesData
      startingDataset: 'BK09'
      keys: ['buildingClass']
      label: 'Brooklyn Heights Building Class as % of sales'

  renderLineGraph: ->
    width = 490
    height = 230

    @lineGraphs.push new LineGraph
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
      width: 620
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

    # Williamsburg graph
    new LineGraph
      width: 620
      height: height
      data: salesData
      startingDataset: 'BK73'
      keys: ['williamsburgTrend']
      el: $('#williamsburg-sales')
      label: 'Avg Price Per SqFt'
      yAxisFormat: (x) -> "$#{x}"
      displayTrend: true

  renderSvgMap: (topojson) ->
    @svgMap = new svgMapView
      el: $('#brooklyn-svg')
      topojson: topojson
      key: 'nycneighborhoods'
      ignoredId: 'BK99'
      customOnClick: (id) => @handleNeighborhoodClick(id)
      drawLabels: false
      zoomOnClick: false
      $colorKey: $('.brooklyn-svg-key')
      scale: 1.05
      translateX: 37
      translateY: 0
      colorKeyWidth: 610
      customMouseEnter: @handleGraphHover
      customClickSelectedArea: (=> @colorMapClick())

  formatNeighborhoodName: (name) -> name?.split('-').join(', ')
  handleNeighborhoodClick: (id) ->
    neighbornoodName = neighborhoodNames[id]
    for lineGraph in @lineGraphs
      lineGraph.animateNewArea(id)
    @stackedGraph.animateNewArea(id)

    @selectedLabel.set text: @formatNeighborhoodName(neighbornoodName)

    @$back.fadeIn @speed
    @slider.$el.fadeOut(200)
    @isCholoropleth = false

module.exports.init = ->
  new BrooklynView
    el: $ "body"
