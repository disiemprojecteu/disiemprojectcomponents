var TimePanel = function(divName, parent) { //x,y,idlist = key,value,idList

    var vis = d3.select("#" + divName)
    this.vis = vis;

    this.width = $("#" + divName).width()
    this.height = $("#" + divName).height()
}

TimePanel.prototype = {
    init: function() {

    },
    updateData: function(data) {
        var events = data.events;
        var allNodes = data.nodes;
        var threshold = 0;

        var timeRange = d3.extent(allNodes.map(function(d) {
            return d.dateTime
        }))
        this.data = data;

        this.updateNodes(events, timeRange)
    },
    updateNodes: function(data, timeRange) {


        var timeSeries = [];

        var timeLength = timeRange[1] - timeRange[0]

        var timeStep = 10 * 60 * 1000;

        if(timeLength > 7*24*3600*1000 && timeLength <= 14*24*3600*1000){
            timeStep = 60*60*1000
        }else if(timeLength>14*24*3600*1000 && timeLength<= 30*24*3600*1000){
            timeStep = 6*60*60*1000
        }else{
            timeStep = 24*60*60*1000
        }

        var num = Math.ceil(timeLength / timeStep) + 1;

        for (var i = 0; i < data.length; i++) {
            var timeline = [];
            for (var j = 0; j <= num; j++) {
                timeline.push(0)
            }
            var nodes = data[i].allNodes;
            for (var j = 0; j < nodes.length; j++) {
                var dateTime = nodes[j].dateTime;
                var index = Math.floor(num * (dateTime - timeRange[0]) / timeLength)
                timeline[index]++
            }
            timeSeries.push(timeline)
            data[i].timeline = timeline
        }

        this.timeRange = timeRange;
        this.num = num;

        this.timeSeries = timeSeries;


        this.drawhistogram()

        this.drawBrush(timeRange)

    },
    drawBrush: function() {
        this.vis.select("svg").empty()

        var width = this.width;
        var height = this.height;
        height = this.horizonHeight

        // var svg = this.vis.append("svg")
        //   .style("position","absolute")
        //   .style("top","0")
        //   .attr("width",width)
        //   .attr("height",height)
        var svg = this.svg
        timeRange = this.timeRange;
        var xScale = d3.scaleTime()
            .domain(timeRange)
            .range([30, width])

        var brushText = svg.append("g")
          .attr("class","brushText")

        function updateBrushText(pos,values,flag){
            var timeData = flag?[{x:pos[0],val:values[0]},
              {x:pos[1],val:values[1]}]:[]

            var textSel = brushText.selectAll("text")
              .data(timeData)

            var enter = textSel.enter().append("text")
            enter.merge(textSel)
              .attr("x",function(d){
                return d.x
              })
              .attr("y",15)
              .text(function(d){
                return d.val.getLumpyString()
              })
              .attr("text-anchor",function(d,i){
                if(i==0){
                  if(d.x<width/17.0){
                    return "start"
                  }
                  return "end"
                }else{
                  if(d.x>width*16.0/17.0){
                    return "end"
                  }
                  return "start"
                }
              })
            textSel.exit().remove()
        }

        function notify(e) {
            var s = d3.event.selection || xScale.range();
            console.log("brushing", s)

            var what = s.map(xScale.invert, xScale)
            updateBrushText(s,what,d3.event.selection)
                // console.log(s,what)
            notifyTimeSelection(what)
        }

        function updateTime(e){
            var s = d3.event.selection || xScale.range();
            console.log("brushing", s)

            var what = s.map(xScale.invert, xScale)
            updateBrushText(s,what,d3.event.selection)
                // console.log(s,what)
        }


        svg.append("g")
            .attr("class", "brush")
            .call(d3.brushX()
                // .x(xScale)
                .extent([
                    [0, 0],
                    [width, height]
                ])
                .on("brush",updateTime)
                .on("end", notify)
            )
            // .on("end", brushended));




    },
    draw: function() {
        var vis = this.vis;
        var events = this.data.events

        var _this = this;
        _this.hChart = []

        var step = this.width / this.num
        if (!step) {
            step = 1
        }

        var defaultHeight = 12

        var horizonHeight = defaultHeight * events.length;
        this.horizonHeight = horizonHeight

        // console.log(events)
        vis.selectAll('.horizon')
            .data(events)
            .enter()
            .append('div')
            .attr('class', 'horizon')
            .each(function(d) {
                var hChart = d3.horizonChart()
                    .height(defaultHeight)
                    .title(d.data.name)
                    .step(step)
                    .call(this, d.timeline);
            });

        d3.selectAll(".horizon>.title")
            .style("color", function(d) {
                return keywordAttributesMapping[d.key].color
            })
            .style("margin-bottom", "2px")
    },

    drawhistogram: function() {
        var vis = this.vis;
        var events = this.data.events
        var width = this.width

        var _this = this;
        _this.hChart = []

        var step = this.width / this.num
        if (!step) {
            step = 1
        }


        var total = []
        for (var i in events[0].timeline) {
            total.push(0)
        }
        var timeSeries = []
        for (var i in events) {
            timeSeries.push(events[i].timeline)
            for (var j in events[i].timeline) {
                total[j] += events[i].timeline[j]
            }
        }
        var H = 35
        var defaultHeight = 12
        var horizonHeight = defaultHeight * events.length;
        this.horizonHeight = horizonHeight + H
        var svg = vis.append('svg')
            .attr('width', width)
            .attr('height', defaultHeight * events.length + H )
            .style("position", "absolute")
            .style("top", "0")
        this.svg = svg
        var g = svg.append('g')

        var y = d3.scaleLinear()
            .domain([0, d3.max(total)])
            .range([H, 0])
        var x = d3.scaleBand().domain(d3.range(timeSeries[0].length)).range([30, width]).padding(0.1)

        var tg = g.append('g')
            .attr('transform', function() {
                return "translate(0,0)"
            })
            .attr('class', 'tg')

        tg.selectAll('rect')
            .data(total)
            .enter()
            .append('rect')
            .attr('x', function(d, i) {
                return x(i)
            })
            .attr('y', function(d) {
                return y(d)
            })
            .attr('width', x.bandwidth())
            .attr('height', function(d) {
                return H - y(d)
            })
            .style('fill', 'grey')
        tg.append('text')
            .text('All')
            .style('fill', 'grey')
            .style('font-size', defaultHeight - 2 + 'px')
            .attr('y', H - 1 + 'px')
        tg.append('line')
            .attr('x1', 0)
            .attr('x2', width)
            .attr('y1', H)
            .attr('y2', H)
            .style('stroke', 'grey')
            .style('stroke-width', '1px')

        // console.log(events)

        var opacityY = d3.scaleLinear()
            .range([0, 1])

        for (var i in events) {
            var sg = g.append('g')
                .attr('transform', function() {
                    return "translate(0," + (i * defaultHeight + H + 20) + ")"
                })
                .attr('class','singleBar')
                .datum(events[i])

            opacityY.domain([0, d3.max(events[i].timeline)])
            sg.append('text')
                .text(events[i].data.name)
                .style('fill', events[i].color)
                .style('font-size', defaultHeight - 2 + 'px')
                .attr('y', defaultHeight - 1 + 'px')
            sg.append('line')
                .attr('x1', 0)
                .attr('x2', width)
                .attr('y1', defaultHeight)
                .attr('y2', defaultHeight)
                .style('stroke', 'grey')
                .style('stroke-width', '1px')
            sg.selectAll('rect')
                .data(function(d) {
                    return events[i].timeline
                })
                .enter()
                .append('rect')
                .attr('x', function(d, i) {
                    return x(i)
                })
                .attr('y', function(d) {
                    return 0
                    return y(d)
                })
                .attr('width', x.bandwidth())
                .attr('height', function(d) {
                    return defaultHeight
                })
                .style('fill', events[i].color)
                .style('fill-opacity', function(d) {
                    return opacityY(d)
                })

        }
    },
    updateText: function(showEnglish) {
        d3.selectAll('.singleBar')
          .select('text')
          .text(function(d){
                if(showEnglish) return window.Chinese2English[d.data.name]
                    else return d.data.name
          })
    }
}

