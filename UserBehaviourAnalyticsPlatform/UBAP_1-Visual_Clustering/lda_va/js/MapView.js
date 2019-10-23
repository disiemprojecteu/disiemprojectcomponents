var MapView = function(sizeMapping, id, parent) { //x,y,idlist = key,value,idList

    this.id = id;
    this.parent = parent;

    this.sizeMapping = sizeMapping

    this.init()
}


MapView.prototype = {
    init: function() {

        this.interactionFlag = "navigation";
        // this.interactionFlag = "lasso";
        // this.interactionFlag = "click";

        this.clickedRegion = null

        this.allFlag = false;
        this.selectedMessages = {}

        this.trajectoryThreshold = 1
        this.repostingThreshold = 1

        this.physViewTown = false;

        this.physViewCoast = true;
        this.physViewRivers = true;
        this.physViewSlope = false;
        this.physViewBoarder = true;

        this.physViewCity = true;
        // this.physViewHeight = "density"; //density,city,none
        this.physViewHeight = "city"
            // this.physViewHeight = "time"

        this.physViewContour = false

        this.aggregationFlag = true;

        this.timeRange = null;

        var points = [];

        this.selectedNameIndex = {}
        this.selectedTrajectories = {}

        points = generatePoints(4096)
        var mesh = makeMesh(points)
        console.log("Init Draw:", points)
            // points = improvePoints(points,10,extent);

        primH = zero(mesh);
        this.primH = primH

        this.mesh = mesh;

    },
    // setInteractions:function(flag){
    //  if(flag=="navigation"){

    //  }else if(flag=="click"){

    //  }else if(flag=="lasso"){

    //  }
    // },
    resetNavigation: function(flag) {
        if (flag) {
            this.rawSvg.select("rect.navigationRect").style("pointer-events", "all")
        } else {
            this.rawSvg.select("rect.navigationRect").style("pointer-events", "none")
        }
    },
    initNavigation: function() {
        var _this = this;

        function zoomed() {
            var level = d3.event.transform.k;
            if (level > 3 && !mapView.physViewTown) {
                mapView.toggleViewTown(true)
                $("#buttonTown").addClass("active")
            }
            _this.svg.attr("transform", d3.event.transform);
            window.transform = d3.event.transform
            d3.selectAll('.linkline').each(function(d, i) {
                var ex = (+_this.extent['width'])/2
                var ey = (+_this.extent['height'])/2
                // // console.log(d3.select(this).attr('x1'),
                // //     d3.select(this).attr('y1'),
                // //     d3.select(this).attr('x2'),
                // //     d3.select(this).attr('y2'))

                var id = d3.select(this).attr('id').slice(4)
                var Y = $('#snapshotView' + id).position().top - ex
                var X = $('#snapshotView' + id).position().left - ey
                var height = $('#snapshotView' + id).height(), 
                  width = $('#snapshotView' + id).width()

                var x2 = X + width/2
                var y2 = Y + height/2

                var rx2 = (x2 - d3.event.transform.x) / d3.event.transform.k
                var ry2 = (y2 - d3.event.transform.y) / d3.event.transform.k
                // console.log(x2, y2, rx2, ry2)

                d3.select(this).attr('x2', rx2)
                    .attr('y2', ry2)

            })
        }
        var zoom = d3.zoom()
            .scaleExtent([1, 10])
            .on("zoom", zoomed);
        var rect = this.rawSvg
            // .append("rect")
            .insert("rect", ":first-child")
            .attr("class", "navigationRect")
            .attr("x", globalScale[0].range()[0])
            .attr("y", globalScale[1].range()[0])
            .attr("width", globalScale[0].range()[1] - globalScale[0].range()[0])
            .attr("height", globalScale[1].range()[1] - globalScale[1].range()[0])
            .style("fill", "white")
            .style("fill-opacity", 0)

        rect.call(zoom);
    },
    filterGraphByTime: function(timeRange) {
        var inputGraph = this.inputGraph

        var nodes = []
        var links = inputGraph.links

        this.timeRange = timeRange

        var filteredData = []

        for (var i = 0; i < inputGraph.nodes.length; i++) {
            if (inputGraph.nodes[i].type && inputGraph.nodes[i].type == "weibo") {
                var dateTime = inputGraph.nodes[i].dateTime
                if (dateTime >= timeRange[0] && dateTime <= timeRange[1]) {
                    nodes.push(inputGraph.nodes[i])
                }
            } else {
                var key = inputGraph.nodes[i].key
                var weiboData = keywordAttributesMapping[key].weiboData
                var filteredWeiboData = []
                for (var j = 0; j < weiboData.length; j++) {
                    var dateTime = weiboData[j].dateTime
                    if (dateTime >= timeRange[0] && dateTime <= timeRange[1]) {
                        filteredWeiboData.push(weiboData[j])
                        filteredData.push(weiboData[j])
                    }
                }
                keywordAttributesMapping[key].filteredWeiboData = filteredWeiboData
                if (filteredWeiboData.length) {
                    nodes.push(inputGraph.nodes[i])
                }
            }
        }
        notifyDataSelection(filteredData, this.selectedNameIndex)

        this.updateData({ nodes: nodes, links: links })


    },
    initData: function(inputGraph, extent, svg) {
        this.inputGraph = inputGraph;
        this.extent = extent
        globalExtent = extent
        this.rawSvg = svg;



        this.svg = svg.append("g").attr("class", "framework")

        globalScale = []
        globalScale[0] = d3.scaleLinear().domain([-0.5, 0.5])
            .range([-extent.width / 2.0, extent.width / 2.0])
        globalScale[1] = d3.scaleLinear().domain([-0.5, 0.5])
            .range([-extent.height / 2.0, extent.height / 2.0])


        var allNodes = inputGraph.nodes

        var xScale = d3.scaleLinear().domain(d3.extent(allNodes.map(function(d) {
                return d.x
            }))).range([-0.5, 0.5])
            // xScale.domain([(xScale.domain()[1]+xScale.domain()[0])/2,xScale.domain()[1]])
        var yScale = d3.scaleLinear().domain(d3.extent(allNodes.map(function(d) {
                return d.y
            }))).range([-0.5, 0.5])
            // yScale.domain([(yScale.domain()[1]+yScale.domain()[0])/2,yScale.domain()[1]])
            // var valScale = d3.scaleLinear().domain(d3.extent(nodes.map(function(d){
            //     return d.totalChildren+1
            // }))).range([0,1])

        this.xScale = xScale
        this.yScale = yScale
            // this.valScale = valScale     

        this.initNavigation()

        this.initDraw(this.svg)

        this.updateData(inputGraph)
        setButtons();

        this.toggleInteractionMode(this.interactionFlag)

    },
    updateData: function(inputGraph) {

        var extent = this.extent
        var svg = this.svg

        var nodes = []
        var allNodes = inputGraph.nodes;
        var cities = []
        var rivers = []

        var links = []
        var nodeIndex = {}

        console.time("updateData")

        for (var i = 0; i < inputGraph.nodes.length; i++) {
            if (inputGraph.nodes[i].type && inputGraph.nodes[i].type == "weibo") {
                nodes.push(inputGraph.nodes[i])
            } else {
                cities.push(inputGraph.nodes[i])
            }
        }

        var nodeIndex = {}
        for (var i = 0; i < nodes.length; i++) {
            nodeIndex[nodes[i].data.mid] = nodes[i]
        }
        for (var i = 0; i < nodes.length; i++) {
            var parent = nodes[i].parent;
            if (parent && nodeIndex[parent.data.mid]) {
                links.push({ source: parent, target: nodes[i], count: nodes[i].nodeNum })
            }
        }

        links.sort(function(a, b) {
            return b.count - a.count
        })


        // var xScale = d3.scaleLinear().domain(d3.extent(allNodes.map(function(d){
        //     return d.x
        // }))).range([-0.5,0.5])
        // // xScale.domain([(xScale.domain()[1]+xScale.domain()[0])/2,xScale.domain()[1]])
        // var yScale = d3.scaleLinear().domain(d3.extent(allNodes.map(function(d){
        //     return d.y
        // }))).range([-0.5,0.5])
        // // yScale.domain([(yScale.domain()[1]+yScale.domain()[0])/2,yScale.domain()[1]])
        // var valScale = d3.scaleLinear().domain(d3.extent(nodes.map(function(d){
        //     return d.totalChildren+1
        // }))).range([0,1])

        var xScale = this.xScale;
        var yScale = this.yScale;
        // var valScale = this.valScale
        var gaussianNodes = []

        indexedNodes = []

        for (var i = 0; i < allNodes.length; i++) {
            var depth = (allNodes[i].depth || allNodes[i].depth == 0) ? allNodes[i].depth : 0
            var id = allNodes[i].id ? allNodes[i].id : allNodes[i].key

            gaussianNodes.push([xScale(allNodes[i].x), yScale(allNodes[i].y),
                depth, id, 0.01, allNodes[i].key ? allNodes[i].key : null
            ])
            indexedNodes.push(gaussianNodes[gaussianNodes.length - 1])
                // gaussianNodes.push({x:xScale(nodes[i].data.loc[0]),
                // y:yScale(nodes[i].data.loc[1]),val:nodes[i].data.totalChildren+1})

            // console.log("map graph",globalScale[0](gaussianNodes[i][0]),globalScale[1](gaussianNodes[i][1]))
            // if(allNodes[i].id){
            if (id) {
                nodeIndex[id] = gaussianNodes[gaussianNodes.length - 1]
            }

        }

        function calDistance(p0, p1) {
            var dis = ((p0[0] - p1[0]) * (p0[0] - p1[0]) + (p0[1] - p1[1]) * (p0[1] - p1[1]))
            dis = Math.sqrt(dis);
            return dis
        }
        var oriNodes = []
        var k = 0;


        var tempSVG = d3.select("body").append("svg").attr("id", "tempSvg")

        for (var i = 0; i < links.length; i++) {
            var source = links[i].source;
            var target = links[i].target;
            var sourcePoint = [xScale(source.x), yScale(source.y)]
            var targetPoint = [xScale(target.x), yScale(target.y)]

            var distance = calDistance(sourcePoint, targetPoint)
            source.r = distance;

            if (!nodeIndex[source.id]) {
                console.log("err")
            }

            nodeIndex[source.id][4] = distance
                // target.r = distance;

            var path = tempSVG.append("path")
                .attr("d", function(d) {
                    return "M" + sourcePoint +
                        "C" + [sourcePoint[0], (sourcePoint[1] + targetPoint[1]) / 2.0] + " " + [targetPoint[0], (sourcePoint[1] + targetPoint[1]) / 2.0] + " " + targetPoint
                        // return "M"+source.data.loc+"L"+target.data.loc;
                })

            var nodesAlongPath = [];
            path = path.node()
            var l = path.getTotalLength()
            var sNum = 20;

            for (var j = 0; j <= sNum; j++) {
                var p = path.getPointAtLength(1.0 * j / sNum * l)
                var number = source.id + "," + target.id;
                var newNode = { id: number + "," + k, depth: source.depth + 1.0 * j / sNum, data: { loc: [p.x, p.y], totalChildren: source.data.totalChildren } }
                nodesAlongPath.push(newNode)
                var oNode = [p.x, p.y,
                    newNode.depth, newNode.id, distance / sNum / 2.0, links[i].source.words
                ]
                indexedNodes.push(oNode)
                gaussianNodes.push(oNode)

                k++;
            }

            // for(var j=0;j<nodesAlongPath.length;j++){
            //     var cNode = nodesAlongPath[j]
            //     cNode.projLoc = [xScale(cNode.data.loc[0]),yScale(cNode.data.loc[1])]
            // }
            links[i].nodesAlongPath = nodesAlongPath
            links[i].nodesAlongPath[0].r = distance
                // var oNode = links[i].nodesAlongPath[0]
                // oriNodes.push([xScale(oNode.data.loc[0]),yScale(oNode.data.loc[1]),
                //     oNode.depth,oNode.id,distance,links[i].source.words])        
        }
        d3.select("#tempSvg").remove();

        // var oriNodes = graph.oriNodes;

        var linkThreshold = 10;
        links = links.splice(0, linkThreshold)

        console.timeEnd("updateData")

        console.time("draw map")
        this.primH = zero(this.mesh)
        this.drawMap(nodes, links, indexedNodes, gaussianNodes, cities, svg)

        this.updateTrajectories(this.gTrajectories, "trajectories", this.primH, this.selectedTrajectories, this.terrInfo)

        console.timeEnd("draw map")

    },
    redraw: function() {
        // this.svg.selectAll("*").remove()
        this.physDraw(this.svg, this.primH, this.rivers, this.cityInfo, this.terrInfo, this.borders)

        this.updateTrajectories(this.gTrajectories, "trajectories", this.primH, this.selectedTrajectories, this.terrInfo)
            // this.toggleInteractionMode(this.interactionFlag)

    },
    setThresholdControl: function(t1, t2) {
        this.repostingThreshold = t1;
        this.trajectoryThreshold = t2;
        this.updateTrajectories(this.gTrajectories, "trajectories", this.primH, this.selectedTrajectories, this.terrInfo)
    },
    updateDynamicFeatures: function() {
        var physViewHeight = this.physViewHeight
        var gVoronoi = this.gVoronoi
        var terr = this.terrInfo.terr
        var cityInfo = this.cityInfo
        var terrInfo = this.terrInfo
        if (physViewHeight && physViewHeight == "city") {
            // visualizeVoronoi(physSVG,terr)
            updateVoronoi(gVoronoi, terr, cityInfo, terrInfo)
        }

    },
    drawMap: function(nodes, links, indexedNodes, gaussianNodes, cityNodes, svg) {

        var primH = this.primH
        var mesh = this.mesh

        nodeMeshIndex = createIndex(indexedNodes, mesh)

        // var newvals = matchNodestoTerrain1(gaussianNodes,mesh,nodeMeshIndex)
        // var newvals = matchNodestoTerrainBraod(gaussianNodes,mesh,nodeMeshIndex)
        var newvals = matchNodestoTerrainSplatting(gaussianNodes, mesh, nodeMeshIndex)


        // var newvals = matchNodestoTerrain(gaussianNodes,mesh)
        primH = add(primH, newvals)
            // primH = add(primH, cone(primH.mesh, -0.2));
        //for jinzhengnan
        // if(fileIndex && fileIndex==15){
        //     primH = add(primH, cone(primH.mesh, -0.01));
        //     //for jinzhengnan
        // }else{
        //     primH = add(primH, cone(primH.mesh, -0.1));

        // }
            primH = add(primH, cone(primH.mesh, -0.1));

        // primH = setSeaLevel(primH, runif(0.2, 0.6));
        primH = fillSinks(primH);

        // primH = doErosion(primH, runif(0, 0.1), 5);

        // cities = cityScoreNew(primH)
        cityData = cityBySetting(primH, cityNodes, nodeMeshIndex)
        cities = cityData.cities;
        cityNodeIndex = cityData.cityNodeIndex
        nodeCityIndex = cityData.nodeCityIndex

        cityInfo = {
            cities: cities,
            cityNodeIndex: cityNodeIndex,
            nodeCityIndex: nodeCityIndex
        }

        terr = getTerritories({
            h: primH,
            cities: cities,
            params: { nterrs: cities.length }
        })
        console.log("terr", terr)

        var selectedKeywordAttributes = {}
        for (var i in keywordAttributesMapping) {
            var weibo = keywordAttributesMapping[i].filteredWeiboData
            if (weibo.length) {
                selectedKeywordAttributes[i] = keywordAttributesMapping[i]
            }
        }

        // var terrNodeIndexs = createTerrNodesMapping(keywordAttributesMapping,mesh,nodeMeshIndex,terr)
        var terrNodeIndexs = createTerrNodesMapping(selectedKeywordAttributes, mesh, nodeMeshIndex, terr)
        terrNodeIndex = terrNodeIndexs.terrNodeIndex
        nodeTerrIndex = terrNodeIndexs.nodeTerrIndex

        terrInfo = {
            terr: terr,
            terrNodeIndex: terrNodeIndex,
            nodeTerrIndex: nodeTerrIndex,
            terrRatio: terrNodeIndexs.terrRatio,
            allNodeTerrIndex: terrNodeIndexs.allNodeTerrIndex,
            allTerrNodeIndex: terrNodeIndexs.allTerrNodeIndex,
            terrTime: terrNodeIndexs.terrTime
        }

        peopleTrajectories = calculateTrajectories(terrInfo)

        borders = getBorders({ terr: terr, h: primH })


        erodeH = primH


        rivers = getRiverSequence(nodeMeshIndex, links, mesh, terr, cityInfo.cities)

        rivers = rivers.map(relaxPath)

        this.rivers = rivers;
        this.cityInfo = cityInfo;
        this.terrInfo = terrInfo;
        this.borders = borders

        this.primH = erodeH
        this.peopleTrajectories = peopleTrajectories


        this.physDraw(svg, erodeH, rivers, cityInfo, terrInfo, borders)
    },
    initDraw: function(physSVG) {
        var gVoronoi = physSVG.append("g").attr("id", "voronoi")
        var gTerrNodes = physSVG.append("g").attr("id", "town")

        var gCoast = physSVG.append("g").attr("id", "coast")
        var gRiver = physSVG.append("g").attr("id", "river")
        var gSlope = physSVG.append("g").attr("id", "slope")
        var gBoarder = physSVG.append("g").attr("id", "boarder")
        var gCity = physSVG.append("g").attr("id", "city")
        var gTrajectories = physSVG.append("g").attr("id", "trajectories")

        this.gVoronoi = gVoronoi
        this.gTerrNodes = gTerrNodes

        this.gCoast = gCoast
        this.gRiver = gRiver
        this.gSlope = gSlope
        this.gBoarder = gBoarder

        this.gCity = gCity
        this.gTrajectories = gTrajectories

    },
    physDraw: function(physSVG, physH, river, cityInfo, terrInfo, borders) {

        var _this = this

        var physViewHeight = this.physViewHeight
        var physViewCoast = this.physViewCoast
        var physViewRivers = this.physViewRivers
        var physViewSlope = this.physViewSlope
        var physViewBoarder = this.physViewBoarder

        var physViewCity = this.physViewCity
        var physViewContour = this.physViewContour

        var gVoronoi = this.gVoronoi
        var gTerrNodes = this.gTerrNodes
        var gRiver = this.gRiver
        var gCoast = this.gCoast
        var gSlope = this.gSlope
        var gBoarder = this.gBoarder

        var gCity = this.gCity
        var gTrajectories = this.gTrajectories


        if (physViewHeight && physViewHeight == "density") {
            visualizeVoronoi(gVoronoi, physH, 0);
            // updateVoronoiTerr(physSVG,terrInfo.terrRatio,cityInfo,terrInfo,0)            
        } else if (physViewHeight && physViewHeight == "city") {
            // visualizeVoronoi(physSVG,terr)

            //not draw here? it is not a good solution; but notified in trajectories
            // updateVoronoi(gVoronoi,terr,cityInfo,terrInfo,this.trajectoryTerrIndex)
        } else if (physViewHeight && physViewHeight == "time") {
            visualizeVoronoi(gVoronoi, terrInfo.terrTime)

        } else {
            gVoronoi.selectAll("path.field").remove();
        }


        var contourNum = 5
        if (physViewContour) {
            for (var i = 0; i < contourNum; i++) {
                drawPaths(gVoronoi, "coast" + i, contour(terrInfo.terrTime, i / 10.0).map(relaxPath), d3.interpolateInferno(i / 10.0))
            }
        } else {
            for (var i = 0; i < contourNum; i++) {
                drawPaths(gVoronoi, "coast" + i, [], d3.interpolateInferno(i / 10.0))
            }
        }

        function drawCoast(callback) {
            if (physViewCoast) {
                drawPaths(gCoast, "coast", contour(physH, 0).map(relaxPath), null, callback);
            } else {
                drawPaths(gCoast, "coast", [], null, callback);
            }
        }



        function drawRiver(callback) {
            if (physViewRivers) {
                drawPaths(gRiver, "river", river, null, callback)
                    // drawPaths(physSVG, "river", getRivers(physH, 0.001));
            } else {
                drawPaths(gRiver, "river", [], null, callback);
            }
        }



        if (physViewSlope) {
            visualizeSlopes(gSlope, { h: physH });
        } else {
            visualizeSlopes(gSlope, { h: zero(physH.mesh) });
        }


        function drawBoarder(callback) {
            if (physViewBoarder) {
                drawPaths(gBoarder, "border", borders, null, callback)
            } else {
                drawPaths(gBoarder, "border", [], null, callback)
            }
        }



        function drawCity(callback) {
            if (physViewCity) {
                _this.visualizeCities(gCity, "city", physH, cityInfo, null, callback)
            } else {
                _this.visualizeCities(gCity, "city", physH, { cities: [] }, null)
                callback()
            }
        }


        drawCity(nextStep)

        function nextStep() {

            drawCoast()

            drawRiver()

            drawBoarder()

            _this.updateTerrNodes(gTerrNodes, "town", physH, terrInfo)

        }



        // this.terrInfo = terrInfo
        // this.cityInfo = cityInfo

        // visualizeText(physSVG,"name",physH,cityInfo,terrInfo)
    },
    visualizeCities: function(svg, cls, h, cityInfo, scale, callback) {
        if (!scale) {
            scale = globalScale
        }

        var _this = this

        console.time("city drawing")

        var cities = cityInfo.cities;
        var cityNodeIndex = cityInfo.cityNodeIndex
        var nodeCityIndex = cityInfo.nodeCityIndex

        var sizeMapping = this.sizeMapping

        var cityNode = svg.selectAll('g.' + cls)
            .data(cities, function(d) {
                return d
            })

        cityNode.exit()
            // .transition()
            // .duration(500)
            .style("fill-opacity", 0)
            .remove()

        var enter = cityNode.enter()
            .append("g")
            .attr("class", cls)

        enter.append("circle").attr("class", cls)
            .attr('cx', function(d) {
                return scale[0](h.mesh.vxs[d][0])
            })
            .attr('cy', function(d) {
                return scale[1](h.mesh.vxs[d][1])
            })
            // .attr('r', function (d, i) {return 5})
            .attr("r", function(d) {
                return 0
                    // return keywordAttributesMapping[h.mesh.vxs[d][2]].size
            })
            .style("fill-opacity", 0)
        enter.append("text").attr("class", cls)

        var flag = false;
        enter.merge(cityNode)
            .select("circle." + cls)
            .on("click", function(d) {
                var key = nodeCityIndex[d]
                _this.clickRegion(key)
            })
            .transition()
            .duration(5000)
            .attr('cx', function(d) {
                return scale[0](h.mesh.vxs[d][0]) })
            .attr('cy', function(d) {
                return scale[1](h.mesh.vxs[d][1]) })
            // .attr('r', function (d, i) {return 5})
            .attr("r", function(d) {
                var key = nodeCityIndex[d]
                if (!keywordAttributesMapping[key]) {
                    console.log("errro city")
                    return;
                }
                return sizeMapping(keywordAttributesMapping[key].filteredWeiboData.length)
                    // return keywordAttributesMapping[key].size;
                    // return keywordAttributesMapping[h.mesh.vxs[d][2]].size
            })
            // .style('fill', 'white')
            .style("fill", function(d) {
                var key = nodeCityIndex[d]
                return keywordAttributesMapping[key].color;
                // return keywordAttributesMapping[h.mesh.vxs[d][2]].color
            })
            .style("fill-opacity", 0.6)
            .style('stroke-width', 2)
            .style('stroke-linecap', 'round')
            .style('stroke', 'black')
            // .style("pointer-events","none")
            .on("end", function(d) {
                if (!flag) {
                    flag = true;
                    if (callback) {
                        callback()
                    }
                    console.timeEnd("city drawing")
                }
                console.log("end transition")
            })
            // .raise();

        enter.merge(cityNode)
            .select("text." + cls)
            .attr('x', function(d) {
                return scale[0](h.mesh.vxs[d][0]) + 7 })
            .attr('y', function(d) {
                return scale[1](h.mesh.vxs[d][1]) })
            .text(function(d) {
                var key = nodeCityIndex[d]

                if (showEnglish) return window.Chinese2English[key]
                else return key

                return key;
                // var words = h.mesh.vxs[d][2];
                // if(words && words[0]){
                //     return words[0][0]
                // }
            })
            .style("font-size", function(d) {
                var key = nodeCityIndex[d]
                return sizeMapping(keywordAttributesMapping[key].filteredWeiboData.length) / 6 + "em"
                    // return keywordAttributesMapping[key].size/8+"em";            
            })



        // svg.selectAll("circle."+cls)

    },

    resetLasso: function(flag) {
        if (flag) {
            this.svg.select("rect.lassoRect").style("pointer-events", "all")
            this.svg.select("g.lasso").style("visibility", "visible")
        } else {
            this.svg.select("rect.lassoRect").style("pointer-events", "none")
            this.svg.select("g.lasso").style("visibility", "none")
        }
    },
    initLasso: function(physSVG, nodesSel, h) {

        var _this = this

        physSVG.select("rect.lassoRect").remove()
        physSVG.select("g.lasso").remove()

        var rect = physSVG.append("rect")
            .attr("class", "lassoRect")
            .attr("x", globalScale[0].range()[0])
            .attr("y", globalScale[1].range()[0])
            .attr("width", globalScale[0].range()[1] - globalScale[0].range()[0])
            .attr("height", globalScale[1].range()[1] - globalScale[1].range()[0])
            .style("fill", "white")
            .style("fill-opacity", 0)

        // Lasso functions
        var lasso_start = function() {
            lasso.items()
                // .attr("r",3.5) // reset size
                .classed("not_possible", true)
                .classed("selected", false);
        };

        var lasso_draw = function() {

            // Style the possible dots
            lasso.possibleItems()
                .classed("not_possible", false)
                .classed("possible", true)
                .style("fill-opacity", 0.8)

            // Style the not possible dot
            lasso.notPossibleItems()
                .classed("not_possible", true)
                .classed("possible", false)
                .style("fill-opacity", 0.2)

        };

        var lasso_end = function() {
            // Reset the color of all dots
            lasso.items()
                .classed("not_possible", false)
                .classed("possible", false)
                .style("fill-opacity", 0.2)

            // Style the selected dots
            lasso.selectedItems()
                .classed("selected", true)
                .style("fill-opacity", 0.8)
                // .attr("r",7);

            // Reset the style of the not selected dots
            lasso.notSelectedItems()
                .style("fill-opacity", 0.2)
                // .attr("r",3.5);


            var filteredData = [];
            var filteredNodeData = lasso.selectedItems().data()

            if (!filteredNodeData.length) {
                filteredNodeData = lasso.notSelectedItems().data();
                //select nothing, select all
            }

            var selectedMessages = {}

            for (var i = 0; i < filteredNodeData.length; i++) {
                for (var j = 0; j < filteredNodeData[i].value.weiboData.length; j++) {

                    //shouldn't be like this..
                    if (selectedMessages[filteredNodeData[i].value.weiboData[j].data.mid]) {
                        continue;
                    }
                    filteredData.push(filteredNodeData[i].value.weiboData[j])
                    selectedMessages[filteredNodeData[i].value.weiboData[j].data.mid] = filteredNodeData[i].value.weiboData[j]

                }
            }
            notifyDataSelection(filteredData)
            _this.selectedMessages = {}

            if (!lasso.selectedItems().data().length) {
                lasso.notSelectedItems()
                    .style("fill-opacity", 0.8)
                _this.updateKeywordsOnDemand(physSVG, [], h)
            } else {
                _this.updateKeywordsOnDemand(physSVG, filteredNodeData, h)
            }

        };

        var lasso = d3.lasso()
            .closePathSelect(true)
            .closePathDistance(100)
            .items(nodesSel)
            .targetArea(rect)
            .on("start", lasso_start)
            .on("draw", lasso_draw)
            .on("end", lasso_end);

        physSVG.call(lasso)

    },
    toggleViewTown: function(flag) {
        if (flag) {
            this.gTerrNodes.style("visibility", "visible")
        } else {
            this.gTerrNodes.style("visibility", "hidden")
        }
        this.physViewTown = flag

    },
    toggleInteractionMode: function(mode) {
        if (mode == "navigation") {
            this.resetNavigation(true)
            this.resetLasso(false)
        } else if (mode == "lasso") {
            this.resetNavigation(false)
            this.resetLasso(true)
        } else if (mode == "click") {
            this.resetNavigation(false)
            this.resetLasso(false)
                //depre
        }
        this.interactionFlag = mode;
    },
    updateTerrNodes: function(physSVG, cls, h, terrInfo, scale) {
        if (!scale) {
            scale = globalScale
        }

        var _this = this

        var extent = this.extent
        var selectedNameIndex = this.selectedNameIndex

        var terr = terrInfo.terr
            // var nodeTerrIndex = terrInfo.nodeTerrIndex
        var terrNodeIndex = terrInfo.terrNodeIndex

        var terrNodes = d3.entries(terrNodeIndex)

        // var sizeMapping = d3.scaleLinear().domain(d3.extent(terrNodes.map(function(d){
        //  return d.value.weiboData.length
        // }))).range([2,4])

        var sizeMapping = d3.scaleLinear().domain(d3.extent(terrNodes.map(function(d) {
            return d.value.repostingCount
        }))).range([2, 6])

        this.townSizeMapping = sizeMapping

        var terrSel = physSVG.selectAll('g.' + cls)
            .data(terrNodes, function(d) {
                return d.key
            })

        terrSel
            .exit()
            .transition()
            .duration(500)
            .style("fill-opacity", 0)
            .remove()



        // var delayTimeMapping = d3.scaleLinear()
        //  .domain([minTime,minTime.getTime()+12*3600*1000])
        //  .range([5000,10000])
        //  .clamp(true)

        var selectedMessages = this.selectedMessages

        var enter = terrSel.enter()
            .append("g")
            .attr("class", cls)

        enter.append("circle").attr("class", cls)
            .attr("id", function(d) {
                return "town" + d.key
            })
            .style("fill-opacity", 0)
            .attr('cx', function(d) {
                return scale[0](h.mesh.vxs[d.key][0])
            })
            .attr('cy', function(d) {
                return scale[1](h.mesh.vxs[d.key][1])
            })
            .attr("r", 0)
            // enter.append("text").attr("class",cls)

        circleSel = enter.merge(terrSel)
            .select("circle." + cls)
            .attr('cx', function(d) {
                return scale[0](h.mesh.vxs[d.key][0])
            })
            .attr('cy', function(d) {
                return scale[1](h.mesh.vxs[d.key][1])
            })
            // .attr('r', function (d, i) {return 5})
            .attr("r", function(d) {
                return sizeMapping(d.value.repostingCount)
                    // return sizeMapping(d.value.weiboData.length)
                    // return keywordAttributesMapping[key].size;
                    // return keywordAttributesMapping[h.mesh.vxs[d][2]].size
            })
            // .style('fill', 'white')
            .style("fill", function(d) {
                var key = d.value.key;
                // var key = nodeCityIndex[d]
                return keywordAttributesMapping[key].color;
                // return keywordAttributesMapping[h.mesh.vxs[d][2]].color
            })
            .on("click", function(d) {
                // var x = +d3.select(this).attr('cx') + ((+extent['width'])/2)
                // var y = +d3.select(this).attr('cy') + ((+extent['height'])/2)
                var x = +d3.select(this).attr('cx')
                var y = +d3.select(this).attr('cy')
                var color = d3.select(this).style('fill')
                var add = false
                if (_this.interactionFlag != "navigation") {
                    return;
                }
                if (!selectedMessages[d.key]) {
                    selectedMessages[d.key] = d
                    add = true
                    d3.select(this).style("stroke", "red")
                } else {
                    delete selectedMessages[d.key]
                    d3.select(this).style("stroke", "none")
                }

                var point = [x, y, color, d, add]
                    // var weibos = []
                    // var texts = {}
                    // for(var i=0;i<d.value.weiboData.length;i++){
                    //  var mid = d.value.weiboData[i].data.mid;
                    //  texts[d.value.weiboData[i].data.name] = true
                    //  if(!selectedMessages[mid]){
                    //      selectedMessages[mid] = {data:d.value.weiboData[i];
                    //  }else{
                    //      delete selectedMessages[mid]
                    //      d3.select(this).select("text").remove()
                    //      return;
                    //  }
                    // }
                    // var textVal = ""
                    // var count = 0;
                    // for(var i in texts){
                    //  textVal+=i
                    //  count++
                    //  if(count>3){
                    //      textVal+="..."
                    //      break;
                    //  }
                    //  textVal+=","
                    // }
                    // d3.select(this).append("text")
                    //  .text(textVal)
                _this.updateSelectedTerrNodesClick(physSVG, selectedMessages, h, false, false, point)
            })

        circleSel.transition()
            .duration(500)
            .style("fill-opacity", 0.8)
            .style('stroke-width', 2)
            .style('stroke-linecap', 'round')
            .style('stroke', 'none')
            // .raise();

        this.updateSelectedTerrNodes(physSVG, selectedNameIndex)


        this.initLasso(physSVG, circleSel, h)
        this.resetLasso(this.interactionFlag == "lasso" ? true : false)

        this.toggleViewTown(this.physViewTown)
    },
    clickRegion: function(key) {

        var filteredNodeData = []
        var terrInfo = this.terrInfo
        var cityInfo = this.cityInfo
        var terr = terrInfo
        var terrNodeIndex = terrInfo.terrNodeIndex
        var nodeTerrIndex = terrInfo.nodeTerrIndex

        var weiboData = keywordAttributesMapping[key].filteredWeiboData;

        if (this.clickedRegion == key) {
            weiboData = []
            var nodeIndex = d3.entries(terrInfo.nodeTerrIndex)
            for (var i = 0; i < nodeIndex.length; i++) {
                var dd = nodeIndex[i].value.data
                weiboData.push(dd)
            }
            this.clickedRegion = null
        } else {
            this.clickedRegion = key
        }
        var selectedMessages = {}
        var filteredData = []

        for (var i = 0; i < weiboData.length; i++) {
            //shouldn't be like this..
            if (selectedMessages[weiboData[i].data.mid]) {
                continue;
            }
            filteredData.push(weiboData[i])
            selectedMessages[weiboData[i].data.mid] = weiboData[i]

        }
        notifyDataSelection(filteredData)
        _this.selectedMessages = selectedMessages

        this.gTerrNodes.selectAll("circle")
            .style("fill-opacity", function(d) {
                if (!terrNodeIndex[d.key]) {
                    console.log("why no key", d)
                    return 0.2
                }
                var nodes = terrNodeIndex[d.key].weiboData
                for (var i = 0; i < nodes.length; i++) {
                    var mid = nodes[i].data.mid
                    if (selectedMessages[mid]) {
                        return 0.8
                    }
                }
                return 0.2
            })

        // if(!lasso.selectedItems().data().length){
        //  _this.updateKeywordsOnDemand(physSVG,[],h)
        // }else{
        //     _this.updateKeywordsOnDemand(physSVG,filteredNodeData,h)
        // }
    },
    updateKeywordsOnDemand: function(g, data, h, scale) {
        var regionRect;
        var regionNodes = []

        if (!scale) {
            scale = globalScale
        }
        // var h = terrInfo.h

        for (var i = 0; i < data.length; i++) {
            var key = data[i].key
            var pos = [scale[0](h.mesh.vxs[key][0]), scale[1](h.mesh.vxs[key][1])]
            regionNodes.push(pos)
        }
        var rectXExtent = d3.extent(regionNodes.map(function(d) {
            return d[0]
        }))
        var rectYExtent = d3.extent(regionNodes.map(function(d) {
            return d[1]
        }))
        regionRect = {
            x: rectXExtent[0] - 5,
            y: rectYExtent[0] - 5,
            width: rectXExtent[1] - rectXExtent[0] + 10,
            height: rectYExtent[1] - rectYExtent[0] + 10
        }


        //wired iterations
        var keywordIndex = {}
        for (var i = 0; i < data.length; i++) {
            var weiboData = data[i].value.weiboData;
            for (var j = 0; j < weiboData.length; j++) {
                var keywords = weiboData[j].keywords
                for (var k = 0; k < keywords.length; k++) {
                    if (!keywordIndex[keywords[k]]) {
                        keywordIndex[keywords[k]] = { key: keywords[k], count: 0 }
                    }
                    keywordIndex[keywords[k]].count++
                }
            }
        }
        var frequency_list = []
        for (var i in keywordIndex) {
            frequency_list.push({ text: i, count: keywordIndex[i].count })
        }

        var shortEdge = regionRect.width > regionRect.height ? regionRect.width : regionRect.height

        var localSizeMapping = d3.scaleLinear().domain(d3.extent(frequency_list.map(function(d) {
            return d.count;
        }))).range([shortEdge / 40, shortEdge / 5])

        for (var i = 0; i < frequency_list.length; i++) {
            frequency_list[i].size = localSizeMapping(frequency_list[i].count)
        }

        d3.layout.cloud().size([regionRect.width, regionRect.height])
            .words(frequency_list)
            .rotate(0)
            .fontSize(function(d) {
                return d.size;
            })
            .on("end", draw)
            .start();

        var _this = this;

        function draw(word) {
            var sel = g.selectAll("text.detailKeywords")
                .data(word, function(d) {
                    return d.text
                })

            var enter = sel.enter().append("text")
                .attr("class", "detailKeywords")

            enter.merge(sel)
                .attr("x", function(d) {
                    return d.x + regionRect.x + regionRect.width / 2.0
                })
                .attr("y", function(d) {
                    return d.y + regionRect.y + regionRect.height / 2.0
                })
                .text(function(d) {
                    return d.text
                })
                .style("font-size", function(d) {
                    return d.size + 'px'
                })
            sel.exit().remove();
        }


    },
    notifyMessageSelection: function(mid) {
        var terrInfo = this.terrInfo
        var _this = this
        var nodeTerrIndex = terrInfo.nodeTerrIndex

        var index = nodeTerrIndex[mid].index
        var selectedMessages = this.selectedMessages
        var selectedOne = { key: index, value: terrNodeIndex[index] }
        var x = +d3.select("#town" + index).attr('cx')
        var y = +d3.select("#town" + index).attr('cy')
        var color = d3.select("#town" + index).style('fill')
        var add = false
        var d = d3.select('#town' + index).datum()
        if (!selectedMessages[index]) {
            selectedMessages[index] = selectedOne
            d3.select("#town" + index).style("stroke", "red")
            add = true
        } else {
            delete selectedMessages[index]
            d3.select("#town" + index).style("stroke", "none")
        }
        var point = [x, y, color, d, add]

        this.updateSelectedTerrNodesClick(this.gTerrNodes, selectedMessages, this.primH, null, true, point)

    },
    updateSelectedTerrNodesClick: function(g, selectedMessages, h, scale, notifyFlag, point) {
        var data = []
        if (!scale) {
            scale = globalScale
        }
        var selectedWeibos = []
        for (var i in selectedMessages) {
            var textIndex = {}
            var textVal = ""
            var count = 0;
            var weibos = selectedMessages[i].value.weiboData
            for (var j = 0; j < weibos.length; j++) {
                selectedWeibos.push(weibos[j])
                var name = weibos[j].data.name;
                if (textIndex[weibos[name]]) {
                    continue;
                }
                count++
                textVal += name
                if (count > 3) {
                    textVal += "..."
                    break;
                }
                if (j != weibos.length - 1) {
                    textVal += ","
                }
            }
            data.push({
                name: textVal,
                key: i,
                data: selectedMessages[i],
                pos: [scale[0](h.mesh.vxs[selectedMessages[i].key][0]), scale[1](h.mesh.vxs[selectedMessages[i].key][1])]
            })
        }
        var textSel = g.selectAll("text.highlight")
            .data(data, function(d) {
                return d.key
            })
        var enter = textSel.enter().append("text")
            .attr("class", "highlight")

        enter.merge(textSel)
            // .attr("transoform",function(d){
            //  return "translate("+d.pos+")"
            // })
            .attr("x", function(d) {
                return d.pos[0] + 2
            })
            .attr("y", function(d) {
                return d.pos[1]
            })
            .text(function(d) {
                return d.name
            })
            .style("font-size", "0.4em")
            .style("fill", "rgb(46, 78, 126)")

        textSel.exit().remove()
        showSnap(point)
        if (!notifyFlag) {
            notifyWeibo(selectedWeibos)
        }
    },
    updateSelectedTerrNodes: function(g, selectedNameIndex) {

        var allFlag = this.allFlag

        g.selectAll("circle.town")
            .style("stroke", function(d) {
                var data = d.value.weiboData;
                for (var i = 0; i < data.length; i++) {
                    if (selectedNameIndex[data[i].data.name] && !allFlag) {
                        return "red"
                    }
                }
                return "none"
            })

    },
    updateTrajectories: function(physSVG, cls, h, userIndex, terrInfo, scale) {
        if (!scale) {
            scale = globalScale
        }

        var terr = terrInfo.terr;
        var nodeTerrIndex = terrInfo.nodeTerrIndex
        var terrNodeIndex = terrInfo.terrNodeIndex;

        var cityInfo = this.cityInfo
        var nodeCityIndex = cityInfo.nodeCityIndex

        var townSizeMapping = this.townSizeMapping
        var citySizeMapping = this.sizeMapping

        var trajectories = []
        var link = {}
        var cityLink = {}

        var rLink = {}
        var rCityLink = {}

        var trajectoryTerrIndex = {}
            //use the data, instead of the sequence, the nodeterr mapping is not updated, or the time is not updated 
        for (var i in userIndex) {
            // var sequence = userIndex[i].sequence;
            var dData = userIndex[i].data;
            var tIndex = nodeTerrIndex[dData[0].id]
            trajectoryTerrIndex[terr[tIndex.index]] = true
            var sequence = []
            for (var j = 0; j < dData.length; j++) {
                sequence.push({ index: nodeTerrIndex[dData[j].id].index, data: dData[j] })
            }
            for (var j = 1; j < sequence.length; j++) {
                var index = i + "," + sequence[j - 1].index + "," + sequence[j].index
                if (!link[index]) {
                    if (!terrNodeIndex[sequence[j - 1].index] || !terrNodeIndex[sequence[j].index]) {
                        console.log("error")
                    }
                    link[index] = {
                        source: (h.mesh.vxs[sequence[j - 1].index]),
                        target: (h.mesh.vxs[sequence[j].index]),
                        count: 0,
                        user: i,
                        index: index,
                        sourceR: townSizeMapping(terrNodeIndex[sequence[j - 1].index].repostingCount),
                        targetR: townSizeMapping(terrNodeIndex[sequence[j].index].repostingCount)
                    }
                }
                link[index].count++;

                var sourceCity = terr[sequence[j - 1].index]
                var targetCity = terr[sequence[j].index]
                var sourceKey = nodeCityIndex[sourceCity]
                var targetKey = nodeCityIndex[targetCity]
                var cityIndex = sourceCity + "," + targetCity
                if (sourceCity == targetCity) {
                    continue;
                }
                if (!cityLink[cityIndex]) {
                    cityLink[cityIndex] = {
                        source: h.mesh.vxs[sourceCity],
                        target: h.mesh.vxs[targetCity],
                        count: 0,
                        userIndex: {},
                        index: cityIndex,
                        sourceR: citySizeMapping(keywordAttributesMapping[sourceKey].filteredWeiboData.length),
                        targetR: citySizeMapping(keywordAttributesMapping[targetKey].filteredWeiboData.length)
                    }
                }
                cityLink[cityIndex].count++
                    if (!cityLink[cityIndex].userIndex[i]) {
                        cityLink[cityIndex].userIndex[i] = { name: i, count: 0 }
                    }
                cityLink[cityIndex].userIndex[i].count++

                    trajectoryTerrIndex[terr[sequence[j].index]] = true
            }

            var repostings = userIndex[i].repostings
            for (var j = 0; j < repostings.length; j++) {
                var sourceIndex = repostings[j].source;
                var targetIndex = repostings[j].target;
                sourceIndex = nodeTerrIndex[sourceIndex].index
                targetIndex = nodeTerrIndex[targetIndex].index
                var source = h.mesh.vxs[sourceIndex]
                var target = h.mesh.vxs[targetIndex]
                var rIndex = source + "," + target;
                if (!rLink[rIndex]) {
                    rLink[rIndex] = {
                        source: source,
                        target: target,
                        count: 0,
                        index: rIndex,
                        sourceR: townSizeMapping(terrNodeIndex[sourceIndex].repostingCount),
                        targetR: townSizeMapping(terrNodeIndex[targetIndex].repostingCount)
                    }
                }
                rLink[rIndex].count++

                    var sourceCity = terr[sourceIndex]
                var targetCity = terr[targetIndex]
                var sourceKey = nodeCityIndex[sourceCity]
                var targetKey = nodeCityIndex[targetCity]
                var rCityIndex = sourceCity + "," + targetCity;
                if (!rCityLink[rCityIndex]) {
                    rCityLink[rCityIndex] = {
                        source: h.mesh.vxs[sourceCity],
                        target: h.mesh.vxs[targetCity],
                        count: 0,
                        index: rCityIndex,
                        sourceR: citySizeMapping(keywordAttributesMapping[sourceKey].filteredWeiboData.length),
                        targetR: citySizeMapping(keywordAttributesMapping[targetKey].filteredWeiboData.length)
                    }
                }
                rCityLink[rCityIndex].count++

                    trajectoryTerrIndex[sourceCity] = true
                trajectoryTerrIndex[targetCity] = true

            }
        }

        // for(var i in userIndex){
        //  var sequence = userIndex[i].sequence;
        //     trajectoryTerrIndex[terr[sequence[0].index]] = true
        //  for(var j=1;j<sequence.length;j++){
        //      var index = i+ ","+sequence[j-1].index+","+sequence[j].index
        //      if(!link[index]){
        //          if(!terrNodeIndex[sequence[j-1].index] || !terrNodeIndex[sequence[j].index]){
        //              console.log("error")
        //          }
        //          link[index] = {
        //              source:(h.mesh.vxs[sequence[j-1].index]),
        //              target:(h.mesh.vxs[sequence[j].index]),
        //              count:0,
        //              user:i,
        //              index:index,
        //              sourceR: townSizeMapping(terrNodeIndex[sequence[j-1].index].repostingCount),
        //              targetR: townSizeMapping(terrNodeIndex[sequence[j].index].repostingCount)                       
        //          }
        //      }
        //      link[index].count++;

        //      var sourceCity = terr[sequence[j-1].index]
        //      var targetCity = terr[sequence[j].index]
        //      var sourceKey = nodeCityIndex[sourceCity]
        //      var targetKey = nodeCityIndex[targetCity]
        //      var cityIndex = sourceCity+","+targetCity
        //      if(sourceCity==targetCity){
        //          continue;
        //      }
        //      if(!cityLink[cityIndex]){
        //          cityLink[cityIndex] = {
        //              source:h.mesh.vxs[sourceCity],
        //              target:h.mesh.vxs[targetCity],
        //              count:0,
        //              userIndex:{},
        //              index:cityIndex,
        //              sourceR:citySizeMapping(keywordAttributesMapping[sourceKey].filteredWeiboData.length),
        //              targetR:citySizeMapping(keywordAttributesMapping[targetKey].filteredWeiboData.length)
        //          }
        //      }
        //      cityLink[cityIndex].count++
        //      if(!cityLink[cityIndex].userIndex[i]){
        //          cityLink[cityIndex].userIndex[i] = {name:i,count:0}
        //      }
        //      cityLink[cityIndex].userIndex[i].count++

        //      trajectoryTerrIndex[terr[sequence[j].index]] = true
        //  }

        //  var repostings = userIndex[i].repostings
        //  for(var j=0;j<repostings.length;j++){
        //      var sourceIndex = repostings[j].source;
        //      var targetIndex = repostings[j].target;
        //      sourceIndex = nodeTerrIndex[sourceIndex].index
        //      targetIndex = nodeTerrIndex[targetIndex].index
        //      var source = h.mesh.vxs[sourceIndex]
        //      var target = h.mesh.vxs[targetIndex]
        //      var rIndex = source+","+target;
        //      if(!rLink[rIndex]){
        //          rLink[rIndex] = {
        //              source:source,
        //              target:target,
        //              count:0,
        //              index:rIndex,
        //              sourceR: townSizeMapping(terrNodeIndex[sourceIndex].repostingCount),
        //              targetR: townSizeMapping(terrNodeIndex[targetIndex].repostingCount)                                             
        //          }
        //      }
        //      rLink[rIndex].count++

        //      var sourceCity = terr[sourceIndex]
        //      var targetCity = terr[targetIndex]
        //      var sourceKey = nodeCityIndex[sourceCity]
        //      var targetKey = nodeCityIndex[targetCity]               
        //      var rCityIndex = sourceCity+","+targetCity;
        //      if(!rCityLink[rCityIndex]){
        //          rCityLink[rCityIndex] = {
        //              source:h.mesh.vxs[sourceCity],
        //              target:h.mesh.vxs[targetCity],
        //              count:0,
        //              index:rCityIndex,
        //              sourceR:citySizeMapping(keywordAttributesMapping[sourceKey].filteredWeiboData.length),
        //              targetR:citySizeMapping(keywordAttributesMapping[targetKey].filteredWeiboData.length)                       
        //          }
        //      }
        //      rCityLink[rCityIndex].count++

        //      trajectoryTerrIndex[sourceCity] = true
        //      trajectoryTerrIndex[targetCity] = true

        //  }
        // }

        this.trajectoryTerrIndex = trajectoryTerrIndex


        if (this.aggregationFlag) {
            link = cityLink
            rLink = rCityLink
        }

        // for(var i in link){
        for (var i in link) {
            trajectories.push(link[i])
        }

        var rTrajectories = []

        for (var i in rLink) {
            rTrajectories.push(rLink[i])
        }

        trajectories.sort(function(a, b) {
            return b.count - a.count
        })
        rTrajectories.sort(function(a, b) {
            return b.count - a.count;
        })


        var strokeMapping = d3.scaleLinear().domain(d3.extent(trajectories.map(function(d) {
            return d.count
        }))).range([1, 5])

        var strokeMapping1 = d3.scaleLinear().domain(d3.extent(rTrajectories.map(function(d) {
            return d.count
        }))).range([1, 5])

        if (this.trajectoryThreshold != 1) {
            trajectories = trajectories.slice(0, parseInt(trajectories.length * this.trajectoryThreshold))
        }
        if (this.repostingThreshold != 1) {
            rTrajectories = rTrajectories.slice(0, parseInt(rTrajectories.length * this.repostingThreshold))
        }


        physSVG.selectAll("defs").remove()
            // var linkMarker=physSVG.append("defs").selectAll("marker.pairMarker").remove();
        linkMarker = physSVG.append("defs").selectAll("marker.pairMarker")
            .data(["marker", "markerGrey"])
            .enter().append("svg:marker")
            .attr("id", String)
            .attr("class", "pairMarker")
            .attr("viewBox", "0 0 5 5")
            .attr("refX", 4.5)
            .attr("refY", 2.5)
            .attr("markerWidth", 4)
            .attr("markerHeight", 3)
            .attr("orient", "auto")
            .append("svg:path")
            .attr("d", "M0,0L6,2.5L0,5")
            .style("stroke", function(d) {
                return "none"
            })
            .style("fill", function(d) {
                if (d == "markerGrey") {
                    return "grey"
                }
                return "black"
                    // return colorSetting["linkStroke"]
                    // return fillColor(d[0]);
                    // ///a bit strange, but should work
                    // var a = d3.select(this);
                    // return fillColorLocal(d.substr(4,1));
            })
            .style("fill-opacity", 1.0);



        var trajSel = physSVG.selectAll('g.' + cls)
            .data(trajectories, function(d) {
                return d.index
            })

        var enter = trajSel.enter()
            .append("g")
            .attr("class", cls)

        enter.append("path").attr("class", cls)
            // enter.append("path").attr("class",cls+"R")
            // enter.append("text").attr("class",cls)

        enter.merge(trajSel)
            .select("path." + cls)
            .attr("d", function(d) {
                var src = [scale[0](d.source[0]), scale[1](d.source[1])];
                var target = [scale[0](d.target[0]), scale[1](d.target[1])];

                var str = calculateCurvePath(src, target, d.sourceR, d.targetR)

                // var p1 = src;
                // var p2 = target;
                // var dx = p2[0]-p1[0];
                // var dy = p2[1]-p1[1];
                // var dr = Math.sqrt(dx*dx+dy*dy);        
                // var newX0 = p1[0];
                // var newY0 = p1[1];
                // var newX1 = p2[0];
                // var newY1 = p2[1];
                // str = "M"+ newX0 + "," + newY0 + "A" + dr + "," + dr + " 0 0,0 " + newX1 + "," + newY1;

                return str;
            })
            .attr("marker-end", "url(#marker)")
            .style("fill", function(d) {
                return "none"
            })
            // .style('stroke-width', 2)
            .style("stroke-width", function(d) {
                // console.log("stroke",d.count)
                return strokeMapping(d.count)
            })
            .style('stroke-linecap', 'round')
            .style('stroke', 'black')
            // .raise();

        trajSel.exit().remove()


        var trajSel1 = physSVG.selectAll('g.' + cls + "R")
            .data(rTrajectories, function(d) {
                return d.index
            })

        var enter1 = trajSel1.enter()
            .append("g")
            .attr("class", cls)

        enter1.append("path").attr("class", cls + "R")

        enter1.merge(trajSel1)
            .select("path." + cls + "R")
            .attr("d", function(d) {
                var src = [scale[0](d.source[0]), scale[1](d.source[1])];
                var target = [scale[0](d.target[0]), scale[1](d.target[1])];

                var str = calculateStraightPath(src, target, d.sourceR, d.targetR)

                // var p1 = src;
                // var p2 = target;
                // var dx = p2[0]-p1[0];
                // var dy = p2[1]-p1[1];
                // var dr = Math.sqrt(dx*dx+dy*dy);        
                // var newX0 = p1[0];
                // var newY0 = p1[1];
                // var newX1 = p2[0];
                // var newY1 = p2[1];
                // str = "M"+ newX0 + "," + newY0 + "A" + dr + "," + dr + " 0 0,0 " + newX1 + "," + newY1;
                // str = "M"+ newX0 + "," + newY0 + "L" + newX1 + "," + newY1;

                return str;
            })
            .attr("marker-end", "url(#markerGrey)")
            .style("fill", function(d) {
                return "none"
            })
            // .style('stroke-width', 2)
            .style("stroke-width", function(d) {
                // console.log("stroke",d.count)
                return strokeMapping1(d.count)
            })
            .style('stroke-linecap', 'round')
            .style('stroke', 'grey')

        trajSel1.exit().remove()


        this.updateSelectedTerrNodes(this.gTerrNodes, this.selectedTrajectories)


        var physViewHeight = this.physViewHeight
        if (physViewHeight && physViewHeight == "city") {
            // visualizeVoronoi(physSVG,terr)
            updateVoronoi(this.gVoronoi, this.terrInfo.terr, this.cityInfo, this.terrInfo, trajectoryTerrIndex)
        }

    },
    filterTimeRange: function(timeRange) {

        this.timeRange = timeRange

        var terrInfo = this.terrInfo
        var nodeTerrIndex = terrInfo.allNodeTerrIndex

        var selectedNodeTerrIndex = {}
        var filteredData = []

        //filter the keywordAttributesMapping
        for (var i in keywordAttributesMapping) {
            var weiboData = keywordAttributesMapping[i].weiboData
            var filteredWeiboData = []
            for (var j = 0; j < weiboData.length; j++) {
                var dateTime = weiboData[j].dateTime
                if (dateTime >= timeRange[0] && dateTime <= timeRange[1]) {
                    filteredWeiboData.push(weiboData[j])
                }
            }
            keywordAttributesMapping[i].filteredWeiboData = filteredWeiboData
        }

        for (var i in nodeTerrIndex) {
            var data = nodeTerrIndex[i]
            var dateTime = data.data.dateTime
            if (dateTime >= timeRange[0] && dateTime <= timeRange[1]) {
                selectedNodeTerrIndex[i] = nodeTerrIndex[i]
                filteredData.push(data.data)
            }
        }

        terrInfo.nodeTerrIndex = selectedNodeTerrIndex

        var terrNodeIndex = terrInfo.allTerrNodeIndex
        var selectedTerrNodeIndex = {}

        for (var i in terrNodeIndex) {
            var weibo = terrNodeIndex[i].weiboData;
            var filteredWeibos = []
            for (var j = 0; j < weibo.length; j++) {
                var dateTime = weibo[j].dateTime;
                if (dateTime >= timeRange[0] && dateTime <= timeRange[1]) {
                    filteredWeibos.push(weibo[j])
                }
            }
            if (filteredWeibos.length) {
                selectedTerrNodeIndex[i] = {
                    city: terrNodeIndex[i],
                    key: terrNodeIndex[i].key,
                    weiboData: [],
                    st: terrNodeIndex[i].st,
                    ed: terrNodeIndex[i].ed
                }
                selectedTerrNodeIndex[i].weiboData = filteredWeibos
            }
        }

        terrInfo.terrNodeIndex = selectedTerrNodeIndex


        this.updateTerrNodes(this.gTerrNodes, "town", this.primH, terrInfo)

        this.updateDynamicFeatures()
            //a bit strange

        notifyDataSelection(filteredData, this.selectedNameIndex)

    },
    updateTrajectoriesByKeyPlayers: function(nameIndex, allFlag) {
        // var selectedTrajectories = {"一个有点理想的记者":peopleTrajectories["一个有点理想的记者"]}
        var selectedTrajectories = {}
        var selectedNameIndex = {}
        var peopleTrajectories = this.peopleTrajectories
        for (var i in nameIndex) {
            // selectedTrajectories[i] =peopleTrajectories[i]
            selectedNameIndex[i] = i
        }

        this.selectedNameIndex = selectedNameIndex

        var timeRange = this.timeRange

        var keyPlayerData = []


        // this.selectedTrajectories = selectedTrajectories
        for (var i in nameIndex) {
            var data = []
            var sequence = []
            var filteredRepostings = []
            if (timeRange) {
                var dData = peopleTrajectories[i].data;
                var dSequence = peopleTrajectories[i].sequence
                for (var j = 0; j < dData.length; j++) {
                    if (dData[j].dateTime >= timeRange[0] && dData[j].dateTime <= timeRange[1]) {
                        data.push(dData[j])
                        keyPlayerData.push(dData[j])
                        sequence.push(dSequence[j])
                    }
                }
                var repostings = peopleTrajectories[i].repostings;
                for (var j = 0; j < repostings.length; j++) {
                    var sourceData = repostings[j].sourceData
                    var targetData = repostings[j].targetData
                    if (sourceData.dateTime >= timeRange[0] && sourceData.dateTime <= timeRange[1] && targetData.dateTime >= timeRange[0] && targetData.dateTime <= timeRange[1]) {
                        filteredRepostings.push(repostings[j])
                    }
                }
                selectedTrajectories[i] = {
                    name: i,
                    data: data,
                    sequence: sequence,
                    repostings: filteredRepostings
                }
            } else {
                selectedTrajectories[i] = peopleTrajectories[i]
                var dData = peopleTrajectories[i].data;
                for (var j = 0; j < dData.length; j++) {
                    keyPlayerData.push(dData[j])
                }
            }
        }

        this.selectedTrajectories = selectedTrajectories //now not used yet 

        var gTrajectories = this.gTrajectories
        var primH = this.primH
        var terrInfo = this.terrInfo

        this.allFlag = allFlag
        this.updateTrajectories(gTrajectories, "trajectories", primH, selectedTrajectories, terrInfo)

        notifyGlyphByKeyPlayer(keyPlayerData)
    }



}



