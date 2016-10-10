/**
 * Dataviz Experience Curve
 * Created by myles on 14/7/2016.
 */
var exp = function () {

    function compute() {
        // inputs //
        var max_unit = parseInt($("#max-unit").val()),
            startPrice0 = parseInt($('#start-price0').val()),
            expo0 = Math.log(parseFloat($('#elasticity0').val()) / 100) / Math.log(2),
            startPrice1 = parseInt($('#start-price1').val()),
            expo1 = Math.log(parseFloat($('#elasticity1').val()) / 100) / Math.log(2);
        var out = {
            line1: [],
            line2: []
        };

        // Compute for graph
        for (var unit = 1; unit <= max_unit; unit++) {
            out.line1.push({
                x: unit,
                y: Math.pow(unit, expo0) * startPrice0
            });
            out.line2.push({
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

        controller.find('input').on('input change', function (e) {
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

        
        var t;
        $(window).resize(function () {
            clearTimeout(t);
            t=setTimeout(function(){
                refresh(true);
            },300);
        });

       
        function refresh(skipCompute) {

            //console.info('refresh');
            
            if (!skipCompute) {
                out = exp.compute();
            }

            drawGraph(out);

            //var round2 = function (n) {return Math.round(n * 1e2) / 1e2;};//Round value with 2 digits precision
            //var round4 = function (n) {return Math.round(n * 1e4) / 1e4;};//Round value with 4 digits precision
        }

        function drawGraph(out) {
            
            //console.info('drawGraph(out)');
            
            var data0 = out.line1,
                data1 = out.line2,
                data = data0.concat(data1);

            var margin = 0; // PLEASE DONT USE 'margin'
            var w = $('#graphDiv').width() - margin * 2; // width
            var h = $('#graphDiv').height() - margin * 2; // height
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
                                parseInt(getMin(data, 'x')), parseInt(getMax(data, 'x'))
                            ])
                            .range([0, w-60]);
                        yScale = d3.scaleLinear()
                            .domain([
                                getMin(data, 'y'), getMax(data, 'y')])
                            .range([h-45, 0]);

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
                            .range([0, w-60]);
                        yScale = d3.scaleLog()
                            .domain([
                                getMin(data, 'y'), getMax(data, 'y')])
                            .range([h-45, 0]);

                        // create/update axes
                        xAxis = d3.axisBottom(xScale).ticks(10, d3.format(",.0f"));
                        yAxis = d3.axisLeft(yScale).ticks(10, d3.format(",.0f"));
                        break;
                }

                // create a line function that can convert data[] into x and y points
                lineFunc = d3.line()
                    // assign the X function to plot our line as we wish
                    .curve(d3.curveBasis)
                    .x(function(d){return xScale(d.x);})
                    .y(function(d){return yScale(d.y);});
            }

            calAxis();

            if ($("#graphDiv svg").length == 0) {
                
                // Add an SVG element with the desired dimensions and margin.
                graph = d3.select("#graphDiv")
                    .classed('svg-container', true)
                    .append("svg")
                    .attr("width", w)
                    .attr("height", h)
                    .classed("svg-content-responsive", true)
                    .append("svg:g")
                    .attr("transform", "translate(45,10)")
                    .attr('fill-rule', 'nonzero');

                // Add x, y axes
                graph.append("svg:g")
                    .attr('class', 'x axis')
                    .attr('transform', 'translate(0,' + (h-45) + ')')
                    .call(xAxis);

                graph.append("svg:g")
                    .attr('class', 'y axis')
                    
                    .attr('transform', 'translate(0,0)')
                    .call(yAxis);

                // Add axis labels
                graph.append("text")
                    .attr("class", "x label")
                    .attr("fill", "#aaaaaa")
                    .attr("style", "font-size:14px;")
                    .attr("text-anchor", "end")
                    .attr("x", w - 50)
                    .attr("y", h - 15)
                    .text("Cumulated production volume");


                graph.append("text")
                    .attr("class", "y label")
                    .attr("fill", "#aaaaaa")
                    .attr("style", "font-size:14px;")
                    .attr("text-anchor", "end")
                    .attr("x", 5)
                    .attr("y", -35)
                    .attr("transform", "rotate(-90)")
                    .text("Total unit cost");

                graph.append("svg:g")
                    .attr("class", "lines")
                    .attr("transform", "translate(0,0)")
                    .attr("width", w)
                    .attr("height", h)
                    .attr("pointer-events", "all");

                
                // Add curve1 (redish)
                graph.select('g.lines')
                    .append("svg:path")
                    .attr("stroke", "#cc0000")
                    .attr("fill", 'none')
                    .attr("stroke-width", 2)
                    .attr("class", "line1 line")
                    .attr("d", lineFunc(data0));

                // Add curve2 (blueish)
                graph.select('g.lines')
                    .append("svg:path")
                    .attr("stroke", "#4986DB")
                    .attr("fill", 'none')
                    .attr("stroke-width", 2)
                    .attr("class", "line2 line")
                    .attr("d", lineFunc(data1));

                
            } else {
                
                graph = d3.select("#graphDiv");
                graph.select('svg').attr("width", w + margin * 2);
                graph.select('path.line1').attr("d", lineFunc(data0));
                graph.select('path.line2').attr("d", lineFunc(data1));

                // update axis
                graph.select("g .x.axis").call(xAxis);
                graph.select("g .y.axis").call(yAxis);

                graph.select(".x.label").attr("x",w-50).attr("y",h-15);// reposition label
            }
            
            graph.selectAll(".axis").selectAll("line,path").attr('stroke', '#999');

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