module.exports =

  appendTooltips: (color, svg) ->
    # append the circle at the intersection
    tooltips = @svgLines
      .append("g")
      .attr('class', 'tooltips')

    for line in @lines
      tooltips.append("circle")
        .attr("class", "y circle-#{line.name}")
        .style("fill", "none")
        .style("stroke", color(line.name) )
        .attr("r", 4)

    x = @x
    y = @y

    mousemove = (event) =>
      return unless @tooltipsVisible
      bisectDate = d3.bisector((d) -> d.date).right
      x0 = x.invert(d3.mouse(event)[0])
      for line in @lines
        i = bisectDate(line.values, new Date(x0))

        d0 = line.values[i - 1]
        d1 = line.values[i]
        d = if x0 - d0.date > d1.date - x0 then d1 else d0

        @svgLines.select(".circle-#{line.name}")
          .attr("transform", "translate(#{x(d.date)},#{y(d.value)})")

    # append the rectangle to capture mouse
    svg.append("rect")
      .attr("width", @width)
      .attr("height", @height)
      .style("fill", "none")
      .style("pointer-events", "all")
      .on("mouseover", => @mouseover() )
      .on("mouseout", => @mouseout() )
      .on("mousemove", -> mousemove(@))

  mouseover: ->
    @tooltipsVisible = true
    @svgLines.select('.tooltips').style("display", "block")

  mouseout: ->
    @tooltipsVisible = false
    @svgLines.select('.tooltips').style("display", "none")
