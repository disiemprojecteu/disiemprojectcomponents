function drawRealMap(graph,extent,svg){
    
    var nodes = graph.nodes;
    var links = graph.links;
    var points = [];
    // for(var i=0;i<nodes.length;i++){
    //  points.push([nodes[i].x,nodes[i].y])
    // }

    // nodes = [nodes[0],nodes[1]]

    points = generatePoints(4096)

    globalExtent = extent

    globalScale = []
    globalScale[0] = d3.scaleLinear().domain([-0.5,0.5])
        .range([-extent.width/2.0,extent.width/2.0])
    globalScale[1] = d3.scaleLinear().domain([-0.5,0.5])
        .range([-extent.height/2.0,extent.height/2.0])

    console.log("Init Draw:",points,extent)


    // points = improvePoints(points,10,extent);

    var mesh = makeMesh(points)

     primH = zero(mesh);

    // var z = []
    // for(var i=0;i<mesh.vxs.length;i++){
    //     z[i] = nodes[i].data.totalChildren/100;
    // }
    // z.mesh = mesh;
    // mesh = z;

    var xScale = d3.scaleLinear().domain(d3.extent(nodes.map(function(d){
        return d.data.loc[0]
    }))).range([-0.5,0.5])
    // xScale.domain([(xScale.domain()[1]+xScale.domain()[0])/2,xScale.domain()[1]])
    var yScale = d3.scaleLinear().domain(d3.extent(nodes.map(function(d){
        return d.data.loc[1]
    }))).range([-0.5,0.5])
    // yScale.domain([(yScale.domain()[1]+yScale.domain()[0])/2,yScale.domain()[1]])
    var valScale = d3.scaleLinear().domain(d3.extent(nodes.map(function(d){
        return d.totalChildren+1
    }))).range([0,1])
    var gaussianNodes = []
    var threshold = 0

    for(var i=0;i<nodes.length;i++){
        if(nodes[i].data.totalChildren<threshold){
            continue;
        }
        gaussianNodes.push([xScale(nodes[i].data.loc[0]),yScale(nodes[i].data.loc[1]),
            nodes[i].depth,nodes[i].id])
        // gaussianNodes.push({x:xScale(nodes[i].data.loc[0]),
            // y:yScale(nodes[i].data.loc[1]),val:nodes[i].data.totalChildren+1})

        // console.log("map graph",globalScale[0](gaussianNodes[i][0]),globalScale[1](gaussianNodes[i][1]))

    }

    function calDistance(p0,p1){
        var dis = ((p0[0]-p1[0])*(p0[0]-p1[0]) + (p0[1]-p1[1])*(p0[1]-p1[1])) 
        dis = Math.sqrt(dis);
        return dis
    }
    var oriNodes = []

    for(var i=0;i<links.length;i++){
        var source = links[i].source;
        var target = links[i].target;
        var sourcePoint = [xScale(source.data.loc[0]),yScale(source.data.loc[1])]
        var targetPoint = [xScale(target.data.loc[0]),yScale(target.data.loc[1])]
        
        var distance = calDistance(sourcePoint,targetPoint)
        source.r = distance;
        // target.r = distance;

        for(var j=0;j<links[i].nodesAlongPath.length;j++){
            var cNode = links[i].nodesAlongPath[j]
            cNode.projLoc = [xScale(cNode.data.loc[0]),yScale(cNode.data.loc[1])]
        }
        links[i].nodesAlongPath[0].r = distance
        var oNode = links[i].nodesAlongPath[0]
        oriNodes.push([xScale(oNode.data.loc[0]),yScale(oNode.data.loc[1]),
            oNode.depth,oNode.id,distance,links[i].source.words])        
    }
    // var oriNodes = graph.oriNodes;

    nodeMeshIndex = createIndex(gaussianNodes,mesh)
    // var newvals = matchNodestoTerrain1(gaussianNodes,mesh,nodeMeshIndex)
    // var newvals = matchNodestoTerrainBraod(gaussianNodes,mesh,nodeMeshIndex)
    var newvals = matchNodestoTerrainSplatting(oriNodes,mesh,nodeMeshIndex)

    // var newvals = matchNodestoTerrain(gaussianNodes,mesh)
    primH = add(primH,newvals)
    primH = add(primH, cone(primH.mesh, -0.5));
    // primH = setSeaLevel(primH, runif(0.2, 0.6));
    primH = fillSinks(primH);

    primH = doErosion(primH, runif(0, 0.1), 5);

    cities = cityScoreNew(primH)
    terr = getTerritories({h:primH,cities:cities,
        params:{nterrs:cities.length}})
    console.log("terr",terr)

    borders = getBorders({terr:terr,h:primH})

    // primH = peaky(primH)
    // primH = normalize(primH)

    // var newvals = zero(mesh)
    // var n = gaussianNodes.length;
    // for(var i=0;i<mesh.vxs.length;i++){
    //     var p = mesh.vxs[i];
    //     for(var j=0;j<n;j++){
    //         var m = gaussianNodes[j];
    //         newvals[i] += Math.pow(Math.exp(-((p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])) / (2 * r * r)), 2);
    //     }
    // }
    // primH = add(primH,newvals)


    // // console.log("Init Mesh:",mesh, primH)
 // //    primH = add(primH, slope(primH.mesh, randomVector(0.004)));

    // var r = extent.width/10

    // primH = add(primH, mountains(primH.mesh, 5,r));
 // //    // primH = add(primH, mountains(primH.mesh, 50,r));
 // //    // primH = add(primH, mountains(primH.mesh, 5));

 // //    primH = add(primH, cone(primH.mesh, -0.004));
 // //    // primH = add(primH, cone(primH.mesh, -0.004));
 // //    // // primH = add(primH, cone(primH.mesh, -0.8));



    erodeH = primH

 //    // erodeH = doErosion(primH, 1);
 //    // for(var i=0;i<5;i++){
 //    //   erodeH = doErosion(erodeH,5)
 //    // }
 //    // erodeH = doErosion(primH, 0.5);
 //    // erodeH = doErosion(primH, 0.5);

    // primDraw(svg,erodeH,'coast')

 physViewCoast = true;
 physViewRivers = true;
 physViewSlope = false;
 physViewBoarder = true;

 physViewHeight = "density"; //density,city,none
 // physViewHeight = "city"

    // physH = generateCoast({npts:4096});

    rivers = getRiverByLinks(nodeMeshIndex,links,mesh)
    rivers = rivers.map(relaxPath)

    globalSvg = svg;

    physDraw(svg,erodeH,rivers,cities,terr,borders)
}

