Backbone = require "backbone"
Backbone.$ = $
_ = require 'underscore'
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
  dateFormat: "Q, YYYY"
  speed: 200
  isCholoropleth: true

  # TODO Refactor
  mobileWidth: 270
  getWidth: (width) -> if @isMobile then @mobileWidth else width

  events:
    'click .tab' : 'tabClick'
    'click .back' : 'colorMapClick'

  initialize: ->
    @$selectedLabel = @$('.selected-neighborhood-name .graph-heading')
    @$hoveredLabel = @$('.hover-neighborhood-name .graph-heading')

    @$back = @$('.brooklyn-svg.back')
    @isMobile = @$el.width() < 500
    @NTAs = Object.keys(salesData)
    @formatNeighborhoodNames()
    @mapColorHash = @getMapColorHash()
    @renderSvgMap brooklynTopoJson
    @renderLineGraph()
    @renderBuildingClassGraphs()
    @renderSlider()

  renderSlider: ->
    height = 38
    data =
      for item in salesData['ALL']['residentialPrices']
        item.date

    @slider = new Slider
      el: $('#brooklyn-date-slider')
      width: if @isMobile then 340 else 502
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
    @slider.$el.fadeIn(@speed)
    @svgMap.$colorKey.fadeIn(@speed) unless @isMobile
    @isCholoropleth = true
    false

  handleGraphHover: (currentNTA, hoverNTA) =>
    return if @isCholoropleth
    @lineGraph.animateNewArea(currentNTA, hoverNTA)

    @$hoveredLabel.html neighborhoodNames[hoverNTA]

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
      el: $('#bushwick-building-class')
      width: blogPostWidth
      height: 300
      data: salesData
      startingDataset: 'BK77'
      keys: ['buildingClass']
      label: 'Bushwick Building Class as % of sales'
      displayKey: (id) -> buildingClasses[id]

    new StackedGraph
      el: $('#heights-building-class')
      width: blogPostWidth
      height: 300
      data: salesData
      startingDataset: 'BK09'
      keys: ['buildingClass']
      label: 'Brooklyn Heights Building Class as % of sales'

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
      label: 'Greenpoint Heights Building Class as % of sales'
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

  renderSvgMap: (topojson) ->
    throttledGraphHover = _.throttle @handleGraphHover, 300
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
      customMouseEnter: throttledGraphHover
      customClickSelectedArea: (=> @colorMapClick())
      height: if @isMobile then 400 else 600
      width: if @isMobile then 340 else 500

  formatNeighborhoodName: (name) -> name?.split('-').join(', ')
  formatNeighborhoodNames: ->
    for NTA in Object.keys(neighborhoodNames)
      neighborhoodNames[NTA] = @formatNeighborhoodName neighborhoodNames[NTA]

  handleNeighborhoodClick: (id) ->
    neighbornoodName = neighborhoodNames[id]
    @lineGraph.animateNewArea(id)
    @stackedGraph.animateNewArea(id)

    @$selectedLabel.html neighbornoodName

    @$back.fadeIn @speed
    @slider.$el.fadeOut(@speed)
    @svgMap.$colorKey.fadeOut(@speed)
    @isCholoropleth = false

module.exports.init = ->
  new BrooklynView
    el: $ "body"
