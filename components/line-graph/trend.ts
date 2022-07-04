module.exports = {
    drawTrend: function(svg) {
        var upperInnerArea;
        upperInnerArea = d3.svg.area().interpolate(this.interpolate).x((d) => this.x(d.date)).y0((d) => this.y(d.pct75)).y1((d) => this.y(d.pct25));

        return svg.append("path").attr("class", "trend-area").attr("d", (d) => upperInnerArea(d.values));
    }
};
