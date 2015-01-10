Backbone = require "backbone"
$ = require 'jquery'
Backbone.$ = $
moment = require 'moment'
nycTopoJson = require('../data/nyc-neighborhoods.json')
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
    @hoveredLabel = new Label(visible: false, $el: @$('.hover-neighborhood-name'), selector: '.graph-heading')
    @$back = @$('.brooklyn-svg.back')
    @renderSvgMap nycTopoJson
    @renderLineGraph()
    @renderBuildingClassGraphs()
    @reverseNeighborhoodHash()
    @renderSlider()

    ## Setup default state
    @selectedLabel.set
      visible: true
      text: 'Click a neighborhood to see graphs for that area'
    @hoveredLabel.set
      visible: true
      text: 'Hover a neighborhood to compare'

  renderSlider: ->
    width = 502
    height = 38
    data =
      for item in salesData['ALL']['residentialPriceAverage']
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

  colorMap: (date) =>
    dataset = "residentialPriceAverage"
    label = "Avg Price Per SqFt"
    data = for NTA in Object.keys(salesData)
      value = 0
      for item in salesData[NTA][dataset]
        if item.date == date
          value = item.value
      {
        id: neighborhoodNames[NTA]
        value: value
      }

    @svgMap.colorMap data, 0, 1000, label
    @svgMap.updateMapTitle "Q#{moment(date).format(@dateFormat)} #{label}"

  colorMapClick: ->
    @colorMap(@slider.getValue())
    @$back.fadeOut @speed
    @slider.$el.fadeIn(200)
    @isCholoropleth = true
    false

  handleGraphHover: (currentId, hoverId) =>
    return if @isCholoropleth
    hoverNTA = @neighborhoodHash[hoverId]
    currentNTA = @neighborhoodHash[currentId]
    for lineGraph in @lineGraphs
      lineGraph.animateNewArea(currentNTA, hoverNTA)

    @hoveredLabel.set
      visible: true
      text: @formatNeighborhoodName(@fullNeighborhoodHash[hoverId])

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

  renderLineGraph: ->
    width = 490
    height = 230

    @lineGraphs.push new LineGraph
      width: width
      height: height
      data: salesData
      startingDataset: @startingDataset
      keys: ['residentialPriceAverage', 'residentialPriceAverage-mean']
      el: $('#brooklyn-residential-price-tally')
      label: 'Avg Price Per SqFt'
      yAxisFormat: (x) -> "$#{x}"
      handleHover: @handleHover

  renderSvgMap: (topojson) ->
    neighborhoods = []
    topojson.objects.nycneighborhoods.geometries = topojson.objects.nycneighborhoods.geometries.filter (neighborhood) ->
      neighborhood.id = neighborhood.id.split('-')[0]
      neighborhoods.push neighborhood.id
      unless neighborhood.id and neighborhood.properties.BoroCode == 3 and neighborhood.id != 'park'
        return false
      true

    @neighborhoods = neighborhoods

    @svgMap = new svgMapView
      el: $('#brooklyn-svg')
      topojson: topojson
      key: 'nycneighborhoods'
      ignoredId: 'park'
      customOnClick: (id) => @handleNeighborhoodClick(id)
      drawLabels: false
      zoomOnClick: false
      $colorKey: $('.brooklyn-svg-key')
      colorKeyWidth: 610
      customMouseEnter: @handleGraphHover
      customClickSelectedArea: (=> @colorMapClick())

  reverseNeighborhoodHash: ->
    @neighborhoodHash = {}
    @fullNeighborhoodHash = {}
    for key in Object.keys(neighborhoodNames)
      @neighborhoodHash[neighborhoodNames[key].split('-')[0]] = key
      @fullNeighborhoodHash[neighborhoodNames[key].split('-')[0]] = neighborhoodNames[key]

  formatNeighborhoodName: (name) -> name?.split('-').join(', ')
  handleNeighborhoodClick: (id) ->
    for lineGraph in @lineGraphs
      lineGraph.animateNewArea(@neighborhoodHash[id])
    @stackedGraph.animateNewArea(@neighborhoodHash[id])

    @selectedLabel.set text: @formatNeighborhoodName(@fullNeighborhoodHash[id])
    @$back.fadeIn @speed
    @slider.$el.fadeOut(200)
    @isCholoropleth = false

module.exports.init = ->
  new BrooklynView
    el: $ "body"