function makeD3Path(path, scale) {
    if (!scale) {
        scale = globalScale
    }
    var p = d3.path();
    p.moveTo(globalScale[0](path[0][0]), globalScale[1](path[0][1]));
    for (var i = 1; i < path.length; i++) {
        p.lineTo(globalScale[0](path[i][0]), globalScale[1](path[i][1]));
    }
    return p.toString();
}

function updateVoronoi(svg, field, cityInfo, terrInfo, selectedTerrIndex, lo, hi) {
    if (hi == undefined) hi = d3.max(field) + 1e-9;
    if (lo == undefined) lo = d3.min(field) - 1e-9;

    var _this = mapView

    var nodeCityIndex = cityInfo.nodeCityIndex

    var terrNodeIndex = terrInfo.terrNodeIndex
    var allTerrNodeIndex = terrInfo.allTerrNodeIndex

    var sFlag = d3.entries(selectedTerrIndex).length

    var vData = []
    for (var i = 0; i < field.mesh.tris.length; i++) {
        var city = field[i]
        var key = nodeCityIndex[city]
        if (city == -1 || !key) {
            continue;
        }
        vData.push({ tris: field.mesh.tris[i], arrayIndex: i, city: city, key: key })
    }


    var tris = svg.selectAll('path.field')
        .data(vData, function(d) {
            return d.arrayIndex
        })
    var enter = tris.enter()
        .append('path')
        .classed('field', true)
        .style("fill-opacity", 0);

    tris.exit()
        .transition()
        .duration(2000)
        .style("fill-opacity", 0)
        .remove();

    var delayTimeMapping = d3.scaleLinear()
        .domain([0, 1])
        .range([200, 2000])
        .clamp(true)

    // svg.selectAll('path.field')
    enter.merge(tris)
        .attr('d', function(d) {
            return makeD3Path(d.tris)
        })
        // .on("click",function(d){
        //  if(_this.physViewTown){
        //      return;
        //  }
        //  _this.clickRegion(d.city,d.key)
        // })
        .transition()
        .delay(function(d) {
            // var city = field[i]
            // var key = nodeCityIndex[city]
            // if(city==-1 || !key){
            //  return 0
            // }
            return delayTimeMapping(keywordAttributesMapping[d.key].timeSequence)
        })
        .duration(500)
        .style('fill', function(d) {

            var city = d.city
            var key = d.key
            if (city == -1 || !key) {
                console.log("shouldn't")
                return "white"
                    // return d3.interpolateViridis(0)
            }
            var color = keywordAttributesMapping[key].color
            return color
                // var keywords = field.mesh.vxs[i][2]
                // var color = keywordAttributesMapping[keywords].color
                // return color
                // return d3.interpolateViridis(mappedvals[i]);
        })
        .style("fill-opacity", function(d) {
            if (!sFlag) {
                return 0.1
            }
            var city = d.city
            if (selectedTerrIndex[city]) {
                return 0.1
            } else {
                return 0
            }

        })
        .style("pointer-events", "none")


}
// function updateVoronoi(svg, field, cityInfo, terrInfo, selectedTerrIndex, lo, hi) {
//     if (hi == undefined) hi = d3.max(field) + 1e-9;
//     if (lo == undefined) lo = d3.min(field) - 1e-9;

