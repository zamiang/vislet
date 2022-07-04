var d3, _;

_ = require("underscore");
d3 = require("d3");

module.exports = {
    appendTooltips: function(color, svg, data) {
        var tooltips;
        this.appendMouseEventsCapture(color, svg);

        // append the circle at the intersection
        tooltips = svg.selectAll(".tooltips").data(data).enter().append("g").attr("class", (d) => "tooltips tooltip-" + d.name);

        tooltips.append("text").attr("class", "tooltip-label").attr("transform", "translate(8, 5)");

        return tooltips.append("circle").attr("r", 4).attr("class", "tooltip-circle").style("stroke", (d) => {
            if (d.name.indexOf("-mean") > -1) {
                return "lightgrey";
            } else {
                return color(d.name);
            }
        });
    },
    appendMouseEventsCapture: function(color, svg) {
        // append the rectangle to capture mouse events
        var throttledMouseMove;
        svg.append("rect").attr("width", this.width).attr("height", this.height).style("fill", "none").style("pointer-events", "all").on("mouseover", () => this.mouseover()).on("mouseout", () => this.mouseout());

        // Use jquery event handling because d3's doesn't work if throttled
        throttledMouseMove = _.throttle(((event) => this.mousemove(event)), 150);
        return this.$("rect").on("mousemove", throttledMouseMove);
    },
    getLineValue: (line) => line.value,
    getLineDisplayValue: (line) => line.value,
    formatOutput: function(value) {
        if (value > 100) {
            return Number(value.toFixed(0)).toLocaleString();
        } else if (value > 1) {
            return Number(value.toFixed(2)).toLocaleString();
        } else if (value > 0) {
            return ((value * 100).toFixed(2)) + this.tooltipFormat;
        } else if (value < 1 && value > 0) {
            return this.formatFixedPercent(value);
        } else {
            return null;
        }
    },
    mouseover: function() {
        this.tooltipsVisible = true;
        return this.svg.selectAll(".tooltips").style("display", "block");
    },
    mouseout: function() {
        this.tooltipsVisible = false;
        return this.svg.selectAll(".tooltips").style("display", "none");
    },
    mousemove: function(event) {
        var bisectDate, d, d0, d1, displayValue, i, index, rect, text, tooltipSvg, tooltipText, transform, value, x0;
        if (!this.tooltipsVisible) {
            return;
        }
        bisectDate = d3.bisector((d) => d.date).right;
        rect = this.svg.select("rect")[0][0];
        x0 = this.x.invert(event.offsetX - this.margin.left);

        // TODO
        // Refactor this
        index = 0;
        return this.lines.map((line) => {
            i = bisectDate(line.values, new Date(x0));
            d0 = line.values[i - 1];
            d1 = line.values[i];
            d = x0 - (d0 != null ? d0.date : void 0) > (d1 != null ? d1.date : void 0) - x0 ? d1 : d0;

            value = this.getLineValue(d);
            displayValue = this.getLineDisplayValue(d);

            tooltipSvg = this.svg.select(".tooltip-" + line.name);

            if (text = this.formatOutput(displayValue)) {
                tooltipSvg.attr("transform", "translate(" + (this.x(d.date)) + "," + (this.y(value)) + ")").style("display", "block");
                tooltipText = tooltipSvg.select(".tooltip-label").text(text);

                // Alternate sides
                transform = index % 2 ? "translate(" + (-8 - tooltipText[0][0].getBBox().width) + ", 4)" : "translate(8, 4)";
                tooltipText.attr("transform", transform);
                return index++;
            } else {
                return tooltipSvg.style("display", "none");
            }
        });
    }
};