// function loadStockData(stock, callback) {
//     d3.csv('https://bost.ocks.org/mike/cubism/intro/stocks/' + stock + '.csv', function(rows) {
//             rows = rows.map(function(d) {
//             return [d3.timeParse(d.Date), +d.Open];
//         }).filter(function(d) {
//             return d[1];
//         }).reverse();

//         var date = rows[0][0],
//             compare = rows[400][1],
//             value = rows[0][1],
//             values = [];

//         rows.forEach(function(d, i ) {
//             values.push(value = (d[1] - compare) / compare);
//         });

//         callback(null, {
//             'stock': stock,
//             'values': values
//         });
//     });
// }

// var q = d3.queue();

// ['AAPL', 'BIDU', 'SINA', 'GOOG', 'MSFT', 'YHOO', 'ADBE', 'REDF', 'INSP', 'IACI', 'AVID', 'CCUR', 'DELL', 'DGII', 'HPQ', 'SGI', 'SMCI', 'SNDK', 'SYNA'].forEach(function(stock) {
//     q.defer(loadStockData, stock);
// });

// q.awaitAll(function(error, stocks) {
//     if (error) throw error;

//     d3.select('body').selectAll('.horizon')
//         .data(stocks)
//         .enter()
//         .append('div')
//         .attr('class', 'horizon')
//         .each(function(d) {
//             d3.horizonChart()
//                 .title(d.stock)
//                 .call(this, d.values);
//         });
// });