//     var nodeCityIndex = cityInfo.nodeCityIndex

//     var terrNodeIndex = terrInfo.terrNodeIndex
//     var allTerrNodeIndex = terrInfo.allTerrNodeIndex

//     var sFlag = d3.entries(selectedTerrIndex).length

//     var mappedvals = field.map(function (x) {return x > hi ? 1 : x < lo ? 0 : (x - lo) / (hi - lo)});
//     var tris = svg.selectAll('path.field').data(field.mesh.tris)
//     var enter = tris.enter()
//         .append('path')
//         .classed('field', true)
//         .style("fill-opacity",0);

//     tris.exit()
//      .transition()
//      .duration(2000)
//      .style("fill-opacity",0)
//         .remove();

//  var delayTimeMapping = d3.scaleLinear()
//          .domain([0,1])
//          .range([200,5000])
//          .clamp(true)


//     // svg.selectAll('path.field')
//     enter.merge(tris)
//         .attr('d', makeD3Path)
//   //       .transition()
//      // .delay(function(d,i){
//      //  var city = field[i]
//      //  var key = nodeCityIndex[city]
//      //  if(city==-1 || !key){
//      //      return 0
//      //  }
//      //  return delayTimeMapping(keywordAttributesMapping[key].timeSequence)
//      // })
//   //       .duration(2000)        
//         .style('fill', function (d, i) {
//          var city = field[i]
//          var key = nodeCityIndex[city]
//          if(city==-1 || !key){
//              return "white"
//              // return d3.interpolateViridis(0)
//          }
//          var color = keywordAttributesMapping[key].color
//          return color

