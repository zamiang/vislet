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

# Manages communication between the map, slider and graphs
module.exports = class MapView extends Backbone.View

  dateFormat: "Q, YYYY"
  speed: 200
  isCholoropleth: true
  dataset: "residentialPrices"

  formatNeighborhoodName: (name) -> name?.split('-').join(', ')
  formatNeighborhoodNames: ->
    for NTA in Object.keys(neighborhoodNames)
      neighborhoodNames[NTA] = @formatNeighborhoodName neighborhoodNames[NTA]

  events:
    'click .back' : 'colorMapClick'

  initialize: (options) ->
    @$selectedLabel = @$('.selected-neighborhood-name .graph-heading')
    @$hoveredLabel = @$('.hover-neighborhood-name .graph-heading')
    @$back = @$('.brooklyn-svg.back')

    @NTAs = Object.keys(salesData)
    @isMobile = options.isMobile
    @formatNeighborhoodNames()
    @mapColorHash = @getMapColorHash()
    @renderSvgMap brooklynTopoJson
    @renderSlider()

  renderSlider: ->
    data =
      for item in salesData['ALL']['residentialPrices']
        item.date

    @slider = new Slider
      el: $('#brooklyn-date-slider')
      width: if @isMobile then 340 else 502
      data: data
      animateStart: true
      handleSelect: (date) => @colorMap(new Date(date).valueOf())

  # Allows for easy referencing of map values for coloring the map
  getMapColorHash: ->
    mapColorHash = {}
    console.log @dataset
    for NTA in @NTAs
      unless NTA == 'ALL'
        for item in salesData[NTA][@dataset]
          mapColorHash[item.date] ||= []
          mapColorHash[item.date].push
            id: NTA
            value: item.value
    mapColorHash

  colorMap: (date) =>
    label = "Avg Price Per SqFt"
    @date = date
    data = @mapColorHash[date]
    @svgMap.colorMap data, 0, 1000, label
    @svgMap.updateMapTitle "Q#{moment(date).format(@dateFormat)} #{label}"

  colorMapClick: ->
    @colorMap(@slider.getValue())
    @updateUI true
    false

  handleGraphHover: (currentNTA, hoverNTA) =>
    return if @isCholoropleth
    @$hoveredLabel.html neighborhoodNames[hoverNTA]

    @trigger 'hover', { currentNTA: currentNTA, hoverNTA: hoverNTA }

  renderSvgMap: (topojson) ->
    throttledGraphHover = _.throttle @handleGraphHover, 300
    @svgMap = new svgMapView
      el: $('#brooklyn-svg')
      topojson: topojson
      key: 'nycneighborhoods'
      ignoredId: 'BK99'
      customOnClick: (id) => @handleNeighborhoodClick(id)
      formatHoverText: (hoveredItem) =>
        return unless @isCholoropleth and @mapColorHash
        value = 0
        for item in @mapColorHash[@slider.getValue()]
          if item.id == hoveredItem.id
            value = item.value
        if value > 0
          "$#{value.toLocaleString()}: #{neighborhoodNames[hoveredItem.id]}"
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

  handleNeighborhoodClick: (id) ->
    @trigger 'click', { id: id }
    @$selectedLabel.html neighborhoodNames[id]
    @updateUI false

  updateUI: (visible) ->
    if visible
      @$back.fadeOut @speed
      @slider.$el.fadeIn(@speed)
      @svgMap.$colorKey.fadeIn(@speed) unless @isMobile
      @isCholoropleth = true
    else
      @$back.fadeIn @speed
      @slider.$el.fadeOut(@speed)
      @svgMap.$colorKey.fadeOut(@speed)
      @isCholoropleth = false
