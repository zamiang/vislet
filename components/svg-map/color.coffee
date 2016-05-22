# Component for coloring the map
d3 = require 'd3'
template = require '../graph-key/linear-key.jade'

module.exports =

  # @param {data} Array of objects { id: 123, value: 0.5 }
  colorMap: (data, min, max, label, selector='tract') ->
    hash = {}

    quantize = @getColorClass min, max

    for item in data
      hash[item.id] = quantize(item.value)

    selectColor = (item) =>
      if color = hash[item.id]
        "#{selector} #{color}"
      else
        "#{selector}"

    @svg.selectAll(".#{selector}").attr('class', selectColor)

    # Only draw once
    if max != @colorMax
      @drawColorKey(quantize.range(), quantize.quantiles(), label)
      @colorMax = max

  # Input must be sorted in ascending order
  getColorClass: (min, max) ->
    d3.scale.quantile()
      .domain([min, max])
      .range(d3.range(9).map((i) -> "color#{i}" ))

  drawColorKey: (classes, values, label) ->
    if @reverseColorKey
      classes = classes.reverse()
      values = values.reverse()

    formattedValues = for value in values
      if value < 1000000
        Number(value.toFixed(0)).toLocaleString()
      else
        num = value / 1000000
        "#{Number(num.toFixed(2)).toLocaleString()}m"

    params =
      classes: classes
      values: formattedValues
      margin: @margin
      width:  Math.floor((@colorKeyWidth or @width)/classes.length)
      label: label

    @$colorKey.html template(params)
    @drawnColorKey = true
