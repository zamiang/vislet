module.exports =
  animateNewArea: (startingDataset) ->
    flattenedData = @getFlattenedData startingDataset
    @lines = @color.domain().map (name) ->
      { name: name, values: flattenedData[name] }

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

  rescaleYAxis: (svg) ->
    @y.domain([
      d3.min(@lines, (c) -> d3.min(c.values, (v) -> v.value ))
      d3.max(@lines, (c) -> d3.max(c.values, (v) -> v.value ))
    ])
    svg.select(".y-axis")
      .transition().duration(@speed).ease("sin-in-out")
      .call(@yAxis)
