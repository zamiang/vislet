Backbone = require "backbone"
_ = require 'underscore'
moment = require 'moment'
chicagoTopoJson = require('../data/neighborhoods.json')
crimeData = require '../data/chicago-crimes-display-data.json'
svgMapView = require('../../../components/svg-map/index.coffee')
Slider = require('../../../components/slider/index.coffee')
neighborhoodNames = require('../data/neighborhood-names.json')

# Manages communication between the map, slider and graphs
module.exports = class MapView extends Backbone.View

  dateFormat: "MMM, YYYY"
  speed: 200
  isCholoropleth: true
  dataset: "crimeTally"

  formatNeighborhoodNames: ->
    names = {}
    for name in Object.keys(neighborhoodNames)
      names[neighborhoodNames[name]] = name
    names

  events:
    'click .back' : 'colorMapClick'

  initialize: (options) ->
    @$selectedLabel = @$('.selected-neighborhood-name .graph-heading')
    @$hoveredLabel = @$('.hover-neighborhood-name .graph-heading')
    @$back = @$('.chicago-svg.back')
    @isMobile = options.isMobile

    @neighborhoodNames = @formatNeighborhoodNames()
    @NTAs = Object.keys(crimeData)

    @mapColorHash = @getMapColorHash()
    @renderSvgMap chicagoTopoJson

    @renderSlider()

  renderSlider: ->
    data =
      for item in crimeData[@NTAs[0]][@dataset]
        item.date

    @slider = new Slider
      el: $('#chicago-date-slider')
      width: if @isMobile then 340 else 502
      data: data
      animateStart: true
      handleSelect: (date) => @colorMap(new Date(date).valueOf())

  # Allows for easy referencing of map values for coloring the map
  getMapColorHash: ->
    mapColorHash = {}
    for NTA in @NTAs
      for item in crimeData[NTA][@dataset]
        mapColorHash[item.date] ||= []
        mapColorHash[item.date].push
          id: @neighborhoodNames[NTA]
          value: item.value
    mapColorHash

  colorMap: (date) =>
    label = "Number of Crimes"
    @date = date
    data = @mapColorHash[date]
    @svgMap.colorMap data, 0, 1000, label
    @svgMap.updateMapTitle "#{moment(date).format(@dateFormat)} #{label}"

  colorMapClick: ->
    @colorMap(@slider.getValue())
    @updateUI true
    false

  handleGraphHover: (currentNTA, hoverNTA) =>
    return if @isCholoropleth
    @$hoveredLabel.html hoverNTA

    @trigger 'hover', { currentNTA: neighborhoodNames[currentNTA], hoverNTA: neighborhoodNames[hoverNTA] }

  renderSvgMap: (topojson) ->
    throttledGraphHover = _.throttle @handleGraphHover, 300
    @svgMap = new svgMapView
      el: $('#chicago-svg')
      topojson: topojson
      key: 'neighborhoods'
      ignoredId: 'Park'
      customOnClick: (id) => @handleNeighborhoodClick(id)
      drawLabels: false
      zoomOnClick: false
      $colorKey: $('.chicago-svg-key')
      scale: 0.93
      translateX: 3
      translateY: 0
      colorKeyWidth: 610
      customMouseEnter: throttledGraphHover
      customClickSelectedArea: (=> @colorMapClick())
      height: if @isMobile then 400 else 600
      width: if @isMobile then 340 else 500
      formatHoverText: @formatMapHoverText
      rotate: [74 + 800 / 60, -38 - 50 / 60]

  formatMapHoverText: (hoveredItem) =>
    return unless @isCholoropleth and @mapColorHash
    value = 0
    for item in @mapColorHash[@slider.getValue()]
      if item.id == hoveredItem.id
        value = item.value
    if value > 0
      "#{value.toLocaleString()}: #{hoveredItem.id}"

  handleNeighborhoodClick: (id) ->
    @trigger 'click', { id: neighborhoodNames[id] }
    @$selectedLabel.html id
    @updateUI false

  updateUI: (visible) ->
    if visible
      @$back.fadeOut @speed
      @slider.$el.fadeIn(@speed)
      @svgMap.$colorKey.fadeIn(@speed) unless @isMobile
      @$selectedLabel.text 'SELECTED NEIGHBORHOOD'
      @$hoveredLabel.text 'HOVERED NEIGHBORHOOD'
      @isCholoropleth = true
    else
      @$back.fadeIn @speed
      @slider.$el.fadeOut(@speed)
      @svgMap.$colorKey.fadeOut(@speed)
      @svgMap.hoverText.text ''
      @isCholoropleth = false
