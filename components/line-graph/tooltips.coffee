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
      .attr("class", (line) -> "y circle-#{line.name}" )
      .style("fill", "none")
      .style("stroke", (line) -> color(line.name) )
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

        @svgLines.select(".circle-#{line.name}")
          .attr("transform", "translate(#{@x(d.date)},#{@y(d.value)})")

        text = @svgLines.select(".tooltip-label.label-#{line.name}")
          .attr("transform", "translate(#{@x(d.date) + 8},#{@y(d.value) + 5})")
          .text(@formatOutput(d))

    # append the rectangle to capture mouse
    throttledMouseMove = _.throttle(mousemove, 100)

    svg.append("rect")
      .attr("width", @width)
      .attr("height", @height)
      .style("fill", "none")
      .style("pointer-events", "all")
      .on("mouseover", => @mouseover() )
      .on("mouseout", => @mouseout() )

    @$('rect')
      .on("mousemove", throttledMouseMove)

  formatOutput: (line) ->
    if line.value > 100
      Number(line.value.toFixed(0)).toLocaleString()
    else if line.value > 1
      Number(line.value.toFixed(2)).toLocaleString()
    else if line.value > 0
      "#{(line.value * 100).toFixed(2)} %"
    else
      null

  mouseover: ->
    @tooltipsVisible = true
    @svgLines.select('.tooltips').style("display", "block")

  mouseout: ->
    @tooltipsVisible = false
    @svgLines.select('.tooltips').style("display", "none")