//          // var keywords = field.mesh.vxs[i][2]
//          // var color = keywordAttributesMapping[keywords].color
//          // return color
//             // return d3.interpolateViridis(mappedvals[i]);
//         })
//         .style("fill-opacity",function(d,i){
//          if(!sFlag){
//              return 0.1
//          }
//          var city = field[i]
//          if(selectedTerrIndex[city]){
//              return 0.1
//          }else{
//              return 0
//          }


//          return 0.1
//          var city = field[i]


//          var key = nodeCityIndex[city]
//          if(city==-1 || !key){
//              return 0
//              // return d3.interpolateViridis(0)
//          }



//          var weiboNum = keywordAttributesMapping[key].filteredWeiboData.length
//          var allWeiboNum = keywordAttributesMapping[key].weiboDataAll.length
//          var ratio = 1.0*weiboNum/allWeiboNum
//          if(ratio>=0 && ratio<=1){
//              // console.log("ratio",ratio)
//              return ratio;
//          }else{
//              // console.log("errr filling")
//              return 0
//          }
//         })
//         .style("pointer-events","none")
// }


function updateVoronoiTerr(svg, field, cityInfo, terrInfo, lo, hi) {
    if (hi == undefined) hi = d3.max(field) + 1e-9;
    if (lo == undefined) lo = d3.min(field) - 1e-9;

    var nodeCityIndex = cityInfo.nodeCityIndex
    var nodeTerrIndex = terrInfo.nodeTerrIndex
    var terrNodeIndex = terrInfo.terrNodeIndex

    // field = add(field, cone(field.mesh, -0.5));
    // var mappedvals = field.map(function (x) {return x > hi ? 1 : x < lo ? 0 : Math.log((x - lo) / (hi - lo)+1)});
    var mappedvals = field.map(function(x) {
        return x > hi ? 1 : x < lo ? 0 : (x - lo) / (hi - lo)
    });
    var tris = svg.selectAll('path.field').data(field.mesh.tris)
    tris.enter()
        .append('path')
        .classed('field', true);

    tris.exit()
        .remove();

    svg.selectAll('path.field')
        .attr('d', makeD3Path)
        .style('fill', function(d, i) {
            var city = field[i]
                // var key = nodeCityIndex[city]
            if (city == -1) {
                return "white"
                    // return d3.interpolateViridis(0)
            }
            // var color = keywordAttributesMapping[key].color
            // return color

            // var keywords = field.mesh.vxs[i][2]
            // var color = keywordAttributesMapping[keywords].color
            // return color
            return d3.interpolateViridis(mappedvals[i] * mappedvals[i]);
        });
}


