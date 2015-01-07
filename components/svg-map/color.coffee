# Component for coloring the map
template = require '../graph-key/linear-key.jade'

module.exports =

  # Split into 2 groups
  # - greater than selected
  # - smaller than selected
  # @param {Array} Array of objects { id: 123, value: 0.5 }
  colorMap: (data) ->
    values =
      for item in data
        if item.id != 'ALL'
          item.value

    hash = {}
    quantize = @getColorClass d3.min(values), d3.max(values)

    for item in data
      hash[item.id.split('-')[0]] = quantize(item.value)

    selectColor = (item) =>
      # return 'tract selected' if item.id == @activeId
      "tract #{hash[item.id]}"

    svg = d3.select "##{@$el.attr('id')}"
    svg.selectAll(".tract")
      .attr('class', selectColor)

    @drawColorKey(quantize.range(), quantize.quantiles())

  # Input must be sorted in ascending order
  getColorClass: (min, max) ->
    d3.scale.quantile()
      .domain([min, max])
      .range(d3.range(9).map((i) -> "color#{i}" ))

  drawColorKey: (classes, values) ->
    formattedValues = for value in values
      if value < 1000000
        Number(value.toFixed(0)).toLocaleString()
      else
        num = value / 1000000
        "#{Number(num.toFixed(3)).toLocaleString()}m"

    params =
      classes: classes
      values: formattedValues
      margin: @margin
      width: Math.floor(@width/classes.length)

    @$colorKey.html template(params)
