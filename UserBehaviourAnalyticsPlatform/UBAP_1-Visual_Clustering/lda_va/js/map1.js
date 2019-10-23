function drawRealMap(nodes,extent,svg){
    
    var points = [];
    for(var i=0;i<nodes.length;i++){
        points.push([nodes[i].x,nodes[i].y])
    }

    // points = generatePoints(4096)

    console.log("Init Draw:",points,extent)


    // points = improvePoints(points,10,extent);

    var mesh = makeMesh(points,extent)

    var primH = zero(mesh);

    // var z = []
    // for(var i=0;i<mesh.vxs.length;i++){
    //     z[i] = nodes[i].data.totalChildren/100;
    // }
    // z.mesh = mesh;
    // mesh = z;

 //    var xScale = d3.scaleLinear().domain(d3.extent(nodes.map(function(d){
 //        return d.data.loc[0]
 //    }))).range([-1,1])
 //    xScale.domain([(xScale.domain()[1]+xScale.domain()[0])/2,xScale.domain()[1]])
 //    var yScale = d3.scaleLinear().domain(d3.extent(nodes.map(function(d){
 //        return d.data.loc[1]
 //    }))).range([-1,1])
 //    yScale.domain([(yScale.domain()[1]+yScale.domain()[0])/2,yScale.domain()[1]])
 //    var valScale = d3.scaleLinear().domain(d3.extent(nodes.map(function(d){
 //        return d.totalChildren+1
 //    }))).range([0,1])
 //    var gaussianNodes = []
 //    var threshold = 1
 //        r = 0.1;

 //    for(var i=0;i<nodes.length;i++){
 //        if(nodes[i].data.totalChildren<threshold){
 //            continue;
 //        }
 //        gaussianNodes.push([xScale(nodes[i].data.loc[0]),yScale(nodes[i].data.loc[1]),
 //            nodes[i].data.totalChildren*10])
 //        // gaussianNodes.push({x:xScale(nodes[i].data.loc[0]),
 //            // y:yScale(nodes[i].data.loc[1]),val:nodes[i].data.totalChildren+1})
 //    }

 //    var newvals = zero(mesh)
 //    var n = gaussianNodes.length;
 //    for(var i=0;i<mesh.vxs.length;i++){
 //        var p = mesh.vxs[i];
 //        for(var j=0;j<n;j++){
 //            var m = gaussianNodes[j];
 //            newvals[i] += Math.pow(Math.exp(-((p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])) / (2 * r * r)), 2)*m[2];
 //        }
 //    }
 //    primH = add(primH,newvals)


    // // console.log("Init Mesh:",mesh, primH)
 // //    primH = add(primH, slope(primH.mesh, randomVector(0.004)));

    var r = extent.width/10

    primH = add(primH, mountains(primH.mesh, 5,r));
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

    primDraw(svg,erodeH,'coast')

 // physViewCoast = false;
 // physViewRivers = false;
 // physViewSlope = false;
 // physViewHeight = true;

 //    // physH = generateCoast({npts:4096});

 //    physDraw(svg,erodeH)
}

function primDraw(svg,prim,name){
    renderVoronoi(svg, prim);
    renderPaths(svg, name, contour(prim, 0));

}

function physDraw(physSVG,physH) {
    if (physViewHeight) {
        visualizeVoronoi(physSVG, physH, 0);
    } else {
        physSVG.selectAll("path.field").remove();
    }
    if (physViewCoast) {
        drawPaths(physSVG, "coast", contour(physH, 0));
    } else {
        drawPaths(physSVG, "coast", []);
    }
    if (physViewRivers) {
        drawPaths(physSVG, "river", getRivers(physH, 0.01));
    } else {
        drawPaths(physSVG, "river", []);
    }
    if (physViewSlope) {
        visualizeSlopes(physSVG, {h:physH});
    } else {
        visualizeSlopes(physSVG, {h:zero(physH.mesh)});
    }
}

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