// function visualizeText(svg,cls,h,cityInfo,terrInfo,scale){
//     if(!scale){
//         scale = globalScale
//     }

//     cities = cityInfo.cities;
//     terr = terrInfo.terr;

//     var terrData = []
//     var textIndex = {}
//     var textSize = d3.scaleLinear().range([0.7,1.3])
//     var textDomains = []

//    for(var i=0;i<cities.length;i++){
//         var city = cities[i]
//         var text = h.mesh.vxs[city][2] //hide in the h.mesh.vxs
//         var pos = h.mesh.vxs[city]
//         var shownText = null
//         for(var j=0;j<text.length;j++){
//             if(!textIndex[text[j][0]]){
//                 textIndex[text[j][0]] = true
//                 shownText = text[j]
//                 textDomains.push(text[j][1])
//                 break;
//             }
//         }
//         terrData.push({type:"city",id:i,city:city,pos:pos,text:text,shownText:shownText})
//     }


//     // for(var i=0;i<cities.length;i++){
//     //     var city = cities[i];
//     //     var lc = terrCenter(h,terr,city,true)

//     //     var text = h.mesh.vxs[city][2]
//     //     var shownText = null
//     //     for(var j=0;j<text.length;j++){
//     //         if(!textIndex[text[j][0]]){
//     //             textIndex[text[j][0]] = true
//     //             shownText = text[j]
//     //             textDomains.push(text[j][1])
//     //             break;
//     //         }
//     //     }