function redraw(){
    physDraw(globalSvg,erodeH,rivers,cities,terr,borders)
}


function preDrawRealMap(inputGraph,extent,svg){
    var nodes = []
    var allNodes = inputGraph.nodes;
    var cities = []
    var rivers = []

    var links = []
    var nodeIndex = {}
    for(var i=0;i<inputGraph.nodes.length;i++){
        if(inputGraph.nodes[i].type && inputGraph.nodes[i].type=="weibo"){
            nodes.push(inputGraph.nodes[i])
        }else{
            cities.push(inputGraph.nodes[i])
        }
    }

    var nodeIndex = {}
    for(var i=0;i<nodes.length;i++){
        nodeIndex[nodes[i].data.mid] = nodes[i]
    }
    for(var i=0;i<nodes.length;i++){
        var parent = nodes[i].parent;
        if(parent && nodeIndex[parent.data.mid]){
            links.push({source:parent,target:nodes[i],count:nodes[i].nodeNum})
        }
    }

    links.sort(function(a,b){
        return b.count-a.count
    })



    globalExtent = extent

    globalScale = []
    globalScale[0] = d3.scaleLinear().domain([-0.5,0.5])
        .range([-extent.width/2.0,extent.width/2.0])
    globalScale[1] = d3.scaleLinear().domain([-0.5,0.5])
        .range([-extent.height/2.0,extent.height/2.0])



    var xScale = d3.scaleLinear().domain(d3.extent(allNodes.map(function(d){
        return d.x
    }))).range([-0.5,0.5])
    // xScale.domain([(xScale.domain()[1]+xScale.domain()[0])/2,xScale.domain()[1]])
    var yScale = d3.scaleLinear().domain(d3.extent(allNodes.map(function(d){
        return d.y
    }))).range([-0.5,0.5])
    // yScale.domain([(yScale.domain()[1]+yScale.domain()[0])/2,yScale.domain()[1]])
    var valScale = d3.scaleLinear().domain(d3.extent(nodes.map(function(d){
        return d.totalChildren+1
    }))).range([0,1])
    var gaussianNodes = []

    indexedNodes = []

    for(var i=0;i<allNodes.length;i++){
        var depth = (allNodes[i].depth || allNodes[i].depth==0)?allNodes[i].depth:0
        var id = allNodes[i].id?allNodes[i].id:allNodes[i].key

        gaussianNodes.push([xScale(allNodes[i].x),yScale(allNodes[i].y),
            depth,id,0.01,allNodes[i].words?allNodes[i].words:[[allNodes[i].key]]])
        indexedNodes.push(gaussianNodes[gaussianNodes.length-1])
        // gaussianNodes.push({x:xScale(nodes[i].data.loc[0]),
            // y:yScale(nodes[i].data.loc[1]),val:nodes[i].data.totalChildren+1})

        // console.log("map graph",globalScale[0](gaussianNodes[i][0]),globalScale[1](gaussianNodes[i][1]))
        // if(allNodes[i].id){
        if(id){
            nodeIndex[id] = gaussianNodes[gaussianNodes.length-1]
        }

    }

    function calDistance(p0,p1){
        var dis = ((p0[0]-p1[0])*(p0[0]-p1[0]) + (p0[1]-p1[1])*(p0[1]-p1[1])) 
        dis = Math.sqrt(dis);
        return dis
    }
    var oriNodes = []
    var k = 0;


    var tempSVG = d3.select("body").append("svg").attr("id","tempSvg")

    for(var i=0;i<links.length;i++){
        var source = links[i].source;
        var target = links[i].target;
        var sourcePoint = [xScale(source.x),yScale(source.y)]
        var targetPoint = [xScale(target.x),yScale(target.y)]
        
        var distance = calDistance(sourcePoint,targetPoint)
        source.r = distance;

        if(!nodeIndex[source.id]){
            console.log("err")
        }

        nodeIndex[source.id][4] = distance
        // target.r = distance;

        var path = tempSVG.append("path")
          .attr("d",function(d){
            return "M" + sourcePoint +
              "C" + [sourcePoint[0],(sourcePoint[1]+targetPoint[1])/2.0]
              + " " + [targetPoint[0],(sourcePoint[1]+targetPoint[1])/2.0]
              + " " + targetPoint
            // return "M"+source.data.loc+"L"+target.data.loc;
          })

        var nodesAlongPath = [];
        path = path.node()
        var l = path.getTotalLength()
        var sNum = 20;

        for(var j=0;j<=sNum;j++){
            var p = path.getPointAtLength(1.0*j/sNum*l)
            var number = source.id+","+target.id;
            var newNode = {id:number+","+k,depth:source.depth+1.0*j/sNum,data:{loc:[p.x,p.y],totalChildren:source.data.totalChildren}}
            nodesAlongPath.push(newNode)
            var oNode = [p.x,p.y,
            newNode.depth,newNode.id,distance/sNum/2.0,links[i].source.words]
            indexedNodes.push(oNode)
            gaussianNodes.push(oNode)

            k++;
        }        

        // for(var j=0;j<nodesAlongPath.length;j++){
        //     var cNode = nodesAlongPath[j]
        //     cNode.projLoc = [xScale(cNode.data.loc[0]),yScale(cNode.data.loc[1])]
        // }
        links[i].nodesAlongPath=nodesAlongPath
        links[i].nodesAlongPath[0].r = distance
        // var oNode = links[i].nodesAlongPath[0]
        // oriNodes.push([xScale(oNode.data.loc[0]),yScale(oNode.data.loc[1]),
        //     oNode.depth,oNode.id,distance,links[i].source.words])        
    }
    d3.select("#tempSvg").remove();

    // var oriNodes = graph.oriNodes;

    var linkThreshold = 10;
    links = links.splice(0,linkThreshold)


    drawMap(nodes,links,indexedNodes,gaussianNodes,cities,svg)

}

