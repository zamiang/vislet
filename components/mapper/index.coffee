_ = require 'underscore'
Backbone = require 'backbone'
pointInPoly = require('point-in-polygon')
converter = require '../../components/mapper/converter.coffee'

module.exports = class Mapper extends Backbone.View

  events:
    'click' : 'handleClick'

  initialize: (options) ->
    @options = options
    @setup()

  setup: ->
    @width = @$el.width()
    @height = @$el.height()
    @map = @createMap @width, @height
    @context = @map.getContext('2d')
    @$el.append @map

    if @options.shapes
      @computedShapes = converter.convertLatLongToDisplay
        shapes: @optiosn.shapes
        width: @width
        height: @height
        zoom: 1
      @draw computedShapes
    else if @options.computedShapes
      @computedShapes = @options.computedShapes
      @draw @options.computedShapes

  draw: (computedShapes) ->
    for shape in computedShapes
      @context.strokeStyle = "hsl(10, 0%, 50%)"
      for point, index in shape
        if index < 1
          @context.beginPath()
          @context.moveTo(point[0], point[1])
        else
          @context.lineTo(point[0], point[1])

      @context.stroke()

  createMap: (width, height) ->
    map = document.createElement('canvas')
    map.width = width
    map.height = height
    map

  windowToCanvas: (x, y) ->
    position = @$el.offset()
    [x - position.left, y - position.top]

  drawShape: (shape) ->
    @context.clearRect 0, 0, @width, @height
    @draw @computedShapes
    @context.fillStyle = "hsl(100, 0%, 10%)"
    for point, index in shape
      if index < 1
        @context.beginPath()
        @context.moveTo(point[0], point[1])
      else
        @context.lineTo(point[0], point[1])

    @context.fill()

  handleClick: (event) ->
    point = @windowToCanvas event.pageX, event.pageY
    for shape in @computedShapes
      if pointInPoly(point, shape)
        @drawShape shape
        break
