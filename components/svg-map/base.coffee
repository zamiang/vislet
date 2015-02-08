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
    $select: false
    scale: 0
    topoJSON: []
    neighborhoodNames: []
    data: []
    ignoredId: 'Park'
    valueFormat: ""
    mapColorMax: 1000

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
    { @rotate, @$colorKey, @mapLabel, @scale, @translateX, @translateY, @speed, @$select
      @isCholoropleth, @dateFormat, @$map, @data, @topoJSON, @neighborhoodNames, @mapColorMax,
      @dataset, @isDollar, @valueFormat, @ignoredIds } = _.defaults(options, @defaults)

    @cacheSelectors()

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
      handleSelect: (date) => @colorMap(new Date(date).valueOf())
      numberTicks: @numberTicks

  # Allows for easy referencing of map values for coloring the map
  getMapColorHash: (data) ->
    mapColorHash = {}
    for NTA in @NTAs
      unless NTA == 'ALL'
        for item in data[NTA][@dataset]
          mapColorHash[item.date] ||= []
          mapColorHash[item.date].push
            id: NTA
            value: item.value
    mapColorHash

  colorMap: (date) =>
    label = @mapLabel
    @date = date
    data = @mapColorHash[date]
    @svgMap.activeId = false
    @svgMap.colorMap data, 0, @mapColorMax, label
    @svgMap.updateMapTitle "#{moment(date).format(@dateFormat)} - #{label}"

  colorMapClick: ->
    Backbone.history.navigate("", trigger: true)
    false

  renderSvgMap: (topojson) ->
    throttledGraphHover = _.throttle @handleGraphHover, 300
    @svgMap = new svgMapView
      el: @$map
      topojson: topojson
      key: 'neighborhoods'
      ignoredIds: @ignoredIds
      drawLabels: false
      zoomOnClick: false
      $colorKey: @$colorKey
      scale: @scale
      translateX: @translateX
      translateY: @translateY
      colorKeyWidth: 610
      customMouseEnter: throttledGraphHover
      height: if @isMobile then 400 else 600
      width: if @isMobile then 340 else 500
      formatHoverText: @formatMapHoverText
      rotate: @rotate

  formatMapHoverText: (hoveredItem, value=-1) =>
    return unless @isCholoropleth

    if @mapHoverHash
      # Used for custom data filtering after a select box
      value = @mapHoverHash[hoveredItem.id]
    else unless value > -1
      return unless @mapColorHash
      return unless @mapColorHash[@slider.getValue()]

      for item in @mapColorHash[@slider.getValue()]
        if item.id == hoveredItem.id
          value = item.value
    "#{@valueFormat}#{value.toLocaleString()}: #{@neighborhoodNames[hoveredItem.id]}"

  updateMapHoverText: (item, value) ->
    text = @formatMapHoverText item, value
    @svgMap.hoverText.text text

  handleNeighborhoodSelect: (id, hoverId) ->
    @$selectedLabel.html @neighborhoodNames[id]
    if hoverId
      @$hoveredLabel.html(@neighborhoodNames[hoverId])
    @updateUI false

  showHideSlider: (visible=true) ->
    if visible
      d3.select(@slider.$el[0]).attr('class', 'svg-slider visible') unless @isMobile
    else
      d3.select(@slider.$el[0]).attr('class', 'svg-slider')

  updateUI: (visible) ->
    if visible
      @$back.fadeOut @speed
      @showHideSlider true
      @svgMap.$colorKey.addClass('visible')
      @$selectedLabel.text 'SELECTED NEIGHBORHOOD'
      @$hoveredLabel.text 'HOVERED NEIGHBORHOOD'
      @$graphContent.removeClass 'active'
      @isCholoropleth = true
      @$select.addClass('visible').find('select').val('ALL') if @$select
    else
      @$back.fadeIn @speed
      @showHideSlider false
      @svgMap.$colorKey.removeClass('visible')
      @svgMap.hoverText.text ''
      @$graphContent.addClass 'active'
      @isCholoropleth = false
      @$select.removeClass('visible') if @$select