function drawMap(nodes,links,indexedNodes,gaussianNodes,cityNodes,svg){

    var points = [];

    points = generatePoints(4096)
    var mesh = makeMesh(points)
    console.log("Init Draw:",points)
    // points = improvePoints(points,10,extent);


    primH = zero(mesh);

    nodeMeshIndex = createIndex(indexedNodes,mesh)

    // var newvals = matchNodestoTerrain1(gaussianNodes,mesh,nodeMeshIndex)
    // var newvals = matchNodestoTerrainBraod(gaussianNodes,mesh,nodeMeshIndex)
    var newvals = matchNodestoTerrainSplatting(gaussianNodes,mesh,nodeMeshIndex)


    // var newvals = matchNodestoTerrain(gaussianNodes,mesh)
    primH = add(primH,newvals)
    primH = add(primH, cone(primH.mesh, -0.5));
    // primH = setSeaLevel(primH, runif(0.2, 0.6));
    primH = fillSinks(primH);

    primH = doErosion(primH, runif(0, 0.1), 5);

    // cities = cityScoreNew(primH)
    cities = cityBySetting(primH,cityNodes,nodeMeshIndex)

    terr = getTerritories({h:primH,cities:cities,
        params:{nterrs:cities.length}})
    console.log("terr",terr)

    borders = getBorders({terr:terr,h:primH})



    erodeH = primH

 physViewCoast = true;
 physViewRivers = true;
 physViewSlope = false;
 physViewBoarder = true;

 physViewHeight = "density"; //density,city,none
 // physViewHeight = "city"

    // physH = generateCoast({npts:4096});

    // rivers = getRiverByLinks(nodeMeshIndex,links,mesh)

    rivers = getRiverSequence(nodeMeshIndex,links,mesh,terr,cities)

    rivers = rivers.map(relaxPath)

    globalSvg = svg;

    physDraw(svg,erodeH,rivers,cities,terr,borders)
}




// function primDraw(svg,prim,name){
//     renderVoronoi(svg, prim);
//     renderPaths(svg, name, contour(prim, 0));

// }

function makeD3Path(path,scale) {
    if(!scale){
        scale = globalScale
    }
    var p = d3.path();
    p.moveTo(globalScale[0](path[0][0]), globalScale[1](path[0][1]));
    for (var i = 1; i < path.length; i++) {
        p.lineTo(globalScale[0](path[i][0]), globalScale[1](path[i][1]));
    }
    return p.toString();
}


