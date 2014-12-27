#
# Converts lat/long corrdinates to x/y

# @requires shapes, zoom, width, height
module.exports = ->

module.exports.convertLatLongToDisplay = (options) ->
  options.zoom = options.zoom or 1
  options.bounds = @getBounds options.shapes
  @getShapes options

module.exports.getBounds = (shapes) ->
  bounds = {}
  for shape in shapes
    for coord in shape
      point =
        x: coord[0]
        y: coord[1]

      bounds.xMin = if bounds.xMin < point.x then bounds.xMin else point.x
      bounds.xMax = if bounds.xMax > point.x then bounds.xMax else point.x
      bounds.yMin = if bounds.yMin < point.y then bounds.yMin else point.y
      bounds.yMax = if bounds.yMax > point.y then bounds.yMax else point.y

  bounds

module.exports.getShapes = (options) ->
  for shape in options.shapes
    for coord in shape
      @coordinateToPoint(coord[0], coord[1], options)

module.exports.coordinateToPoint = (latitude, longitude, options) ->
  point =
    x: latitude
    y: longitude

  options.xScale ||= options.width / Math.abs(options.bounds.xMax - options.bounds.xMin)
  options.yScale ||= options.height / Math.abs(options.bounds.yMax - options.bounds.yMin)
  options.coordScale ||= (if options.xScale < options.yScale then options.xScale else options.yScale) * options.zoom

  [
    @round((point.x - options.bounds.xMin) * options.coordScale)
    @round((options.bounds.yMax - point.y) * options.coordScale)
  ]

module.exports.round = (number) ->
  Math.round(number * 100) / 100
