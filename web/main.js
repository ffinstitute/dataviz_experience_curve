/**
 * Created by myles on 14/7/2016.
 */
var exp = function () {

    var max_unit = 1000;

    function compute() {
        // inputs //
        var startPrice = parseInt($('#start-price').val()),
            expo = Math.log2(parseFloat($('#elasticity').val()) / 100);
        var out = {
            line1: [
                {
                    x: 0,
                    y: startPrice
                }
            ]
        };

        // Compute for graph
        for (var unit = 1; unit < max_unit; unit++) {
            out.line1.push({
                x: unit,
                y: Math.pow(unit, expo) * startPrice
            })
        }

        return out;
    }

    return {
        compute: compute
    }
}();


$(function () {

    refresh();

    // Store zoom instance globally to limit one instance existing at max
    var zoom, out,
        controller = $('.controller');

    controller.find('input').on('input', function (e) {
        var elem = e.target,
            val;
        if (elem.id == 'scale') {
            val = parseInt(elem.value) ? "Log" : "Linear";
        } else {
            val = elem.value;
        }
        $('.controller').find('label[for=' + elem.id + '] span').text(val);

        refresh();
    });

    $(window).resize(function () {
        refresh(true);
    });

    function refresh(skipCompute) {

        if (!skipCompute) {
            out = exp.compute();
        }
        console.log('change', out);

        drawGraph(out);

        /**
         * Round value with 2 digits precision
         * @param  {[type]} n [description]
         * @return {number}   [description]
         */
        var round2 = function (n) {
            return Math.round(n * 1e2) / 1e2;
        };

        /**
         * Round value with 4 digits precision
         * @param  {[type]} n [description]
         * @return {number}   [description]
         */
        var round4 = function (n) {
            return Math.round(n * 1e4) / 1e4;
        };

    }

    function drawGraph(out) {
        var data0 = out.line1;

        var margin = 50; //px
        var w = $('#graphDiv').width() - margin * 2; // width
        var h = 400 - margin * 2; // height
        var graph;

        var xScale, yScale, xAxis, yAxis, lineFunc;

        function calAxis() {
            /* Calculate axis */
            // Fit scale with data
            xScale = d3.scaleLinear()
                .domain([
                    0, (parseInt(getMax(data0, 'x')))
                ])
                .range([0, w]);
            yScale = d3.scaleLinear()
                .domain([
                    0, (parseFloat(getMax(data0, 'y'))).toFixed(2)])
                .range([h, 0]);

            // create/update axes
            xAxis = d3.axisBottom(xScale).ticks(10);
            yAxis = d3.axisLeft(yScale).ticks(10);

            // create a line function that can convert data[] into x and y points
            lineFunc = d3.line()
            // assign the X function to plot our line as we wish
                .curve(d3.curveBasis)
                .x(function (d) {
                    // return the X coordinate where we want to plot this datapoint
                    return xScale(d.x);
                })
                .y(function (d) {
                    // return the Y coordinate where we want to plot this datapoint
                    return yScale(d.y);
                });
        }

        calAxis();

        if ($("#graphDiv svg").length == 0) {
            // Add an SVG element with the desired dimensions and margin.
            graph = d3.select("#graphDiv")
                .classed('svg-container', true)
                .append("svg")
                .attr("width", w + margin * 2)
                .attr("height", h + margin * 2)
                .classed("svg-content-responsive", true)
                .append("svg:g")
                .attr("transform", "translate(50,50)")
                .attr('fill-rule', 'nonzero');

            // Add x, y axes
            graph.append("svg:g")
                .attr('class', 'x axis')
                .attr('transform', 'translate(0,' + h + ')')
                .call(xAxis);

            graph.append("svg:g")
                .attr('class', 'y axis')
                .attr('transform', 'translate(0,0)')
                .call(yAxis);

            // Add axise labels
            graph.append("text")
                .attr("class", "x label")
                .attr("text-anchor", "end")
                .attr("x", w)
                .attr("y", h - 6)
                .text("Cumulative unis of production");
            graph.append("text")
                .attr("class", "y label")
                .attr("text-anchor", "end")
                .attr("y", 6)
                .attr("dy", ".75em")
                .attr("transform", "rotate(-90)")
                .text("Direct cost per unit");

            graph.append("svg:g")
                .attr("class", "lines")
                .attr("transform", "translate(0,0)")
                .attr("width", w)
                .attr("height", h)
                .attr("pointer-events", "all");

            // Add illustration
            /*var infoBox = graph.append("svg:g")
             .attr('class', 'infoBox')
             .attr("transform", "translate(" + (w - 210) + "," + 10 + ")");
             infoBox.append('rect')
             .attr({
             stroke: "black",
             id: "e1_rectangle",
             style: "stroke-width:1px;stroke:#aaa;fill:none;",
             width: "200",
             height: "70"
             });
             infoBox.append('rect').attr({
             x: "10",
             y: "10",
             style: "stroke:none",
             width: "10",
             height: "10",
             fill: "#0057A0",
             id: "color1"
             });
             infoBox.append('rect').attr({
             x: "10",
             y: "30",
             style: "stroke:none",
             width: "10",
             height: "10",
             fill: "#8B0000",
             id: "color2"
             });
             infoBox.append('rect').attr({
             x: "10",
             y: "50",
             style: "stroke:none",
             width: "10",
             height: "10",
             fill: "#40A500",
             id: "color3"
             });

             infoBox.append('text').attr({
             fill: "black", x: "25", y: "20", id: "color1-text", style: "font-size:12px;"
             })
             .text('Price');

             infoBox.append('text').attr({
             fill: "black", x: "25", y: "40", id: "color2-text", style: "font-size:12px;"
             })
             .text('Duration Implied Price');

             infoBox.append('text').attr({
             fill: "black", x: "25", y: "60", id: "color2-text", style: "font-size:12px;"
             })
             .text('Modified Duration Implied Price');*/

            // Add curve
            graph.select('g.lines')
                .append("svg:path")
                .attr("stroke", "#666")
                .attr("fill", 'none')
                .attr("stroke-width", 1)
                .attr("class", "line1 line")
                .attr("d", lineFunc(data0));
            // .attr('vector-effect', "non-scaling-stroke");

            // Add lines
            /*            graph.select('g.lines').append("svg:line")
             .attr("y1", yScale(0)).attr("y2", yScale(out.price[1])).attr("x1", xScale(out.rate[1])).attr("x2", xScale(out.rate[1]))
             .attr("stroke", "#555").attr("stroke-width", "1").attr('class', 'x1 line').attr('stroke-dasharray', '10, 5')
             .attr('vector-effect', "non-scaling-stroke");
             graph.select('g.lines').append("svg:line")
             .attr("y1", yScale(out.price[1])).attr("y2", yScale(out.price[1])).attr("x1", xScale(-3)).attr("x2", xScale(out.rate[1]))
             .attr("stroke", "#555").attr("stroke-width", "1").attr('class', 'y1 line').attr('stroke-dasharray', '10, 5')
             .attr('vector-effect', "non-scaling-stroke");*/
        } else {
            graph = d3.select("#graphDiv").transition().duration(200);
            graph.select('svg').attr("width", w + margin * 2);
            graph.select('path.line1').attr("d", lineFunc(data0));


            // update axis
            graph.select("g .x.axis").call(xAxis);
            graph.select("g .y.axis").call(yAxis);


            // reposition label texts and hint box
            graph.select(".x.label")
                .attr("x", w)
                .attr("y", h - 6);
            // graph.select('.infoBox').attr("transform", "translate(" + (w - 210) + "," + 10 + ")");


        }

        // Add the line by appending an svg:path element with the data line we created above
        // do this AFTER the axes above so that the line is above the tick-lines
        function getMax(data, key) {
            var max = 0;
            $(data).each(function () {
                max = (parseFloat(this[key]) > parseFloat(max)) ? this[key] : max;
            });
            return max
        }

        function getMin(data, key) {
            var min = -1;
            $(data).each(function () {
                min = (parseFloat(this[key]) < parseFloat(min)) ? this[key] : (min > -1 ? min : this[key]);
            });
            return min
        }

    }

});