function physDraw(physSVG,physH,river,cities,terr,borders) {
    if (physViewHeight && physViewHeight=="density") {
        visualizeVoronoi(physSVG, physH, 0);
    } else if(physViewHeight && physViewHeight=="city") {
        visualizeVoronoi(physSVG,terr)
    } else{
        physSVG.selectAll("path.field").remove();

    }
    if (physViewCoast) {
        drawPaths(physSVG, "coast", contour(physH, 0).map(relaxPath));
    } else {
        drawPaths(physSVG, "coast", []);
    }
    if (physViewRivers) {
        drawPaths(physSVG,"river",river)
        // drawPaths(physSVG, "river", getRivers(physH, 0.001));
    } else {
        drawPaths(physSVG, "river", []);
    }
    if (physViewSlope) {
        visualizeSlopes(physSVG, {h:physH});
    } else {
        visualizeSlopes(physSVG, {h:zero(physH.mesh)});
    }
    if (physViewBoarder){
        drawPaths(physSVG, "border", borders)
    }else{
        drawPaths(physSVG, "border", borders)
    }

    visualizeCities(physSVG,"city",physH,cities)
    visualizeText(physSVG,"name",physH,cities,terr)
}

function visualizeText(svg,cls,h,cities,terr,scale){
    if(!scale){
        scale = globalScale
    }

    var terrData = []
    var textIndex = {}
    var textSize = d3.scaleLinear().range([0.7,1.3])
    var textDomains = []

   for(var i=0;i<cities.length;i++){
        var city = cities[i]
        var text = h.mesh.vxs[city][2]
        var pos = h.mesh.vxs[city]
        var shownText = null
        for(var j=0;j<text.length;j++){
            if(!textIndex[text[j][0]]){
                textIndex[text[j][0]] = true
                shownText = text[j]
                textDomains.push(text[j][1])
                break;
            }
        }
        terrData.push({type:"city",id:i,city:city,pos:pos,text:text,shownText:shownText})
    }


    // for(var i=0;i<cities.length;i++){
    //     var city = cities[i];
    //     var lc = terrCenter(h,terr,city,true)

    //     var text = h.mesh.vxs[city][2]
    //     var shownText = null
    //     for(var j=0;j<text.length;j++){
    //         if(!textIndex[text[j][0]]){
    //             textIndex[text[j][0]] = true
    //             shownText = text[j]
    //             textDomains.push(text[j][1])
    //             break;
    //         }
    //     }

    //     terrData.push({type:"terr",id:i,city:city,pos:lc,text:text,shownText:shownText})
    // }
    textSize.domain(d3.extent(textDomains))
    if(textDomains.length<1){
        textSize.domain([1,1])
    }

 

    var cityNode = svg.selectAll('g.'+ cls)
        .data(terrData,function(d){
            return d.id+d.type;
        })

    var enter = cityNode.enter()
        .append("g")
        .attr("class",cls)

    enter.append("text").attr("class",cls)

    enter.merge(cityNode)
        .selectAll("text."+cls)
        .attr('x', function (d) {
            return scale[0](d.pos[0]) + (d.type=="city"?7:0)
        })
        .attr('y', function (d) {
            return scale[1](d.pos[1])
        })
        .style("font-size",function(d){
            if(d.shownText){
                return keywordAttributesMapping[d.shownText[0]].size*1.5+"px"
                // return textSize(d.shownText[1])+"em"
            }
            return
        })
        .text(function(d){
            // var words = d.text;
            // if(words && words[0]){
            //     return words[0][0]
            // }
            var words = d.shownText;
            if(words){
                return words[0];
            }
        })


    cityNode.exit().remove()

    // svg.selectAll("circle."+cls)
        

}

function visualizeCities(svg,cls,h,cities,scale){
    if(!scale){
        scale = globalScale
    }

    var cityNode = svg.selectAll('g.'+ cls)
        .data(cities)

    var enter = cityNode.enter()
        .append("g")
        .attr("class",cls)

    enter.append("circle").attr("class",cls)
    // enter.append("text").attr("class",cls)

    enter.merge(cityNode)
        .selectAll("circle."+cls)
        .attr('cx', function (d) {return scale[0](h.mesh.vxs[d][0])})
        .attr('cy', function (d) {return scale[1](h.mesh.vxs[d][1])})
        // .attr('r', function (d, i) {return 5})
        .attr("r",function(d){
            return keywordAttributesMapping[h.mesh.vxs[d][2]].size
        })
        // .style('fill', 'white')
        .style("fill",function(d){
            return keywordAttributesMapping[h.mesh.vxs[d][2]].color
        })
        .style('stroke-width', 2)
        .style('stroke-linecap', 'round')
        .style('stroke', 'black')
        // .raise();

    // enter.merge(cityNode)
    //     .selectAll("text."+cls)
    //     .attr('x', function (d) {return scale[0](h.mesh.vxs[d][0])})
    //     .attr('y', function (d) {return scale[1](h.mesh.vxs[d][1])})
    //     .text(function(d){
    //         var words = h.mesh.vxs[d][2];
    //         if(words && words[0]){
    //             return words[0][0]
    //         }
    //     })


    cityNode.exit().remove()

    // svg.selectAll("circle."+cls)
        

}
// function visualizeCities(svg,cls,h,cities,scale){
//     if(!scale){
//         scale = globalScale
//     }

