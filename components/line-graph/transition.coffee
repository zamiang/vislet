d3 = require 'd3'

module.exports =
  animateNewArea: (startingDataset, compareDataset) ->
    flattenedData = @getFlattenedData startingDataset
    @lines = @getLines flattenedData, startingDataset, compareDataset

    @rescaleYAxis @svg

    @svg.selectAll(".sales .line")
      .data(@lines).transition().duration(@speed)
      .ease("linear")
      .attr("d", (d) => @line(d.values))

    @transitionLineLabels @svg if @displayLineLabels

  transitionLineLabels: (svg) ->
    svg.selectAll(".line-label")
      .data(@lines)
      .datum((d) -> { name: d.name, value: d.values[d.values.length - 1] } )
      .transition().duration(@speed)
      .attr("transform", (d) => "translate(#{@x(d.value.date)}, #{@y(d.value.value)})")

  rescaleYAxis: (svg) ->
    max = Number(d3.min(@lines, (c) -> d3.min(c.values, (v) -> v.value )))
    min = Number(d3.max(@lines, (c) -> d3.max(c.values, (v) -> v.value )))

    # Only rescale the YAxis if a change threshold is met
    # This reduces the confusing shifting of the y axis on hover to ensure the shifting is meaninful
    return if @maxY * 1.3 > max and @maxY * 0.7 < max and @minY * 1.3 > min and @minY * 0.7 < min

    @y.domain([max, min])
    svg.select(".y-axis")
      .transition().duration(@speed).ease("sin-in-out")
      .call(@yAxis)

    @maxY = max
    @minY = min
