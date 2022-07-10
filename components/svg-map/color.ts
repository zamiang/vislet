// Component for coloring the map

var d3, template;

d3 = require("d3");
template = require("../graph-key/linear-key.jade");

module.exports = {
    // @param {data} Array of objects { id: 123, value: 0.5 }
    colorMap: function(data, min, max, label, selector : any = "tract") {
        var hash, quantize, selectColor;
        hash = {};

        quantize = this.getColorClass(min, max);

        data.forEach((item) => hash[item.id] = quantize(item.value));

        selectColor = (item) => {
            var color;
            if (color = hash[item.id]) {
                return selector + " " + color;
            } else {
                return selector;
            }
        };

        this.svg.selectAll("." + selector).attr("class", selectColor);

        // Only draw once
        if (max !== this.colorMax) {
            this.drawColorKey(quantize.range(), quantize.quantiles(), label);
            return this.colorMax = max;
        }
    },
    // Input must be sorted in ascending order
    getColorClass: (min, max) => d3.scale.quantile().domain([min, max]).range(d3.range(9).map((i) => "color" + i)),
    drawColorKey: function(classes, values, label) {
        var formattedValues, num, params;
        if (this.reverseColorKey) {
            classes = classes.reverse();
            values = values.reverse();
        }

        formattedValues = values.map((value) => {
            if (value < 1000000) {
                return Number(value.toFixed(0)).toLocaleString();
            } else {
                num = value / 1000000;
                return (Number(num.toFixed(2)).toLocaleString()) + "m";
            }
        });

        params = {
            classes: classes,
            values: formattedValues,
            margin: this.margin,
            width: Math.floor((this.colorKeyWidth || this.width) / classes.length),
            label: label
        };

        this.$colorKey.html(template(params));
        return this.drawnColorKey = true;
    }
};