//     var cityNode = svg.selectAll('circle.'+ cls)
//         .data(cities)

//     cityNode.enter()
//         .append("circle")
//         .attr("class",cls)

//     cityNode.exit().remove()

//     svg.selectAll("circle."+cls)
//         .attr('cx', function (d) {return scale[0](h.mesh.vxs[d][0])})
//         .attr('cy', function (d) {return scale[1](h.mesh.vxs[d][1])})
//         .attr('r', function (d, i) {return 5})
//         .style('fill', 'white')
//         .style('stroke-width', 2)
//         .style('stroke-linecap', 'round')
//         .style('stroke', 'black')
//         .raise();

// }

function renderPaths(svg,cls,paths){
    var paths = svg.selectAll('path.' + cls).data(paths)
    paths.enter()
            .append('path')
            .classed(cls, true)
    paths.exit()
            .remove();
    svg.selectAll('path.' + cls)
        .attr('d', makePath);

}

function makePath(d){
    var p = d3.path();
    var path = d;
    p.moveTo(path[0][0], path[0][1]);
    for (var i = 1; i < path.length; i++) {
        p.lineTo(path[i][0], path[i][1]);
    }
    return p.toString();    
}

function renderVoronoi(svg, field, lo, hi) {
    if (hi == undefined) hi = d3.max(field) + 1e-9;
    if (lo == undefined) lo = d3.min(field) - 1e-9;
    var mappedvals = field.map(function (x) {return x > hi ? 1 : x < lo ? 0 : (x - lo) / (hi - lo)});
    var tris = svg.selectAll('path.field').data(field.mesh.tris)
    tris.enter()
        .append('path')
        .classed('field', true);
    
    tris.exit()
        .remove();

    svg.selectAll('path.field')
        .attr('d', makePath)
        .style('fill', function (d, i) {
            // return d3.interpolateViridis(0)
            return d3.interpolateViridis(mappedvals[i]);
        })
        // .style("stroke",4)
        // .style("fill-opacity",0.5);
}

function createIndex(gaussianNodes,mesh){

    var n = gaussianNodes.length;

    var nodeMeshIndex = {}

    for(var j=0;j<n;j++){
        var m = gaussianNodes[j];
        var minIndex = -1;
        var distanceMin = Number.MAX_VALUE

        for(var i=0;i<mesh.vxs.length;i++){
            var p = mesh.vxs[i];

            var dis = (p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])
            if(dis<distanceMin){
                distanceMin = dis;
                minIndex = i;
            }
            // newvals[i] += Math.pow(Math.exp(-((p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])) / (2 * r * r)), 2);
        }
        nodeMeshIndex[m[3]] = minIndex //m[3] node id
    }
    return nodeMeshIndex
}

function getMatchingNodes(node,mesh){
    var minIndex = -1;
    var distanceMin = Number.MAX_VALUE
    var m = node

    for(var i=0;i<mesh.vxs.length;i++){
        var p = mesh.vxs[i];

        var dis = (p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])
        if(dis<distanceMin){
            distanceMin = dis;
            minIndex = i;
        }
        // newvals[i] += Math.pow(Math.exp(-((p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])) / (2 * r * r)), 2);
    }
    return mesh.vxs[minIndex]

}