//     //     terrData.push({type:"terr",id:i,city:city,pos:lc,text:text,shownText:shownText})
//     // }
//     textSize.domain(d3.extent(textDomains))
//     if(textDomains.length<1){
//         textSize.domain([1,1])
//     }



//     var cityNode = svg.selectAll('g.'+ cls)
//         .data(terrData,function(d){
//             return d.id+d.type;
//         })

//     var enter = cityNode.enter()
//         .append("g")
//         .attr("class",cls)

//     enter.append("text").attr("class",cls)

//     enter.merge(cityNode)
//         .selectAll("text."+cls)
//         .attr('x', function (d) {
//             return scale[0](d.pos[0]) + (d.type=="city"?7:0)
//         })
//         .attr('y', function (d) {
//             return scale[1](d.pos[1])
//         })
//         .style("font-size",function(d){
//             if(d.shownText){
//                 return keywordAttributesMapping[d.shownText[0]].size*1.5+"px"
//                 // return textSize(d.shownText[1])+"em"
//             }
//             return
//         })
//         .text(function(d){
//             // var words = d.text;
//             // if(words && words[0]){
//             //     return words[0][0]
//             // }
//             var words = d.shownText;
//             if(words){
//                 return words[0];
//             }
//         })


//     cityNode.exit().remove()

//     // svg.selectAll("circle."+cls)


// }

function calculateTrajectories(terrInfo) {

    var terr = terrInfo.terr;
    var terrNodeIndex = terrInfo.terrNodeIndex
    var nodeTerrIndex = terrInfo.nodeTerrIndex

    var trajectories = []
    var weiboNodes = d3.entries(nodeTerrIndex)

    var userIndex = {}
    var repostingCount = 0

    var repostingThreshold = Math.sqrt(weiboNodes.length) / 2.0

    for (var i = 0; i < weiboNodes.length; i++) {
        var node = weiboNodes[i].value.data;
        var name = node.data.name;
        if (!userIndex[name]) {
            userIndex[name] = { name: name, sequence: [], data: [], repostings: [] }
        }
        userIndex[name].data.push(node)
        var mid = node.data.mid;
        var terrIndex = nodeTerrIndex[mid]
        userIndex[name].sequence.push(terrIndex);

        var parent = node.parent
        if (parent && nodeTerrIndex[parent.data.mid] &&
            (parent.children.length > repostingThreshold || (node.children && node.children.length > repostingThreshold))) {
            userIndex[name].repostings.push({
                source: parent.data.mid,
                target: mid,
                sourceData: parent,
                targetData: node
            })
            repostingCount++
        }
        var children = node.children
        if (!children) {
            continue;
        }
        for (var j = 0; j < children.length; j++) {
            var cMid = children[j].data.mid;
            if (nodeTerrIndex[cMid] && children[j].children && children[j].children.length > repostingThreshold) {
                userIndex[name].repostings.push({
                    source: mid,
                    target: cMid,
                    sourceData: children[j],
                    targetData: node
                })
                repostingCount++
            }
        }
    }

    console.log("reposting count", repostingCount)
    console.log("people trajectories", userIndex)

    return userIndex

}



