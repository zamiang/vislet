Backbone = require "backbone"
_ = require 'underscore'
moment = require 'moment'
svgMapView = require('./index.coffee')
Slider = require('../slider/index.coffee')

# Manages communication between the map, slider and graphs
module.exports = class MapViewBase extends Backbone.View

  defaults:
    speed: 200
    isCholoropleth: true
    dataset: undefined
    dateFormat: undefined
    mapLabel: "Number of Crimes"
    translateX: 0
    translateY: 0
    $colorKey: false
    $map: false
    scale: 0
    topoJSON: []
    neighborhoodNames: []
    data: []
    valueFormat: ""

  formatNeighborhoodNames: (neighborhoodNames) ->
    names = {}
    for name in Object.keys(neighborhoodNames)
      names[neighborhoodNames[name]] = name
    names

  events:
    'click .back' : 'colorMapClick'

  cacheSelectors: ->
    @$selectedLabel = @$('.selected-neighborhood-name .graph-heading')
    @$hoveredLabel = @$('.hover-neighborhood-name .graph-heading')
    @$back = @$('.back')
    @$graphContent = @$('.svg-graphs')

  initialize: (options) ->
    { @rotate, @$colorKey, @mapLabel, @scale, @translateX, @translateY, @speed, @isCholoropleth, @dateFormat, @$map, @data, @topoJSON, @neighborhoodNames, @dataset, @isDollar, @valueFormat } = _.defaults(options, @defaults)

    @cacheSelectors()

    @formattedNeighborhoodNames = @formatNeighborhoodNames @neighborhoodNames
    @isMobile = options.isMobile
    @NTAs = Object.keys @data

    @mapColorHash = @getMapColorHash @data
    @renderSvgMap @topoJSON

    @renderSlider @data

  renderSlider: (data) ->
    data =
      for item in data[@NTAs[0]][@dataset]
        item.date

    @slider = new Slider
      el: $('.svg-slider')
      width: if @isMobile then 340 else 502
      data: data
      animateStart: true
      handleSelect: (date) => @colorMap(new Date(date).valueOf())

  # Allows for easy referencing of map values for coloring the map
  getMapColorHash: (data) ->
    mapColorHash = {}
    for NTA in @NTAs
      for item in data[NTA][@dataset]
        mapColorHash[item.date] ||= []
        mapColorHash[item.date].push
          id: @formattedNeighborhoodNames[NTA]
          value: item.value
    mapColorHash

  colorMap: (date) =>
    label = @mapLabel
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

    @trigger 'hover', { currentNTA: @neighborhoodNames[currentNTA], hoverNTA: @neighborhoodNames[hoverNTA] }

  renderSvgMap: (topojson) ->
    throttledGraphHover = _.throttle @handleGraphHover, 300
    @svgMap = new svgMapView
      el: @$map
      topojson: topojson
      key: 'neighborhoods'
      ignoredId: 'Park'
      customOnClick: (id) => @handleNeighborhoodClick(id)
      drawLabels: false
      zoomOnClick: false
      $colorKey: @$colorKey
      scale: @scale
      translateX: @translateX
      translateY: @translateY
      colorKeyWidth: 610
      customMouseEnter: throttledGraphHover
      customClickSelectedArea: (=> @colorMapClick())
      height: if @isMobile then 400 else 600
      width: if @isMobile then 340 else 500
      formatHoverText: @formatMapHoverText
      rotate: @rotate

  formatMapHoverText: (hoveredItem) =>
    return unless @isCholoropleth and @mapColorHash
    value = 0
    for item in @mapColorHash[@slider.getValue()]
      if item.id == hoveredItem.id
        value = item.value
    if value > 0
      "#{@valueFormat}#{value.toLocaleString()}: #{hoveredItem.id}"

  handleNeighborhoodClick: (id) ->
    @trigger 'click', { id: @neighborhoodNames[id] }
    @$selectedLabel.html id
    @updateUI false

  updateUI: (visible) ->
    if visible
      @$back.fadeOut @speed
      @slider.$el.fadeIn(@speed)
      @svgMap.$colorKey.fadeIn(@speed) unless @isMobile
      @$selectedLabel.text 'SELECTED NEIGHBORHOOD'
      @$hoveredLabel.text 'HOVERED NEIGHBORHOOD'
      @$graphContent.removeClass 'active'
      @isCholoropleth = true
    else
      @$back.fadeIn @speed
      @slider.$el.fadeOut(@speed)
      @svgMap.$colorKey.fadeOut(@speed)
      @svgMap.hoverText.text ''
      @$graphContent.addClass 'active'
      @isCholoropleth = false