function getRiverSequence(nodeMeshIndex,links,mesh,terr,cities){
    var paths = []
    var sequences = []
    for(var i=0;i<links.length;i++){
        var sequence = []
        var lastTerr = -1
        var path = []
        var nodesAlongPath = links[i].nodesAlongPath;
        for(var j=0;j<nodesAlongPath.length;j++){
            var cNodeSrc = links[i].nodesAlongPath[j];
            // var cNodeTarget = links[i].nodesAlongPath[j+1]
            var srcIndex = nodeMeshIndex[cNodeSrc.id]
            // var targetIndex = nodeMeshIndex[cNodeTarget.id]
            if(srcIndex!=-1){
                path.push(mesh.vxs[srcIndex])
            }
            var seq = terr[srcIndex]
            if(seq!=-1 && lastTerr!=seq){
                sequence.push([seq,srcIndex]);
                lastTerr = seq;
            }
        }
        links[i].sequence = sequence;
        paths.push(path)
        console.log('seq',links[i].sequence)
        sequences.push(sequence)
    }

    sequences.sort(function(a,b){
        var k = 0;
        while(k<a.length && k<b.length && a[k][0]==b[k][0]){
            k++
        }
        if(k>=a.length && k<b.length){
            return -1
        }else if(k<a.length && k>=b.length){
            return 1
        }else if(k<a.length && k<b.length){
            return a[k][0]-b[k][0]
        }else{
            return 0
        }
    })
    console.log('sequencess',sequences)

    var roots = {}
    for(var i=0;i<sequences.length;i++){
        var item = sequences[i][0]
        if(!roots[item[0]]){
            roots[item[0]] = {root:item[0],nodes:[],children:{},id:item[0],posIndexs:[item[1]]}
        }
        roots[item[0]].nodes.push(sequences[i])
    }


    function constructTree(root,nodes,i){
        if(!root.children[nodes[i][0]]){
            root.children[nodes[i][0]] = {children:{},id:nodes[i][0],posIndexs:[],nodes:[]}
        }
        root.children[nodes[i][0]].posIndexs.push(nodes[i][1])
        root.children[nodes[i][0]].nodes.push(nodes)
        
        if(i<nodes.length-1){
            constructTree(root.children[nodes[i][0]],nodes,i+1)
        }
    }

    for(var i in roots){
        var nodes = roots[i].nodes;
        for(var j=0;j<nodes.length;j++){
            if(nodes[j].length<=1){
                continue;
            }
            constructTree(roots[i],nodes[j],1)
        }
    }
    console.log("roots",roots)

    function visitTree(root,callback,callbackLeaf,params){
        if(root){
            callback(root,params)
        }else{
            return;
        }
        var count = 0;
        for(var i in root.children){
            visitTree(root.children[i],callback,callbackLeaf,root.path)
            count++            
        }
        if(!count && callbackLeaf){
            callbackLeaf(root)
        }
    }

    function mergeChildren(root){
        var poses = [0,0]
        var count = 0;
        for(var i=0;i<root.posIndexs.length;i++){
            var index = root.posIndexs[i];
            var pos = mesh.vxs[index]
            poses[0]+=pos[0];
            poses[1]+=pos[1];
            count++
        }
        if(count){
            poses[0]/=count;
            poses[1]/=count;
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

    function loadPaths(root){
        mergedPaths.push(root.paths)
    }

    function getPaths(root,paths){
        if(root){
            var pos = root.pos
            paths.push(pos)
            root.paths = [].concat(paths)
        }else{
            return;
        }
        var count = 0;
        for(var i in root.children){
            getPaths(root.children[i],paths)
            count++            
        }
        if(!count){
            loadPaths(root)
        }
        paths.pop()

    }

    function getSepPaths(root){
        var source = root.pos
        for(var i in root.children){
            var target = root.children[i].pos
            mergedPaths.push([source,target])
        }
    }

    var count1 = 0
    for(var i in roots){
        visitTree(roots[i],mergeChildren)
        visitTree(roots[i],getSepPaths)
        // getPaths(roots[i],[])
        // if(count1>2){
        //     break;
        // }
        // count1++
    }
    console.log("merged Paths",mergedPaths)

    var riverPaths = riverlize(mergedPaths,mesh,nodeMeshIndex)
    return riverPaths;
    // return mergedPaths;    
}

function riverlize(riverPaths,mesh,nodeMeshIndex){

    var tempSVG = d3.select("body").append("svg").attr("id","tempSvg")

    var newPaths = []
    for(var i=0;i<riverPaths.length;i++){
        var sourcePoint = riverPaths[i][0]
        var targetPoint = riverPaths[i][1]
        var path = tempSVG.append("path")
          .attr("d",function(d){
            return "M" + sourcePoint +
              "C" + [sourcePoint[0],(sourcePoint[1]+targetPoint[1])/2.0]
              + " " + [targetPoint[0],(sourcePoint[1]+targetPoint[1])/2.0]
              + " " + targetPoint
            // return "M"+source.data.loc+"L"+target.data.loc;
          })

        var nodesAlongPath = [];
        path = path.node()
        var l = path.getTotalLength()
        var sNum = 20;


        var newPath = []
        for(var j=0;j<=sNum;j++){
            var p = path.getPointAtLength(1.0*j/sNum*l)

            var meshPoint = getMatchingNodes([p.x,p.y],mesh)
            // var meshPoint = mesh.vxs[mIndex]
            newPath.push(meshPoint)
        }

        newPaths.push(newPath)

    }
    d3.select("#tempSvg").remove();

    return newPaths
}


function getRiverByLinks(nodeMeshIndex,links,mesh){
    
    var paths = []
    for(var i=0;i<links.length;i++){
        var path = []
        var nodesAlongPath = links[i].nodesAlongPath;
        for(var j=0;j<nodesAlongPath.length;j++){
            var cNodeSrc = links[i].nodesAlongPath[j];
            // var cNodeTarget = links[i].nodesAlongPath[j+1]
            var srcIndex = nodeMeshIndex[cNodeSrc.id]
            // var targetIndex = nodeMeshIndex[cNodeTarget.id]
            if(srcIndex!=-1){
                path.push(mesh.vxs[srcIndex])
            }
        }
        paths.push(path)
    }
    return paths;
}

function matchNodestoTerrain1(gaussianNodes,mesh,nodeMeshIndex){
    var n = gaussianNodes.length;

    var valScale = d3.scaleLinear().domain(d3.extent(gaussianNodes.map(function(d){
        return d[2]
    }))).range([3,1])
    var r = 0.5;
    var newvals = zero(mesh)


    for(var j=0;j<n;j++){
        var m = gaussianNodes[j];
        var index = nodeMeshIndex[m[3]]
        var p = mesh.vxs[index]

        newvals[index] = Math.pow(Math.exp(-((p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])) / (2 * r * r)), 2)*valScale(m[2]);       
        var neibors = neighbours(mesh,index)
        for(var k=0;k<neibors.length;k++){
            // if(!newvals[neibors[k]]){

            // }
            newvals[neibors[k]] = newvals[index]
        }
    }
    return newvals;
}

function matchNodestoTerrainBraod(gaussianNodes,mesh,nodeMeshIndex){
    var n = gaussianNodes.length;

    var valScale = d3.scaleLinear().domain(d3.extent(gaussianNodes.map(function(d){
        return d[2]
    }))).range([3,1])
    var r = 0.1;
    var newvals = zero(mesh)


    for(var j=0;j<n;j++){
        var m = gaussianNodes[j];
        var index = nodeMeshIndex[m[3]]
        var p = mesh.vxs[index]

        newvals[index]+=Math.pow(Math.exp(-((p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])) / (2 * r * r)), 2)*valScale(m[2]);       
        var neibors = neighbours(mesh,index)
        for(var k=0;k<neibors.length;k++){
            // if(!newvals[neibors[k]]){

            // }
            var p = mesh.vxs[neibors[k]]
            newvals[neibors[k]] += Math.pow(Math.exp(-((p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])) / (2 * r * r)), 2)*valScale(m[2]);  
            // var neiborNeibors = neighbours(mesh,neibors[k])
            // for(var m=0;m<neiborNeibors.length;m++){
            //     var p = mesh.vxs[neiborNeibors[m]]
            //     newvals[neiborNeibors[m]] += Math.pow(Math.exp(-((p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])) / (2 * r * r)), 2)*valScale(m[2]);  
            
            // }
            // newvals[neibors[k]] += Math.pow(Math.exp(-((p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])) / (2 * r * r)), 2)*valScale(m[2]);  
        }
    }
    return newvals;
}