function createTerrNodesMapping(keywordsMapping, mesh, nodeMeshIndex, terr) {

    var terrNodeIndex = {}
    var nodeTerrIndex = {}

    var terrIndex = {}
    for (var i = 0; i < terr.length; i++) {
        if (terr[i] == -1) {
            continue;
        }
        if (!terrIndex[terr[i]]) {
            terrIndex[terr[i]] = []
        }
        terrIndex[terr[i]].push(i)
    }

    function calDistance(p0, p1) {
        var dis = ((p0[0] - p1[0]) * (p0[0] - p1[0]) + (p0[1] - p1[1]) * (p0[1] - p1[1]))
            // dis = Math.sqrt(dis);
        return dis
    }

    var allWeiboNodes = []
    for (var i in keywordsMapping) {
        // var weiboData = keywordsMapping[i].weiboData;
        var weiboData = keywordsMapping[i].filteredWeiboData;

        for (var j = 0; j < weiboData.length; j++) {
            allWeiboNodes.push(weiboData[j])
        }
    }
    var timeRange = d3.extent(allWeiboNodes.map(function(d) {
        return d.data.t;
    }))

    var timeMapping = d3.scaleLinear().domain(timeRange)
        .range([0, 1])

    var terrDepth = zero(mesh)
    var terrTime = zero(mesh)

    for (var i in keywordsMapping) {
        var key = i
        var city = nodeMeshIndex[key]
        if (city == -1) {
            console.log("no cities")
            continue;
        }
        // var weiboData = keywordsMapping[i].weiboData;
        var weiboData = keywordsMapping[i].filteredWeiboData;
        var belongTerr = terrIndex[city]

        var posMapping = d3.scaleLinear().domain(d3.extent(weiboData.map(function(d) {
            return d.data.t
        }))).range([0, belongTerr.length])

        var cityPos = mesh.vxs[city]

        belongTerr.sort(function(a, b) {
            var disA = calDistance(cityPos, mesh.vxs[a])
            var disB = calDistance(cityPos, mesh.vxs[b])
            return disA - disB;
        })

        var maxDepth = 0

        var queue = new Queue()
        queue.enqueue({ index: city, depth: 0 })
        var visited = {}
        var depthIndex = {}
        while (!queue.isEmpty()) {
            var item = queue.dequeue()
            var itemIndex = item.index;
            terrDepth[itemIndex] = item.depth

            if (!depthIndex[item.depth]) {
                depthIndex[item.depth] = { depth: item.depth, aveTime: -1, data: [] }
            }
            // depthIndex[item.depth].data.push(itemIndex)

            var currentDepth = item.depth + 1
            if (currentDepth > maxDepth) {
                maxDepth = currentDepth
            }
            var neibors = neighbours(mesh, itemIndex)
            for (var j = 0; j < neibors.length; j++) {
                var pp = neibors[j]
                if (visited[pp] && terrDepth[pp]) {
                    if (terrDepth[pp] > currentDepth) {
                        terrDepth[pp] = currentDepth
                        continue;
                    }
                    continue;
                } else if (terr[pp] != city) {
                    continue;
                }
                visited[neibors[j]] = true;
                queue.enqueue({ index: neibors[j], depth: currentDepth })
            }
        }

        var localTimeMapping = d3.scaleLinear().domain(d3.extent(weiboData.map(function(d) {
            return d.data.t
        })))


        for (var j = 0; j < belongTerr.length; j++) {
            var depth = terrDepth[belongTerr[j]]
        }


        for (var j = 0; j < weiboData.length; j++) {
            var posIndex = parseInt(posMapping(weiboData[j].data.t))
            if (posIndex == belongTerr.length) {
                posIndex = belongTerr.length - 1
            }
            var index = belongTerr[posIndex]
            if (!terrNodeIndex[index]) {
                terrNodeIndex[index] = {
                    city: city,
                    key: key,
                    weiboData: [],
                    st: posMapping.invert(posIndex),
                    ed: posMapping.invert(posIndex + 1)
                }
            }
            terrNodeIndex[index].weiboData.push(weiboData[j])
            nodeTerrIndex[weiboData[j].data.mid] = { index: index, data: weiboData[j] }

            var depth = terrDepth[belongTerr[posIndex]]
            depthIndex[depth].data.push(weiboData[j])

        } ////nodeTerrIndex is the index of the weibo data


        for (var j in depthIndex) {
            var dData = depthIndex[j].data;
            mean = d3.mean(dData, function(d) {
                return +d.data.t
            })
            depthIndex[j].aveTime = timeMapping(mean)
        }

        for (var j = 0; j < belongTerr.length; j++) {
            var depth = terrDepth[belongTerr[j]]
            terrTime[belongTerr[j]] = depthIndex[depth].aveTime
        }

    }

    for (var i in terrNodeIndex) {
        var count = 0;
        var weiboData = terrNodeIndex[i].weiboData
        for (var j = 0; j < weiboData.length; j++) {
            count += weiboData[j].data.children.length
        }
        terrNodeIndex[i].repostingCount = count;
    }

    var terrRatio = zero(mesh)
    for (var i = 0; i < terr.length; i++) {
        var val = 0
        if (terr[i] == -1) {
            val = -1
        }
        if (terrNodeIndex[i] && terrNodeIndex[i].weiboData) {
            val = terrNodeIndex[i].weiboData.length
        }
        terrRatio[i] = val
    }


    console.log("terr Node Index", terrNodeIndex, d3.entries(terrNodeIndex))

    var returnData = {
        "allNodeTerrIndex": nodeTerrIndex,
        "terrRatio": terrRatio,
        "nodeTerrIndex": nodeTerrIndex,
        "terrNodeIndex": terrNodeIndex,
        "allTerrNodeIndex": terrNodeIndex,
        "terrTime": terrTime,
        "terrDepth": terrDepth
    }

    return returnData
}

// function createTerrNodesMapping(keywordsMapping,mesh,nodeMeshIndex,terr){

//  var terrNodeIndex = {}
//  var nodeTerrIndex = {}

//  var terrIndex = {}
//  for(var i=0;i<terr.length;i++){
//      if(terr[i]==-1){
//          continue;
//      }
//      if(!terrIndex[terr[i]]){
//          terrIndex[terr[i]] = []
//      }
//      terrIndex[terr[i]].push(i)
//  }

//     function calDistance(p0,p1){
//         var dis = ((p0[0]-p1[0])*(p0[0]-p1[0]) + (p0[1]-p1[1])*(p0[1]-p1[1])) 
//         // dis = Math.sqrt(dis);
//         return dis
//     }    

//  for(var i in keywordsMapping){
//      var key = i
//      var city = nodeMeshIndex[key]
//      if(city==-1){
//          console.log("no cities")
//          continue;
//      }
//      var weiboData = keywordsMapping[i].weiboData;
//      var belongTerr = terrIndex[city]

//      var posMapping = d3.scaleLinear().domain(d3.extent(weiboData.map(function(d){
//          return d.data.t
//      }))).range([0,belongTerr.length])

//      var cityPos = mesh.vxs[city]

//      belongTerr.sort(function(a,b){
//          var disA = calDistance(cityPos,mesh.vxs[a])
//          var disB = calDistance(cityPos,mesh.vxs[b])
//          return disA - disB;
//      })


//      for(var j=0;j<weiboData.length;j++){
//          var posIndex = parseInt(posMapping(weiboData[j].data.t))
//          if(posIndex==belongTerr.length){
//              posIndex = belongTerr.length - 1
//          }
//          var index = belongTerr[posIndex]
//          if(!terrNodeIndex[index]){
//              terrNodeIndex[index] = {city:city,key:key,weiboData:[],
//                  st:posMapping.invert(posIndex),
//                  ed:posMapping.invert(posIndex+1)}
//          }
//          terrNodeIndex[index].weiboData.push(weiboData[j])
//          nodeTerrIndex[weiboData[j].data.mid] = {index:index,data:weiboData[j]}
//      }////nodeTerrIndex is the index of the weibo data
//  }

//  var terrRatio = zero(mesh)
//  for(var i=0;i<terr.length;i++){
//      var val = 0
//      if(terr[i]==-1){
//          val = -1
//      }
//      if(terrNodeIndex[i] && terrNodeIndex[i].weiboData){
//          val = terrNodeIndex[i].weiboData.length
//      }
//      terrRatio[i] = val
//  }


//  console.log("terr Node Index",terrNodeIndex,d3.entries(terrNodeIndex))

//  return {allNodeTerrIndex:nodeTerrIndex,terrRatio:terrRatio,nodeTerrIndex:nodeTerrIndex,terrNodeIndex:terrNodeIndex,allTerrNodeIndex:terrNodeIndex}
// }

function createIndex(gaussianNodes, mesh) {

    var n = gaussianNodes.length;

    var nodeMeshIndex = {}

    for (var j = 0; j < n; j++) {
        var m = gaussianNodes[j];
        var minIndex = -1;
        var distanceMin = Number.MAX_VALUE

        for (var i = 0; i < mesh.vxs.length; i++) {
            var p = mesh.vxs[i];

            var dis = (p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])
            if (dis < distanceMin) {
                distanceMin = dis;
                minIndex = i;
            }
            // newvals[i] += Math.pow(Math.exp(-((p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])) / (2 * r * r)), 2);
        }
        nodeMeshIndex[m[3]] = minIndex //m[3] node id
    }
    return nodeMeshIndex
}


function cityBySetting(h, cityNodes, nodeMeshIndex) {
    var cities = []
    var cityNodeIndex = {}
    var nodeCityIndex = {}
    for (var i = 0; i < cityNodes.length; i++) {
        var key = cityNodes[i].key;
        cities.push(nodeMeshIndex[key])
        cityNodeIndex[key] = nodeMeshIndex[key]
        nodeCityIndex[nodeMeshIndex[key]] = key
    }
    return { cities: cities, cityNodeIndex: cityNodeIndex, nodeCityIndex: nodeCityIndex };
}

function getMatchingNodes(node, mesh) {
    var minIndex = -1;
    var distanceMin = Number.MAX_VALUE
    var m = node

    for (var i = 0; i < mesh.vxs.length; i++) {
        var p = mesh.vxs[i];

        var dis = (p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])
        if (dis < distanceMin) {
            distanceMin = dis;
            minIndex = i;
        }
        // newvals[i] += Math.pow(Math.exp(-((p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])) / (2 * r * r)), 2);
    }
    return mesh.vxs[minIndex]

}

