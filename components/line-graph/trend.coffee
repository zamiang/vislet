module.exports =
  drawTrend: (svg) ->
    upperInnerArea = d3.svg.area()
      .interpolate(@interpolate)
      .x((d) => @x(d.date) )
      .y0((d) => @y(d.pct75))
      .y1((d) => @y(d.pct25))

    svg.append('path')
      .attr('class', 'trend-area')
      .attr('d', (d) -> upperInnerArea(d.values) )