function cityBySetting(h,cityNodes,nodeMeshIndex){
    var cities = []
    for(var i=0;i<cityNodes.length;i++){
        var key = cityNodes[i].key;
        cities.push(nodeMeshIndex[key])
    }
    return cities;
}

function cityScoreNew(h,binNum){
  if(!binNum){
    binNum = 10;
  }

  var xScale = d3.scaleLinear().domain(d3.extent(h.mesh.vxs.map(function(d){
    return d[0]
  }))).range([0,binNum])

  var yScale = d3.scaleLinear().domain(d3.extent(h.mesh.vxs.map(function(d){
    return d[1]
  }))).range([0,binNum])

  binMap = {}

  for(var i=0;i<h.mesh.vxs.length;i++){
    var x = parseInt(xScale(h.mesh.vxs[i][0]))
    var y = parseInt(yScale(h.mesh.vxs[i][1]))

    var index = x+','+y;
    if(!binMap[index]){
        binMap[index] = {data:[],x:x,y:y,max:Number.MIN_VALUE,maxIndex:-1}
    }
    binMap[index].data.push(i)
    if(h[i]>binMap[index].max){
        binMap[index].max = h[i]
        binMap[index].maxIndex = i;
    }
  }

  var cityThreshold = 10;
  var maxIndexs = []
  for(var i in binMap){
    var maxIndex = binMap[i].maxIndex;
    var max = binMap[i].max
    if(maxIndex==-1){
        continue;
    }
    maxIndexs.push({index:maxIndex,max:max})
  }
  var newMaxIndex = d3.entries(maxIndexs).sort(function(a,b){
    return b.value.max - a.value.max
  })
  var returnData = []
  returnData = newMaxIndex.slice(0,cityThreshold).map(function(d){
    return d.value.index
  })
  console.log("city",returnData)
  return returnData

}