function getRiverSequence(nodeMeshIndex, links, mesh, terr, cities) {
    var paths = []
    var sequences = []
    for (var i = 0; i < links.length; i++) {
        var sequence = []
        var lastTerr = -1
        var path = []
        var nodesAlongPath = links[i].nodesAlongPath;
        for (var j = 0; j < nodesAlongPath.length; j++) {
            var cNodeSrc = links[i].nodesAlongPath[j];
            // var cNodeTarget = links[i].nodesAlongPath[j+1]
            var srcIndex = nodeMeshIndex[cNodeSrc.id]
                // var targetIndex = nodeMeshIndex[cNodeTarget.id]
            if (srcIndex != -1) {
                path.push(mesh.vxs[srcIndex])
            }
            var seq = terr[srcIndex]
            if (seq != -1 && lastTerr != seq) {
                sequence.push([seq, srcIndex]);
                lastTerr = seq;
            }
        }
        links[i].sequence = sequence;
        paths.push(path)
        console.log('seq', links[i].sequence)
        if(!sequence.length){
            console.log("why no sequence",link)
            continue;
        }
        sequences.push(sequence)
    }

    sequences.sort(function(a, b) {
        var k = 0;
        while (k < a.length && k < b.length && a[k][0] == b[k][0]) {
            k++
        }
        if (k >= a.length && k < b.length) {
            return -1
        } else if (k < a.length && k >= b.length) {
            return 1
        } else if (k < a.length && k < b.length) {
            return a[k][0] - b[k][0]
        } else {
            return 0
        }
    })
    console.log('sequencess', sequences)

    var roots = {}
    for (var i = 0; i < sequences.length; i++) {
        var item = sequences[i][0]
        if (!roots[item[0]]) {
            roots[item[0]] = { root: item[0], nodes: [], children: {}, id: item[0], posIndexs: [item[1]] }
        }
        roots[item[0]].nodes.push(sequences[i])
    }


    function constructTree(root, nodes, i) {
        if (!root.children[nodes[i][0]]) {
            root.children[nodes[i][0]] = { children: {}, id: nodes[i][0], posIndexs: [], nodes: [] }
        }
        root.children[nodes[i][0]].posIndexs.push(nodes[i][1])
        root.children[nodes[i][0]].nodes.push(nodes)

        if (i < nodes.length - 1) {
            constructTree(root.children[nodes[i][0]], nodes, i + 1)
        }
    }

    for (var i in roots) {
        var nodes = roots[i].nodes;
        for (var j = 0; j < nodes.length; j++) {
            if (nodes[j].length <= 1) {
                continue;
            }
            constructTree(roots[i], nodes[j], 1)
        }
    }
    console.log("roots", roots)

    function visitTree(root, callback, callbackLeaf, params) {
        if (root) {
            callback(root, params)
        } else {
            return;
        }
        var count = 0;
        for (var i in root.children) {
            visitTree(root.children[i], callback, callbackLeaf, root.path)
            count++
        }
        if (!count && callbackLeaf) {
            callbackLeaf(root)
        }
    }

    function mergeChildren(root) {
        var poses = [0, 0]
        var count = 0;
        for (var i = 0; i < root.posIndexs.length; i++) {
            var index = root.posIndexs[i];
            var pos = mesh.vxs[index]
            poses[0] += pos[0];
            poses[1] += pos[1];
            count++
        }
        if (count) {
            poses[0] /= count;
            poses[1] /= count;
        }
        root.pos = poses;
    }

    var mergedPaths = []
        // function getPaths(root,paths){
        //     var children = root.children
        //     var pos = root.pos
        //     var newPath = [].concat(paths)
        //     newPath.push(pos)
        //     root.paths = newPath;
        //     return paths
        // }

    function loadPaths(root) {
        mergedPaths.push(root.paths)
    }

    function getPaths(root, paths) {
        if (root) {
            var pos = root.pos
            paths.push(pos)
            root.paths = [].concat(paths)
        } else {
            return;
        }
        var count = 0;
        for (var i in root.children) {
            getPaths(root.children[i], paths)
            count++
        }
        if (!count) {
            loadPaths(root)
        }
        paths.pop()

    }

    function getSepPaths(root) {
        var source = root.pos
        for (var i in root.children) {
            var target = root.children[i].pos
            mergedPaths.push([source, target])
        }
    }

    var count1 = 0
    for (var i in roots) {
        visitTree(roots[i], mergeChildren)
        visitTree(roots[i], getSepPaths)
            // getPaths(roots[i],[])
            // if(count1>2){
            //     break;
            // }
            // count1++
    }
    console.log("merged Paths", mergedPaths)

    var riverPaths = riverlize(mergedPaths, mesh, nodeMeshIndex)
    return riverPaths;
    // return mergedPaths;    
}

function riverlize(riverPaths, mesh, nodeMeshIndex) {

    var tempSVG = d3.select("body").append("svg").attr("id", "tempSvg")

    var newPaths = []
    for (var i = 0; i < riverPaths.length; i++) {
        var sourcePoint = riverPaths[i][0]
        var targetPoint = riverPaths[i][1]
        var path = tempSVG.append("path")
            .attr("d", function(d) {
                return "M" + sourcePoint +
                    "C" + [sourcePoint[0], (sourcePoint[1] + targetPoint[1]) / 2.0] + " " + [targetPoint[0], (sourcePoint[1] + targetPoint[1]) / 2.0] + " " + targetPoint
                    // return "M"+source.data.loc+"L"+target.data.loc;
            })

        var nodesAlongPath = [];
        path = path.node()
        var l = path.getTotalLength()
        var sNum = 20;


        var newPath = []
        for (var j = 0; j <= sNum; j++) {
            var p = path.getPointAtLength(1.0 * j / sNum * l)

            var meshPoint = getMatchingNodes([p.x, p.y], mesh)
                // var meshPoint = mesh.vxs[mIndex]
            newPath.push(meshPoint)
        }

        newPaths.push(newPath)

    }
    d3.select("#tempSvg").remove();

    return newPaths
}


function getRiverByLinks(nodeMeshIndex, links, mesh) {

    var paths = []
    for (var i = 0; i < links.length; i++) {
        var path = []
        var nodesAlongPath = links[i].nodesAlongPath;
        for (var j = 0; j < nodesAlongPath.length; j++) {
            var cNodeSrc = links[i].nodesAlongPath[j];
            // var cNodeTarget = links[i].nodesAlongPath[j+1]
            var srcIndex = nodeMeshIndex[cNodeSrc.id]
                // var targetIndex = nodeMeshIndex[cNodeTarget.id]
            if (srcIndex != -1) {
                path.push(mesh.vxs[srcIndex])
            }
        }
        paths.push(path)
    }
    return paths;
}

// function createTimeCountour(nodes,mesh,nodeMeshIndex){

// }

function matchNodestoTerrainSplatting(oriNodes, mesh, nodeMeshIndex) {
    var n = oriNodes.length;

    var valScale = d3.scaleLinear().domain(d3.extent(oriNodes.map(function(d) {
        return d[2]
    }))).range([3, 1])
    var r = 0.05;
    var newvals = zero(mesh)

    var valScale1 = d3.scaleLinear().domain(d3.extent(oriNodes.map(function(d) {
        return d[2]
    }))).range([3, 1])

    var wordCount = 0

    for (var i = 0; i < n; i++) {
        var m = oriNodes[i];
        var setDistance = m[4] * valScale1(m[2])
        var index = nodeMeshIndex[m[3]]

        var words = m[5];
        // var p = mesh.vxs[index]

        // newvals[index]+=Math.pow(Math.exp(-((p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])) / (2 * r * r)), 2)*valScale(m[2]);       
        // var neibors = neighbours(mesh,index)
        // for(var k=0;k<neibors.length;k++){
        //     // if(!newvals[neibors[k]]){

        //     // }
        //     var p = mesh.vxs[neibors[k]]
        //     newvals[neibors[k]] += Math.pow(Math.exp(-((p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])) / (2 * r * r)), 2)*valScale(m[2]);  
        //     var neiborNeibors = neighbours(mesh,neibors[k])
        //     for(var q=0;q<neiborNeibors.length;q++){
        //         var p = mesh.vxs[neiborNeibors[q]]
        //         newvals[neiborNeibors[q]] += Math.pow(Math.exp(-((p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])) / (2 * r * r)), 2)*valScale(m[2]);  
        //     }
        //     // newvals[neibors[k]] += Math.pow(Math.exp(-((p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])) / (2 * r * r)), 2)*valScale(m[2]);  
        // }

        var disScale = d3.scaleLinear().domain([0, setDistance]).range([15, 1])

        var queue = new Queue()
        queue.enqueue([index, 0])

        //only put the keywords in the cities nodes
        // var p = mesh.vxs[index]
        // p[2] = words;
        ////don't do it here


        var visited = {}
        while (!queue.isEmpty()) {
            var item = queue.dequeue();
            var itemIndex = item[0]
            var itemDis = item[1]
            var p = mesh.vxs[itemIndex]
                // newvals[item]+=Math.pow(Math.exp(-((p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])) / (2 * r * r)), 2)*valScale(m[2]);
            newvals[itemIndex] += Math.pow(Math.exp(-((p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])) / (2 * r * r)), 2) * valScale(m[2]) * disScale(itemDis);

            // if(!p[2]){
            //     p[2] = words
            //     wordCount++
            // }



            var neibors = neighbours(mesh, itemIndex)
            for (var j = 0; j < neibors.length; j++) {
                var p = mesh.vxs[neibors[j]]
                var dis = (p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])
                if (visited[neibors[j]] || Math.sqrt(dis) > setDistance) {
                    continue;
                }
                // if(!p[2]){
                //     p[2] = words;
                //     wordCount++
                // }
                visited[neibors[j]] = true;
                queue.enqueue([neibors[j], dis])
            }
            // console.log(d3.entries(visited).length)
        }
    }
    return newvals;
}


function visitTree(node, callback, callback1) {
    // create a new queue
    var queue = new Queue();

    // enqueue an item
    queue.enqueue(node);


    while (!queue.isEmpty()) {
        // dequeue an item
        var item = queue.dequeue();
        callback(item);
        for (var i = 0; i < item.children.length; i++) {
            queue.enqueue(item.children[i]);
        }
        callback1(item);
    }
}


function calculateCurvePath(p1, p2, r1, r2) {

    var srcR = r1
    var destR = r2

    var dx = p2[0] - p1[0];
    var dy = p2[1] - p1[1];

    var theta = Math.atan(dy / dx);
    var theta1 = theta + Math.PI / 6.0;
    var theta2 = theta - Math.PI / 6.0;
    var directionX = dx >= 0 ? 1 : -1;
    var directionY = dy > 0 ? 1 : -1;

    if (dx < 0) {
        theta += Math.PI;
        if (dy < 0) {
            //  directionY*=-1;                     
        }
    }
    if ((dx <= 0 && dy > 0) || (dx >= 0 && dy < 0)) {
        directionY *= -1;
    }
    // var newX0 = p1[0] + directionX*srcR*Math.abs(Math.cos(theta1));
    // var newY0 = p1[1] + directionY*srcR*Math.abs(Math.sin(theta1));

    // var newX1 = p2[0] - directionX*destR*Math.abs(Math.cos(theta2));
    // var newY1 = p2[1] - directionY*destR*Math.abs(Math.sin(theta2));
    var newX0 = p1[0] + directionX * srcR * (Math.cos(theta1));
    var newY0 = p1[1] + directionY * srcR * (Math.sin(theta1));

    var newX1 = p2[0] - directionX * destR * (Math.cos(theta2));
    var newY1 = p2[1] - directionY * destR * (Math.sin(theta2));


    var parameterD = 1;
    var dr = Math.sqrt(dx * dx + dy * dy) * parameterD;

    var str = "M" + newX0 + "," + newY0 + "A" + dr + "," + dr + " 0 0,0 " + newX1 + "," + newY1;

    return str

}


function calculateStraightPath(p1, p2, r1, r2) {

    var srcR = r1
    var destR = r2

    var dx = p2[0] - p1[0];
    var dy = p2[1] - p1[1];

    var theta = Math.atan(dy / dx);
    var theta1 = theta + Math.PI / 6.0;
    var theta2 = theta - Math.PI / 6.0;
    var directionX = dx >= 0 ? 1 : -1;
    var directionY = dy > 0 ? 1 : -1;

    // if(dx<0){
    //  theta+=Math.PI;
    //  if(dy<0){
    //  //  directionY*=-1;                     
    //  }
    // }
    if ((dx <= 0 && dy > 0) || (dx >= 0 && dy < 0)) {
        directionY *= -1;
    }
    // var newX0 = p1[0] + directionX*srcR*Math.abs(Math.cos(theta1));
    // var newY0 = p1[1] + directionY*srcR*Math.abs(Math.sin(theta1));

    // var newX1 = p2[0] - directionX*destR*Math.abs(Math.cos(theta2));
    // var newY1 = p2[1] - directionY*destR*Math.abs(Math.sin(theta2));
    var newX0 = p1[0] + directionX * srcR * (Math.cos(theta));
    var newY0 = p1[1] + directionY * srcR * (Math.sin(theta));

    var newX1 = p2[0] - directionX * destR * (Math.cos(theta));
    var newY1 = p2[1] - directionY * destR * (Math.sin(theta));


    var parameterD = 1;
    var dr = Math.sqrt(dx * dx + dy * dy) * parameterD;


    var straightStr = "M" + [newX0, newY0] + "L" + [newX1, newY1]
    return straightStr

}
