_ = require('underscore')

module.exports =

  appendTooltips: (color, svg) ->
    # append the circle at the intersection
    tooltips = @svgLines
      .append("g")
      .attr('class', 'tooltips')

    text = tooltips.append("text")
      .attr("class", (line) -> "tooltip-label label-#{line.name}" )

    tooltips.append("circle")
      .attr("class", (d) -> "y circle-#{d.name}")
      .style("fill", "none")
      .style("stroke", (d) -> if d.name.indexOf('-mean') > -1 then 'lightgrey' else color(d.name) )
      .attr("r", 4)

    mousemove = (event) =>
      return unless @tooltipsVisible
      bisectDate = d3.bisector((d) -> d.date).right
      rect = svg.select('rect')[0][0]
      x0 = @x.invert(event.offsetX - @margin.left)

      for line in @lines
        i = bisectDate(line.values, new Date(x0))
        d0 = line.values[i - 1]
        d1 = line.values[i]
        d = if x0 - d0.date > d1.date - x0 then d1 else d0

        value = @getLineValue d
        displayValue = @getLineDisplayValue d

        if line.name.indexOf('mean') < 0
          @handleHover?(d.date, line.name, @label)

        @svgLines.select(".circle-#{line.name}")
          .attr("transform", "translate(#{@x(d.date)},#{@y(value)})")

        text = @svgLines.select(".tooltip-label.label-#{line.name}")
          .attr("transform", "translate(#{@x(d.date) + 8},#{@y(value) + 5})")
          .text(@formatOutput(displayValue))

    throttledMouseMove = _.throttle(mousemove, 100)

    # append the rectangle to capture mouse events
    svg.append("rect")
      .attr("width", @width)
      .attr("height", @height)
      .style("fill", "none")
      .style("pointer-events", "all")
      .on("mouseover", => @mouseover() )
      .on("mouseout", => @mouseout() )

    # Use jquery event handling because d3's doesn't work if throttled
    @$('rect')
      .on("mousemove", throttledMouseMove)

  getLineValue: (line) -> line.value
  getLineDisplayValue: (line) -> line.value

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
    @svgLines.select('.tooltips').style("display", "block")

  mouseout: ->
    @tooltipsVisible = false
    @svgLines.select('.tooltips').style("display", "none")