function matchNodestoTerrain(gaussianNodes,mesh){



    var newvals = zero(mesh)
    var n = gaussianNodes.length;

    var valScale = d3.scaleLinear().domain(d3.extent(gaussianNodes.map(function(d){
        return d[2]
    }))).range([3,1])
    var r = 0.5;

    for(var j=0;j<n;j++){
        var m = gaussianNodes[j];
        var minIndex = -1;
        var distanceMin = Number.MAX_VALUE

        for(var i=0;i<mesh.vxs.length;i++){
            var p = mesh.vxs[i];

            var dis = (p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])
            if(dis<distanceMin){
                distanceMin = dis;
                minIndex = i;
            }
            // newvals[i] += Math.pow(Math.exp(-((p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])) / (2 * r * r)), 2);
        }
        if(minIndex!=-1){
            var p = mesh.vxs[minIndex];
            newvals[minIndex] = Math.pow(Math.exp(-((p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])) / (2 * r * r)), 2)*valScale(m[2]);       
            var neibors = neighbours(mesh,minIndex)
            for(var k=0;k<neibors.length;k++){
                // if(!newvals[neibors[k]]){

                // }
                newvals[neibors[k]] = newvals[minIndex]
            }
            // newvals[minIndex] += Math.pow(Math.exp(-((p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])) / (2 * r * r)), 2)*valScale(m[2]);
        }

    }

    // for(var i=0;i<mesh.vxs.length;i++){
    //     var p = mesh.vxs[i];
    //     var distanceMin = Number.MAX_VALUE
    //     var minIndex = -1;
    //     for(var j=0;j<n;j++){
    //         var m = gaussianNodes[j];
    //         var dis = (p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])
    //         if(dis<distanceMin){
    //             distanceMin = dis;
    //             minIndex = j;
    //         }
    //         // newvals[i] += Math.pow(Math.exp(-((p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])) / (2 * r * r)), 2);
    //     }
    //     if(minIndex!=-1){
    //         var m = gaussianNodes[minIndex];            
    //         newvals[i] += Math.pow(Math.exp(-((p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])) / (2 * r * r)), 2)*valScale(m[2]);
    //     }
    // }
    return newvals;

}

// function matchNodestoTerrainSplatting(oriNodes,mesh,nodeMeshIndex){
//     var n = oriNodes.length;

//     var valScale = d3.scaleLinear().domain(d3.extent(oriNodes.map(function(d){
//         return d[2]
//     }))).range([3,1])
//     var r = 0.1;
//     var newvals = zero(mesh)


//     for(var j=0;j<n;j++){
//         var m = oriNodes[j];
//         var index = nodeMeshIndex[m[3]]
//         var p = mesh.vxs[index]

//         newvals[index]+=Math.pow(Math.exp(-((p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])) / (2 * r * r)), 2)*valScale(m[2]);       
//         var neibors = neighbours(mesh,index)
//         for(var k=0;k<neibors.length;k++){
//             // if(!newvals[neibors[k]]){

//             // }
//             var p = mesh.vxs[neibors[k]]
//             newvals[neibors[k]] += Math.pow(Math.exp(-((p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])) / (2 * r * r)), 2)*valScale(m[2]);  
//             var neiborNeibors = neighbours(mesh,neibors[k])
//             for(var q=0;q<neiborNeibors.length;q++){
//                 var p = mesh.vxs[neiborNeibors[q]]
//                 newvals[neiborNeibors[q]] += Math.pow(Math.exp(-((p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])) / (2 * r * r)), 2)*valScale(m[2]);  
//             }
//             // newvals[neibors[k]] += Math.pow(Math.exp(-((p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])) / (2 * r * r)), 2)*valScale(m[2]);  
//         }
//     }
//     return newvals;
// }

function matchNodestoTerrainSplatting(oriNodes,mesh,nodeMeshIndex){
    var n = oriNodes.length;

    var valScale = d3.scaleLinear().domain(d3.extent(oriNodes.map(function(d){
        return d[2]
    }))).range([3,1])
    var r = 0.05;
    var newvals = zero(mesh)

    var valScale1 = d3.scaleLinear().domain(d3.extent(oriNodes.map(function(d){
        return d[2]
    }))).range([3,1])

    var wordCount = 0

    for(var i=0;i<n;i++){
        var m = oriNodes[i];
        var setDistance = m[4]*valScale1(m[2])
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

        var disScale = d3.scaleLinear().domain([0,setDistance]).range([15,1])

        var queue = new Queue()
        queue.enqueue([index,0])
        var visited = {}
        while(!queue.isEmpty()){
            var item = queue.dequeue();
            var itemIndex = item[0]
            var itemDis = item[1]
            var p = mesh.vxs[itemIndex]
            // newvals[item]+=Math.pow(Math.exp(-((p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])) / (2 * r * r)), 2)*valScale(m[2]);
            newvals[itemIndex]+=Math.pow(Math.exp(-((p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])) / (2 * r * r)), 2)*valScale(m[2])*disScale(itemDis);

            if(!p[2]){
                p[2] = words
                wordCount++
            }



            var neibors = neighbours(mesh,itemIndex)
            for(var j=0;j<neibors.length;j++){
                var p = mesh.vxs[neibors[j]]
                var dis = (p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])
                if(visited[neibors[j]] || Math.sqrt(dis)>setDistance){
                    continue;
                }
                if(!p[2]){
                    p[2] = words;
                    wordCount++
                }
                visited[neibors[j]] = true;
                queue.enqueue([neibors[j],dis])
            }
            // console.log(d3.entries(visited).length)
        }
    }
    return newvals;
}


function visitTree(node,callback,callback1){
  // create a new queue
  var queue = new Queue();

  // enqueue an item
  queue.enqueue(node);


  while(!queue.isEmpty()){
    // dequeue an item
    var item = queue.dequeue();
    callback(item);
    for(var i=0;i<item.children.length;i++){
      queue.enqueue(item.children[i]);
    }
    callback1(item);
  }
}





