/**
 * Created by myles on 14/7/2016.
 */
var exp = function () {

    var max_unit = 1000;

    function compute() {
        // inputs //
        var startPrice0 = parseInt($('#start-price0').val()),
            expo0 = Math.log2(parseFloat($('#elasticity0').val()) / 100),
            startPrice1 = parseInt($('#start-price1').val()),
            expo1 = Math.log2(parseFloat($('#elasticity1').val()) / 100);
        var out = {
            line0: [],
            line1: []
        };

        // Compute for graph
        for (var unit = 1; unit < max_unit; unit++) {
            out.line0.push({
                x: unit,
                y: Math.pow(unit, expo0) * startPrice0
            });
            out.line1.push({
                x: unit,
                y: Math.pow(unit, expo1) * startPrice1
            });
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
            val = elem.value;
            $('.controller').find('label[for=' + elem.id + '] span').text(val);

            refresh();
        });

        /**
         * switch button handling
         */
        $('#scale button').click(function () {
            var parent = $('#scale');
            var value = $(this).attr('value');
            switch (value) {
                case 'linear':
                    parent.find('button.linear').addClass('active');
                    parent.find('button.log').removeClass('active');
                    parent.attr('value', 'linear');
                    break;
                case 'log':
                    parent.find('button.log').addClass('active');
                    parent.find('button.linear').removeClass('active');
                    parent.attr('value', 'log');
                    break;
                default:
                    return false;
            }
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
            var data0 = out.line0,
                data1 = out.line1,
                data = data0.concat(data1);

            var margin = 50; //px
            var w = $('#graphDiv').width() - margin * 2; // width
            var h = 400 - margin * 2; // height
            var graph;

            var xScale, yScale, xAxis, yAxis, lineFunc;

            /* Calculate axis */
            function calAxis() {
                var scale = $('#scale').attr('value');
                switch (scale) {
                    case 'linear':
                        // Fit scale with data
                        xScale = d3.scaleLinear()
                            .domain([
                                0, (parseInt(getMax(data, 'x')))
                            ])
                            .range([0, w]);
                        yScale = d3.scaleLinear()
                            .domain([
                                getMin(data, 'y'), (getMax(data, 'y'))])
                            .range([h, 0]);

                        // create/update axes
                        xAxis = d3.axisBottom(xScale).ticks(10);
                        yAxis = d3.axisLeft(yScale).ticks(10);
                        break;

                    case 'log':
                        // Fit scale with data
                        xScale = d3.scaleLog()
                            .domain([
                                1, parseInt(getMax(data, 'x'))
                            ])
                            .range([0, w]);
                        yScale = d3.scaleLog()
                            .domain([
                                getMin(data, 'y'), getMax(data, 'y')])
                            .range([h, 0]);

                        // create/update axes
                        xAxis = d3.axisBottom(xScale).ticks(10, d3.format(",.0f"));
                        yAxis = d3.axisLeft(yScale).ticks(10, d3.format(",.0f"));
                        break;
                }

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
                    .attr("x", w + 2)
                    .attr("y", h + 30)
                    .text("Cumulative unis of production");
                graph.append("text")
                    .attr("class", "y label")
                    .attr("text-anchor", "end")
                    .attr("y", -40)
                    .attr("x", 5)
                    .attr("transform", "rotate(-90)")
                    .text("Direct cost per unit");

                graph.append("svg:g")
                    .attr("class", "lines")
                    .attr("transform", "translate(0,0)")
                    .attr("width", w)
                    .attr("height", h)
                    .attr("pointer-events", "all");

                // Add illustration
                var infoBox = graph.append("svg:g")
                    .attr('class', 'infoBox')
                    .attr("transform", "translate(" + (w - 60) + "," + 10 + ")");
                infoBox.append('rect')
                    .attr('y', "5")
                    .attr("stroke", "black")
                    .attr("style", "stroke-width:1px;stroke:#aaa;fill:none;")
                    .attr("width", "70")
                    .attr("height", "35");
                infoBox.append('rect')
                    .attr("x", "10")
                    .attr("y", "10")
                    .attr("style", "stroke:none")
                    .attr("width", "10")
                    .attr("height", "10")
                    .attr("fill", "#a55")
                    .attr("id", "color1");
                infoBox.append('rect')
                    .attr("x", "10")
                    .attr("y", "25")
                    .attr("style", "stroke:none")
                    .attr("width", "10")
                    .attr("height", "10")
                    .attr("fill", "#55a")
                    .attr("id", "color2");

                infoBox.append('text')
                    .attr("fill", "black")
                    .attr("x", "25")
                    .attr("y", "20")
                    .attr("id", "color1-text")
                    .attr("style", "font-size:12px;")
                    .text('Curve 1');

                infoBox.append('text')
                    .attr("fill", "black")
                    .attr("x", "25")
                    .attr("y", "35")
                    .attr("id", "color2-text")
                    .attr("style", "font-size:12px;")
                    .text('Curve 2');


                // Add curve0
                graph.select('g.lines')
                    .append("svg:path")
                    .attr("stroke", "#a55")
                    .attr("fill", 'none')
                    .attr("stroke-width", 2)
                    .attr("class", "line0 line")
                    .attr("d", lineFunc(data0));

                // Add curve1
                graph.select('g.lines')
                    .append("svg:path")
                    .attr("stroke", "#55a")
                    .attr("fill", 'none')
                    .attr("stroke-width", 2)
                    .attr("class", "line1 line")
                    .attr("d", lineFunc(data1));

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
                graph.select('path.line0').attr("d", lineFunc(data0));
                graph.select('path.line1').attr("d", lineFunc(data1));

                // update axis
                graph.select("g .x.axis").call(xAxis);
                graph.select("g .y.axis").call(yAxis);

                // reposition label texts and hint box
                graph.select(".x.label")
                    .attr("x", w + 2)
                    .attr("y", h + 30);
                graph.select('.infoBox').attr("transform", "translate(" + (w - 60) + "," + 10 + ")");
            }
            graph.selectAll(".axis")
                .selectAll("line,path")
                .attr('stroke', '#999');

            // Add the line by appending an svg:path element with the data line we created above
            // do this AFTER the axes above so that the line is above the tick-lines
            function getMax(data, key) {
                var max = 0;
                $(data).each(function () {
                    max = (parseFloat(this[key]) > parseFloat(max)) ? parseFloat(this[key]) : max;
                });
                return max
            }

            function getMin(data, key) {
                var min = -1;
                $(data).each(function () {
                    min = (parseFloat(this[key]) < parseFloat(min)) ? parseFloat(this[key]) : (min > -1 ? min : parseFloat(this[key]));
                });
                return min
            }

        }


    }
);


