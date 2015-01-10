_ = require 'underscore'
d3 = require 'd3'

module.exports =
  appendTooltips: (color, svg, data) ->
    @appendMouseEventsCapture color, svg

    # append the circle at the intersection
    tooltips = svg.selectAll(".tooltips")
      .data(data)
      .enter().append("g")
      .attr("class", (d) -> "tooltips tooltip-#{d.name}" )

    tooltips.append("text")
      .attr("class", "tooltip-label" )
      .attr("transform", "translate(8, 5)")

    tooltips.append("circle")
      .attr("r", 4)
      .attr("class", "tooltip-circle")
      .style("stroke", (d) -> if d.name.indexOf('-mean') > -1 then 'lightgrey' else color(d.name))

  appendMouseEventsCapture: (color, svg) ->
    # append the rectangle to capture mouse events
    svg.append("rect")
      .attr("width", @width)
      .attr("height", @height)
      .style("fill", "none")
      .style("pointer-events", "all")
      .on("mouseover", => @mouseover() )
      .on("mouseout", => @mouseout() )

    # Use jquery event handling because d3's doesn't work if throttled
    throttledMouseMove = _.throttle(((event) => @mousemove(event)), 150)
    @$('rect').on("mousemove", throttledMouseMove)

  getLineValue: (line) -> line?.value
  getLineDisplayValue: (line) -> line?.value

  formatOutput: (value) ->
    if value > 100
      Number(value.toFixed(0)).toLocaleString()
    else if value > 1
      Number(value.toFixed(2)).toLocaleString()
    else if value > 0
      "#{(value * 100).toFixed(2)} %"
    else if value < 1 && value > 0
      @formatFixedPercent value
    else
      null

  mouseover: ->
    @tooltipsVisible = true
    @svg.selectAll('.tooltips').style("display", "block")

  mouseout: ->
    @tooltipsVisible = false
    @svg.selectAll('.tooltips').style("display", "none")

  mousemove: (event) ->
    return unless @tooltipsVisible
    bisectDate = d3.bisector((d) -> d.date).right
    rect = @svg.select('rect')[0][0]
    x0 = @x.invert(event.offsetX - @margin.left)

    # TODO
    # Refactor this
    for line in @lines
      i = bisectDate(line.values, new Date(x0))
      d0 = line.values[i - 1]
      d1 = line.values[i]
      d = if x0 - d0?.date > d1?.date - x0 then d1 else d0

      value = @getLineValue d
      displayValue = @getLineDisplayValue d

      tooltipSvg = @svg.select(".tooltip-#{line.name}")

      if text = @formatOutput(displayValue)
        tooltipSvg
          .attr("transform", "translate(#{@x(d.date)},#{@y(value)})")
          .style('display', 'block')
        tooltipSvg.select('.tooltip-label').text(text)
      else
        tooltipSvg.style('display', 'none')
