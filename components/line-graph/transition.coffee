module.exports =
  animateNewArea: (startingDataset, compareDataset) ->
    flattenedData = @getFlattenedData startingDataset
    @lines = @getLines flattenedData, startingDataset, compareDataset

    svg = d3.select("##{@$el.attr('id')}")

    @rescaleYAxis svg

    svg.selectAll(".sales .line")
      .data(@lines).transition().duration(@speed)
      .ease("linear")
      .attr("d", (d) => @line(d.values))

    @transitionLineLabels svg if @displayLineLabels

  transitionLineLabels: (svg) ->
    svg.selectAll(".line-label")
      .data(@lines)
      .datum((d) -> { name: d.name, value: d.values[d.values.length - 1] } )
      .transition().duration(@speed)
      .attr("transform", (d) => "translate(#{@x(d.value.date)}, #{@y(d.value.value)})")

  # Only rescale the YAxis if a change threshold is met
  # This reduces the confusing shifting of the y axis on hover to ensure the shifting is meaninful
  rescaleYAxis: (svg, threshhold = 50) ->
    max = d3.min(@lines, (c) -> d3.min(c.values, (v) -> v.value ))
    min = d3.max(@lines, (c) -> d3.max(c.values, (v) -> v.value ))

    return if Math.abs(max - @maxY) < threshhold and Math.abs(min - @minY) < threshhold

    @y.domain([max, min])
    svg.select(".y-axis")
      .transition().duration(@speed).ease("sin-in-out")
      .call(@yAxis)

    @maxY = max
    @minY = min
