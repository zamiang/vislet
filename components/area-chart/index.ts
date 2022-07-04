import d3 from "d3";
import _ from "lodash";
import Backbone from "backbone";
import moment from "moment";
import Key from "../line-graph/key";
import Tooltips from "../svg-tooltips/index";

const AreaChartClass = (function () {
  const AreaChart = class AreaChart extends Backbone.View {
    margin: { top: number; left: number; right: number; bottom: number };
    defaults: {
      displayKey: boolean;
      interpolate: string;
      speed: number;
      colorSet: any;
      yAxisFormat(x: any): any;
      computeYDomain: boolean;
      recomputeYDomain: boolean;
      label: boolean;
      ignoredIds: {};
      tooltipFormat: string;
    };
    data: any;
    width: any;
    height: any;
    keys: any;
    startingDataset: any;
    label: any;
    speed: any;
    colorSet: any;
    yAxisFormat: any;
    computeYDomain: any;
    recomputeYDomain: any;
    ignoredIds: any;
    tooltipFormat: any;
    displayKey: any;
    filterDataset: any;
    interpolate: any;
    x: any;
    y: any;
    area: any;
    svg: any;
    $el: any;
    color: any;
    stack: any;
    lines: any;
    svgBuildingType: any;
    maxY: number;
    yAxis: any;
    xAxis: any;

    static initClass() {
      _.extend(this.prototype, Key);
      _.extend(this.prototype, Tooltips);

      this.prototype.margin = {
        top: 10,
        left: 50,
        right: 0,
        bottom: 20,
      };

      this.prototype.defaults = {
        displayKey: false,
        interpolate: "cardinal",
        speed: 500,
        colorSet: d3.scale.category20c,
        yAxisFormat(x: any) {
          return d3
            .format(".1%")(x)
            .replace(/\.0+%$/, "%");
        },
        computeYDomain: false,
        recomputeYDomain: false,
        label: false,
        ignoredIds: [],
        tooltipFormat: " %",
      };
    }

    initialize(options: any) {
      ({
        data: this.data,
        width: this.width,
        height: this.height,
        keys: this.keys,
        startingDataset: this.startingDataset,
        label: this.label,
        speed: this.speed,
        colorSet: this.colorSet,
        yAxisFormat: this.yAxisFormat,
        computeYDomain: this.computeYDomain,
        recomputeYDomain: this.recomputeYDomain,
        ignoredIds: this.ignoredIds,
        tooltipFormat: this.tooltipFormat,
        displayKey: this.displayKey,
        filterDataset: this.filterDataset,
        interpolate: this.interpolate,
      } = _.defaults(options, this.defaults));
      return this.render();
    }

    render() {
      this.x = d3.time.scale().range([0, this.width]);
      this.y = d3.scale.linear().range([this.height, 0]);

      this.area = d3.svg
        .area()
        .interpolate(this.interpolate)
        .x((d: { date: any }) => this.x(Number(d.date)))
        .y0((d: { y0: any }) => this.y(d.y0))
        .y1((d: { y0: any; y: any }) => this.y(d.y0 + d.y));

      const svg = (this.svg = d3
        .select(`#${this.$el.attr("id")}`)
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
        .append("g")
        .attr(
          "transform",
          `translate(${this.margin.left}, ${this.margin.top})`
        ));

      this.svg = d3.select(`#${this.$el.attr("id")}`);

      const flattenedData = this.getFlattenedData(this.startingDataset);

      this.color = this.colorSet();
      const keys = Object.keys(flattenedData)
        .sort()
        .filter((name: any) => !Array.from(this.ignoredIds).includes(name));
      this.color.domain(keys);
      this.stack = d3.layout.stack().values((d: { values: any }) => d.values);

      this.lines = this.getLines(flattenedData);
      if (this.computeYDomain) {
        this.rescaleYAxis();
      }

      this.x.domain(
        d3.extent(
          flattenedData[Object.keys(flattenedData)[0]],
          (d: { date: any }) => Number(d.date)
        )
      );

      this.drawLines(this.lines, svg);
      if (this.displayKey) {
        this.drawKey();
      }
      this.appendTooltips(this.color, svg, this.lines);
      return this.drawLineLabels(svg);
    }
    drawKey() {
      throw new Error("Method not implemented.");
    }
    appendTooltips(color: any, svg: any, lines: any) {
      throw new Error("Method not implemented.");
    }

    getLines(data: { [x: string]: { [x: string]: any } }) {
      return this.stack(
        this.color.domain().map((name: string | number) => {
          return {
            name,
            values: Object.keys(data[name]).map((key: string | number) => {
              const d = data[name][key];
              return {
                date: Number(d.date),
                y: d.value,
              };
            }),
          };
        })
      );
    }

    getLineValue(line: { y0: any; y: any }) {
      return line.y0 + line.y;
    }

    getLineDisplayValue(line: { y: any }) {
      return line.y;
    }

    getFlattenedData(startingDataset: string | number) {
      const flattenedData = this.data[startingDataset][this.keys[0]];
      if (this.filterDataset) {
        return this.filterDataset(flattenedData);
      } else {
        return flattenedData;
      }
    }

    drawLines(
      lines: any,
      svg: {
        selectAll: (arg0: string) => {
          (): any;
          new (): any;
          data: {
            (arg0: any): {
              (): any;
              new (): any;
              enter: {
                (): {
                  (): any;
                  new (): any;
                  append: {
                    (arg0: string): {
                      (): any;
                      new (): any;
                      attr: { (arg0: string, arg1: string): any; new (): any };
                    };
                    new (): any;
                  };
                };
                new (): any;
              };
            };
            new (): any;
          };
        };
      }
    ) {
      this.svgBuildingType = svg
        .selectAll(".building-type")
        .data(lines)
        .enter()
        .append("g")
        .attr("class", "building-type");

      return this.svgBuildingType
        .append("path")
        .attr("class", "area")
        .attr("d", (d: { values: any }) => this.area(d.values))
        .style("fill", (d: { name: any }) => this.color(d.name));
    }

    animateNewArea(startingDataset: any, areaLabel: any) {
      const flattenedData = this.getFlattenedData(startingDataset);
      this.lines = this.getLines(flattenedData);

      if (this.computeYDomain) {
        this.rescaleYAxis();
      }

      const buildingTypes = this.svg
        .selectAll(".building-type .area")
        .data(this.lines)
        .transition()
        .duration(this.speed)
        .ease("linear")
        .attr("d", (d: { values: any }) => this.area(d.values));

      if (this.label && areaLabel) {
        return this.changeLabel(`${this.label} in ${areaLabel}`);
      }
    }

    rescaleYAxis() {
      const times = this.lines[0].values.length;
      let max = d3.max(
        __range__(0, times, false).map((n: string | number) =>
          d3.sum(
            this.lines.map(
              (c: { values: { [x: string]: { y: any } } }) => c.values[n].y
            )
          )
        )
      );
      // Only rescale the YAxis if a change threshold is met
      // This reduces the confusing shifting of the y axis on hover to ensure the shifting is meaninful
      if (this.maxY * 1.2 > max && this.maxY * 0.5 < max) {
        return;
      }

      max = max + max * 0.3;

      this.y.domain([0, max]);

      if (this.yAxis) {
        this.svg
          .select(".y-axis")
          .transition()
          .duration(this.speed)
          .ease("sin-in-out")
          .call(this.yAxis);
      }

      return (this.maxY = max);
    }

    drawLineLabels(svg: {
      append: (arg0: string) => {
        (): any;
        new (): any;
        attr: {
          (arg0: string, arg1: string): {
            (): any;
            new (): any;
            attr: {
              (arg0: string, arg1: string): {
                (): any;
                new (): any;
                call: { (arg0: any): void; new (): any };
              };
              new (): any;
            };
            call: { (arg0: any): void; new (): any };
          };
          new (): any;
        };
      };
    }) {
      this.xAxis = d3.svg.axis().scale(this.x).orient("bottom");

      this.yAxis = d3.svg
        .axis()
        .scale(this.y)
        .orient("left")
        .tickFormat(this.yAxisFormat);

      svg
        .append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0,${this.height})`)
        .call(this.xAxis);

      svg.append("g").attr("class", "y axis y-axis").call(this.yAxis);

      if (this.label) {
        return this.addLabel(svg, this.label);
      }
    }

    addLabel(
      g: {
        append: (arg0: string) => {
          (): any;
          new (): any;
          attr: {
            (arg0: string, arg1: number): {
              (): any;
              new (): any;
              attr: {
                (arg0: string, arg1: any): {
                  (): any;
                  new (): any;
                  style: {
                    (arg0: string, arg1: string): {
                      (): any;
                      new (): any;
                      attr: {
                        (arg0: string, arg1: string): {
                          (): any;
                          new (): any;
                          text: { (arg0: any): any; new (): any };
                        };
                        new (): any;
                      };
                    };
                    new (): any;
                  };
                };
                new (): any;
              };
            };
            new (): any;
          };
        };
      },
      label: any
    ) {
      return g
        .append("text")
        .attr("x", 10)
        .attr("y", this.margin.top)
        .style("text-anchor", "start")
        .attr("class", "label-text")
        .text(label);
    }

    changeLabel(text: string) {
      return this.svg.selectAll(".label-text").text(text);
    }
  };
  AreaChart.initClass();
  return AreaChart;
})();

function __range__(left: number, right: number, inclusive: boolean) {
  let range = [];
  let ascending = left < right;
  let end = !inclusive ? right : ascending ? right + 1 : right - 1;
  for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
    range.push(i);
  }
  return range;
}

export default AreaChartClass;
