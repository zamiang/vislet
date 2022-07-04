var Backbone, _;

_ = require("underscore");
Backbone = require("backbone");

module.exports = {
    onClick: function(item, path, g) {
        var bounds, dx, dy, scale, translate, x, y;
        if (item.id === this.activeId) {
            Backbone.history.navigate("", {
                trigger: true,
                replace: true
            });
            return;
        }

        this.activeId = item.id;

        this.$(".tract").attr("class", "tract");
        this.$(".tract[data-id=\"" + item.id + "\"]").attr("class", "tract selected");
        this.updateMapTitle(this.title);

        Backbone.history.navigate("?area=" + item.id, {
            trigger: true,
            replace: true
        });

        if (this.zoomOnClick) {
            bounds = path.bounds(item);
            dx = bounds[1][0] - bounds[0][0];
            dy = bounds[1][1] - bounds[0][1];
            x = (bounds[0][0] + bounds[1][0]) / 2;
            y = (bounds[0][1] + bounds[1][1]) / 2;
            scale = .9 / Math.max(dx / this.width, dy / this.height);
            translate = [this.width / 2 - scale * x, this.height / 2 - scale * y];

            return g.transition().duration(this.speed).style("stroke-width", (1.5 / scale) + "px").attr("transform", "translate(" + translate + ")scale(" + scale + ")");
        }
    },
    reset: function(active, g) {
        this.$(".tract.selected").attr("class", "tract");
        active = d3.select(null);

        return g.transition().duration(this.speed).style("stroke-width", "1px").attr("transform", "");
    },
    mouseover: function(item) {
        if (item.id === this.activeId) {
            return;
        }
        if (this.hoverText != null) {
            this.hoverText.text(this.formatHoverText(item));
        }
        if (!this.activeId) {
            return;
        }
        return Backbone.history.navigate("?area=" + this.activeId + "&hover=" + item.id, {
            trigger: true,
            replace: true
        });
    },
    mouseleave: function() {
        if (!this.activeId) {
            return;
        }
        this.hoveredId = false;
        return this.hoverText != null ? this.hoverText.text("") : void 0;
    }
};
