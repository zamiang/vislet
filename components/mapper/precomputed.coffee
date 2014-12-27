Backbone = require 'backbone'

module.exports = class PrecomputedTile extends Backbone.View

  initialize: (options) ->
    @context = options.context
    @computedShapes = options.computedShapes
    @draw()

  draw: ->
    for shape in @computedShapes
      @context.strokeStyle = "hsl(10, 0%, 50%)"
      for point, index in shape
        if index < 1
          @context.beginPath()
          @context.moveTo(point[0], point[1])
        else
          @context.lineTo(point[0], point[1])

      @context.stroke()
