var d3;

d3 = require("d3");

module.exports = {
    animateNewArea: function(startingDataset, compareDataset) {
        var flattenedData;
        flattenedData = this.getFlattenedData(startingDataset);
        this.lines = this.getLines(flattenedData, startingDataset, compareDataset);

        this.rescaleYAxis(this.svg);

        this.svg.selectAll(".sales .line").data(this.lines).transition().duration(this.speed).ease("linear").attr("d", (d) => this.line(d.values));

        if (this.displayLineLabels) {
            return this.transitionLineLabels(this.svg);
        }
    },
    transitionLineLabels: function(svg) {
        return svg.selectAll(".line-label").data(this.lines).datum((d) => ({
                name: d.name,
                value: d.values[d.values.length - 1]
            })).transition().duration(this.speed).attr("transform", (d) => "translate(" + (this.x(d.value.date)) + ", " + (this.y(d.value.value)) + ")");
    },
    rescaleYAxis: function(svg) {
        var max, min;
        max = Number(d3.min(this.lines, (c) => d3.min(c.values, (v) => v.value)));
        min = Number(d3.max(this.lines, (c) => d3.max(c.values, (v) => v.value)));

        // Only rescale the YAxis if a change threshold is met
        // This reduces the confusing shifting of the y axis on hover to ensure the shifting is meaninful
        if (this.maxY * 1.3 > max && this.maxY * 0.7 < max && this.minY * 1.3 > min && this.minY * 0.7 < min) {
            return;
        }

        this.y.domain([max, min]);
        svg.select(".y-axis").transition().duration(this.speed).ease("sin-in-out").call(this.yAxis);

        this.maxY = max;
        return this.minY = min;
    }
};
