var template;

template = require("../graph-key/key.jade");

module.exports = {
    drawKey: function() {
        var keys;
        keys = this.lines.map((line) => ({
                color: this.color(line.name),
                text: this.displayKey(line.id || line.name)
            }));

        return this.$el.after(template({
            keys: keys,
            margin: this.margin
        }));
    }
};
