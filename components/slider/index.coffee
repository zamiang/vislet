d3 = require 'd3'
_ = require 'underscore'
Backbone = require "backbone"

module.exports = class Slider extends Backbone.View

  defaults:
    margin:
      top: 0
      left: 15
      right: 15
      bottom: 0
    speed: 500

  initialize: (options) ->
    { @data, @width, @height, @margin, @handleSelect, @speed, @startValue, @animateStart } = _.defaults(options, @defaults)
    @render()

  render: ->
    @x = d3.time.scale().range([0, @width]).clamp(true)
    @x.domain([@data[0], @data[@data.length - 1]])

    svg = d3.select("##{@$el.attr('id')}")
      .attr("width", @width + @margin.left + @margin.right)
      .attr("height", @height + @margin.top + @margin.bottom)
      .append("g")
      .attr("transform", "translate(#{@margin.left},#{@margin.top})")

    @drawKey svg
    @setupSlider svg

  bisectDate: d3.bisector((d) -> d).right
  setupSlider: (svg) ->
    debouncedSelect = _.throttle @handleSelect, 150
    brushed = (item) =>
      value = @x.invert(d3.mouse(item)[0])
      v = new Date(value).valueOf()
      i = @bisectDate(@data, v)
      d0 = @data[i - 1]
      d1 = @data[i]
      d = if v - d0 > d1 - v then d1 else d0
      @handle.attr("cx", @x(d))
      debouncedSelect d

    @brush = d3.svg.brush()
      .x(@x)
      .extent([@data[0], @data[@data.length - 1]])
      .on("brush", (-> brushed(@)))

    slider = svg.append("g")
      .attr("class", "slider")
      .call(@brush)

    slider.selectAll(".extent,.resize,.background").remove()

    @handle = slider.append("circle")
      .attr("class", "handle")
      .attr("transform", "translate(0,#{@height / 2})")
      .attr("r", 9)

    @transition(slider) if @animateStart

  getValue: ->
    new Date(@x.invert(d3.select("##{@$el.attr('id')} circle").attr('cx'))).valueOf()

  transition: (slider) ->
    slider
      .transition()
      .duration(@speed)
      .select('circle')
      .attrTween("cx", => d3.interpolate(0, value = @x(@data[@data.length - 1])))

    speed = Math.floor(@speed / @data.length)
    for item, index in @data
      if index % 4
        ((i) =>
          _.delay =>
            @handleSelect @data[i]
          , speed * i
        )(index)

  drawKey: (svg) ->
    @xAxis = d3.svg.axis()
      .scale(@x)
      .orient("bottom")
      .ticks(50)

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0,#{@height / 2})")
      .call(@xAxis)
