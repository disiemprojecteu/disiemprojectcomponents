var ChordView = function(svgName,pos,fillColor,parent){//x,y,idlist = key,value,idList
	// this.svgName = gSVGName;
	//this.data = data;
	this.width = pos.width;
	this.height = pos.height;
	this.x = pos.x;
	this.y = pos.y;
	this.fillColor = fillColor;
	// this.titleText = titleText;

	// this.vis = d3.select("#"+this.svgName).append("g")
	// 	.attr("class","sequence")
	// 	.attr("id","barChart"+id)
	// 	.attr("transform","translate("+this.x+","+this.y+")");
	this.vis = d3.select("#"+svgName).append("g")
		.attr("class","chordView")
		.attr("transform","translate("+this.x+","+this.y+")");

	this.vis.append("g").attr("class","groups")
	this.vis.append("g").attr("class","ribbons")

	var svgDefs = this.vis.append("defs")
	this.svgDefs = svgDefs
	// this.id = id;
	this.parent = parent;
	this.init();
	//this.preprocessData();	
}

ChordView.prototype = {
	init:function(){
		// this.vis.select(".xAxis").remove();
		// this.vis.select(".yAxis").remove();
		// this.vis.select("text").remove();

		var width = this.width;
		var height = this.height;

		//var xScale = d3.scale.ordinal().rangeBands([0,width],0.1);
		var xScale = d3.scaleLinear().range([0,width]);
		var timeScale = d3.scaleTime().range([0,width]);

		var yScale = d3.scaleLinear()
			.range([height,0]);
		var xAxis = d3.axisBottom()
			// .scale(xScale)
			.scale(timeScale)
			// .orient("bottom")
			// .tickValues([]);

		var yAxis = d3.axisLeft()
			.scale(yScale)
			.tickValues([])
			// .orient("left")
			// .tickPadding(-3)
			// .ticks(5);


		this.timeScale = timeScale

		this.xScale = xScale;
		this.yScale = yScale;
		this.xAxis = xAxis;
		this.yAxis = yAxis; 


	},
	updateData:function(data){
		this.data = data;

		this.matrix = data.matrix;
		this.categoryIndex = data.category

		this.preprocessData();
		this.update();
	},
	refresh:function(fillColor){
		this.fillColor = fillColor 
		this.update();
	},
	preprocessData:function(){

		var fillColor = this.fillColor
		var matrix = this.matrix
		var categoryIndex = this.categoryIndex
		var width = this.width
		var height = this.height

		// var innerRadius = Math.min(width,height)/4.0
		// var outerRadius = Math.min(width,height)/2.0
		var innerRadius = 2.5*Math.min(width,height)/6.0
		var outerRadius = 2.5*Math.min(width,height)/5.0

		var idbyIndex = {}

		var count = 0;
		for(var i in categoryIndex){
			idbyIndex[count++] = i
		}
		this.idbyIndex = idbyIndex

		var chord = d3.chord()
			.padAngle(0.05)
			.sortSubgroups(d3.descending)


		var maxVal = 0
		var minVal = Number.MAX_VALUE
		for(var i=0;i<matrix.length;i++){
			for(var j=i+1;j<matrix.length;j++){
				if(maxVal<matrix[i][j]){
					maxVal = matrix[i][j]
				}
				if(minVal>matrix[i][j]){
					minVal = matrix[i][j]
				}
			}
		}
		var opacityMapping = d3.scaleLinear().domain([0,minVal,maxVal])
			.range([0,0.1,0.8])
		this.opacityMapping = opacityMapping

		var chordData = chord(matrix)

		var minRatio = Number.MAX_VALUE
		var minIndex = -1
		var minRange = -1
		var groupData = chordData.groups;

		// for(var i=0;i<groupData.length;i++){
		// 	var range = groupData[i].endAngle - groupData[i].startAngle;
		// 	var ratio = range/matrix[i][i]
		// 	if(minRatio>ratio){
		// 		ratio = minRatio
		// 		minIndex = i
		// 		minRange = range
		// 	}
		// }

		// var unitRadius = Math.sqrt(innerRadius*minRange*(outerRadius - innerRadius)/matrix[minIndex][minIndex])/2.0

		// var circleData = []
		// for(var i=0;i<groupData.length;i++){
		// 	var xIndex = 0;
		// 	var yIndex = 0;
		// 	var itemNum = matrix[i][i]
		// 	var startAngle = groupData[i].startAngle
		// 	var endAngle = groupData[i].endAngle
		// 	for(var j=0;j<itemNum;j++){

		// 		if(alpha>endAngle){
		// 			xIndex = 0
		// 			yIndex++
		// 		}else{
		// 			xIndex++
		// 		}
		// 		var r = yIndex*unitRadius*2 + innerRadius
		// 		var alpha = xIndex*(endAngle - startAngle)/ (unitRadius*2*30) + startAngle
		// 		var item = {x: r*Math.sin(alpha),y:-r*Math.cos(alpha),radius:unitRadius,index:j,group:i,id:i+","+j}

		// 		circleData.push(item)

		// 	}
		// }

		// this.circleData = circleData;


		this.innerRadius = innerRadius
		this.outerRadius = outerRadius

		this.chordData = chordData
	},	
	update:function(){

		var chordData = this.chordData
		// var circleData = this.circleData

		var matrix = this.matrix;
		var categoryIndex = this.categoryIndex

		// var idbyIndex = {}
		// var count = 0;
		// for(var i in categoryIndex){
		// 	idbyIndex[count++] = i
		// }
		var idbyIndex = this.idbyIndex


		var width = this.width;
		var height = this.height;

		var innerRadius = this.innerRadius
		var outerRadius = this.outerRadius

		var svg = this.vis;
		var _this = this

	
		var arc = d3.arc()
			.innerRadius(innerRadius)
			.outerRadius(outerRadius)

		var ribbon = d3.ribbon()
			.radius(innerRadius)

		var fillColor = this.fillColor

		var chordSel = svg.attr("transform","translate("+ width/2 +"," + height/2 + ")")
			.datum(chordData)

		var groupSel = chordSel.select("g.groups")
			// .attr("class","groups")
			.selectAll("g")
			.data(function(d){
				return d.groups
			})

		var groupEnter = groupSel.enter().append("g")

		groupEnter.append("path")
		groupEnter.append("text")
		groupEnter.append("title")

		groupEnter.merge(groupSel).select("path")
			.attr("id",function(d){
				return "group"+d.index
			})		
			.style("fill",function(d){
				if(categoryIndex[idbyIndex[d.index]].majorGroup=="Others"){
					return "#444"
				}
				return fillColor(categoryIndex[idbyIndex[d.index]].majorGroup)
			})
			.attr("d",arc)
			.style("stroke","white")
			.style("fill-opacity",0.8)
			.on("mouseover",function(d){
				hoveringNotification(idbyIndex[d.index])
			})
			.on("mouseout",function(d){
				hoveringNotification(idbyIndex[d.index],true)
			})
			.on("mousedown",function(d){
				clickVennNode([idbyIndex[d.index]],categoryIndex[idbyIndex[d.index]].dataIndex)
			})

		groupEnter.merge(groupSel).select("text")
			.attr("x",15)
			.attr("dy",15)
			.style("font-size","8px")
			.attr("class","label")
			.each(function(d){
				var _sel = d3.select(this)

				_sel.selectAll("textPath").remove()
				_sel.append("textPath")
					.attr("xlink:href",function(dd){
						return "#group"+ d.index
					})
					.text(function(dd){

						var tt = categoryIndex[idbyIndex[d.index]].category
						if(tt=="Others"){
							return tt
						}
					    var reg = /\d+/g

					    var result = tt.match(reg)
						var ldaIndex = result[0]
						var topicIndex = result[1]

						var outputt = "L"+ldaIndex+"T"+topicIndex
						return outputt
					})
			})

		groupEnter.merge(groupSel).select("title")
			.text(function(d){
				return idbyIndex[d.index]+": " +d.value
			})

		groupSel.exit().remove()

// // Add a text label.
// var groupText = group.append("text")
// .attr("x", 6)
// .attr("dy", 15);

// groupText.append("textPath")
// .attr("xlink:href", function(d, i) { return "#group" + i; })
// .text(function(d, i) { return cities[i].name; });

// Remove the labels that don't fit. :(
// groupText.filter(function(d, i) { return groupPath[0][i].getTotalLength() / 2 - 16 < this.getComputedTextLength(); })
// .remove();

  			// var svgDefs = this.vis.append('defs');

            // var mainGradient = svgDefs.append('linearGradient')
            //     .attr('id', 'mainGradient');

            // // Create the stops of the main gradient. Each stop will be assigned
            // // a class to style the stop using CSS.
            // mainGradient.append('stop')
            //     .style('stop-color', '#3f51b5')
            //     .attr('offset', '0');

            // // mainGradient.append('stop')
            // //     .style('stop-color', '#3f51b5')
            // //     .attr('offset', '0.49');

            // // mainGradient.append('stop')
            // //     .style('stop-color', '#009688')
            // //     .attr('offset', '0.51');

            // mainGradient.append('stop')
            //     .style('stop-color', '#009688')
            //     .attr('offset', '1');

        var svgDefs = this.svgDefs
        svgDefs.selectAll("linearGradient").remove()

        var gradients = svgDefs.selectAll("linearGradient")
        	.data(chordData)

        var gradientEnter = gradients.enter().append("linearGradient")
        	.attr("id",function(d){
        		return "gradient"+d.source.index+","+d.target.index
        	})

        gradientEnter.append("stop")
            .style('stop-color', function(d){
            	return fillColor(categoryIndex[idbyIndex[d.source.index]].majorGroup)

            	// if(d.target.index>d.source.index){
	            // 	return fillColor(categoryIndex[idbyIndex[d.target.index]].majorGroup)
            	// }else{
	            // 	return fillColor(categoryIndex[idbyIndex[d.target.index]].majorGroup)
            	// }
            })
            .attr('offset', '0');
        gradientEnter.append("stop")
            .style('stop-color', function(d){
            	return fillColor(categoryIndex[idbyIndex[d.target.index]].majorGroup)
            })
            .attr('offset', '1');

        gradients.exit().remove()


		// var ribbonSel = chordSel.append("g")
		// 	.attr("class","ribbons")
		var ribbonSel = chordSel.select("g.ribbons")
			.selectAll("g")
			.data(function(d){
				return d
			})

		var ribbonEnter = ribbonSel.enter().append("g")
		ribbonEnter.append("path")

		var opacityMapping = this.opacityMapping

		ribbonEnter.merge(ribbonSel).select("path")
			.filter(function(d){
				return d.source.index!=d.target.index
			})
			.attr("d",function(d){
				return ribbon(d)
			})
			// .style("fill",function(d){
			// 	return fillColor(categoryIndex[idbyIndex[d.source.index]].majorGroup)
			// })
			// .style("fill","url(#mainGradient)")
			.style("fill",function(d){
				return "url(#"+"gradient"+d.source.index+","+d.target.index
			})			
			.style("fill-opacity",function(d){
				return opacityMapping(d.source.value)
			})
			.style("stroke","none")

		ribbonSel.exit().remove()


		// var ribbonSel = chordSel.select("g.ribbons")
		// 	.selectAll("g")
		// 	.data(function(d){
		// 		return d
		// 	})

		// var ribbonEnter = ribbonSel.enter().append("g")
		// ribbonEnter.append("g")

		// var opacityMapping = this.opacityMapping

		// var color = d3.interpolateRainbow;


		// ribbonEnter.merge(ribbonSel).select("g")
		// 	.filter(function(d){
		// 		return d.source.index!=d.target.index
		// 	})
		// 	.each(function(d){
		// 		var pathStr = ribbon(d)
		// 		var svgPath = svg.append("path").attr("d",pathStr).remove()

		// 		var cSel = d3.select(this).selectAll("path")
		// 			.data(quads(samples(svgPath.node(),8)))

		// 		var cEnter = cSel.enter().append("path")
		// 		cEnter.merge(cSel)
		// 			.attr("d",function(d){
		// 				return lineJoin(d[0], d[1], d[2], d[3], 32)
		// 			})
		// 		    .style("fill", function(d) { return color(d.t); })
		// 		    .style("stroke", function(d) { return color(d.t); })
				
		// 		cSel.exit().remove()   

		// 	})
		// 	// .attr("d",function(d){
		// 	// 	return ribbon(d)
		// 	// })
		// 	// // .style("fill",function(d){
		// 	// // 	return fillColor(categoryIndex[idbyIndex[d.source.index]].majorGroup)
		// 	// // })
		// 	// // .style("fill","url(#mainGradient)")
		// 	// .style("fill",function(d){
		// 	// 	return "url(#"+"gradient"+d.source.index+","+d.target.index
		// 	// })			
		// 	// .style("fill-opacity",function(d){
		// 	// 	return opacityMapping(d.source.value)
		// 	// })
		// 	// .style("stroke","none")


		// ribbonSel.exit().remove()





		// var circleSel = chordSel.append("g")
		// 	.attr("class","circles")
		// 	.selectAll("g")
		// 	.data(circleData,function(d){
		// 		return d.id;
		// 	})

		// var circleEnter = circleSel.enter().append("g")
		// circleEnter.append("circle")

		// circleEnter.merge(circleSel).select("circle")
		// 	.attr("cx",function(d){
		// 		return d.x
		// 	})
		// 	.attr("cy",function(d){
		// 		return d.y
		// 	})
		// 	.attr("r",function(d){
		// 		return d.radius;
		// 	})
		// 	.style("fill",function(d){
		// 		return d3.rgb(fillColor(categoryIndex[idbyIndex[d.group]].majorGroup)).darker()
		// 	})

		// circleSel.exit().remove()

		chordSel.exit().remove()


// var g = svg.append("g")
//     .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
//     .datum(chord(matrix));

// var group = g.append("g")
//     .attr("class", "groups")
//   .selectAll("g")
//   .data(function(chords) { return chords.groups; })
//   .enter().append("g");

// group.append("path")
//     .style("fill", function(d) { return color(d.index); })
//     .style("stroke", function(d) { return d3.rgb(color(d.index)).darker(); })
//     .attr("d", arc);

// g.append("g")
//     .attr("class", "ribbons")
//   .selectAll("path")
//   .data(function(chords) { return chords; })
//   .enter().append("path")
//     .attr("d", ribbon)
//     .style("fill", function(d) { return color(d.target.index); })
//     .style("stroke", function(d) { return d3.rgb(color(d.target.index)).darker(); });



	},
	hoveringMethod:function(rawID,offFlag){
		var categoryIndex = this.categoryIndex

		var idbyIndex = this.idbyIndex

		// var fillOpacity = offFlag?0.25:0.4
		var opacityMapping = this.opacityMapping

		this.vis.select("g.groups")
			.selectAll("g")
			.select("path")
			.style("fill-opacity",function(d){
				if(offFlag){
					return 0.8
				}else{
					if(idbyIndex[d.index]==rawID){
						return 1.0
					}else{
						return 0.1
					}
				}
			})

		this.vis.select("g.ribbons")
			.selectAll("g")
			.select("path")
			.style("fill-opacity",function(d){
				if(offFlag){
					return opacityMapping(d.source.value)
				}else{
					if(idbyIndex[d.source.index]==rawID || idbyIndex[d.target.index]==rawID){
						return 1.0
					}else{
						return 0.1
					}
				}
			})
	}
}


// Sample the SVG path uniformly with the specified precision.
function samples(path, precision) {
  var n = path.getTotalLength(), t = [0], i = 0, dt = precision;
  while ((i += dt) < n) t.push(i);
  t.push(n);
  return t.map(function(t) {
    var p = path.getPointAtLength(t), a = [p.x, p.y];
    a.t = t / n;
    return a;
  });
}

// Compute quads of adjacent points [p0, p1, p2, p3].
function quads(points) {
  return d3.range(points.length - 1).map(function(i) {
    var a = [points[i - 1], points[i], points[i + 1], points[i + 2]];
    a.t = (points[i].t + points[i + 1].t) / 2;
    return a;
  });
}

// Compute stroke outline for segment p12.
function lineJoin(p0, p1, p2, p3, width) {
  var u12 = perp(p1, p2),
      r = width / 2,
      a = [p1[0] + u12[0] * r, p1[1] + u12[1] * r],
      b = [p2[0] + u12[0] * r, p2[1] + u12[1] * r],
      c = [p2[0] - u12[0] * r, p2[1] - u12[1] * r],
      d = [p1[0] - u12[0] * r, p1[1] - u12[1] * r];

  if (p0) { // clip ad and dc using average of u01 and u12
    var u01 = perp(p0, p1), e = [p1[0] + u01[0] + u12[0], p1[1] + u01[1] + u12[1]];
    a = lineIntersect(p1, e, a, b);
    d = lineIntersect(p1, e, d, c);
  }

  if (p3) { // clip ab and dc using average of u12 and u23
    var u23 = perp(p2, p3), e = [p2[0] + u23[0] + u12[0], p2[1] + u23[1] + u12[1]];
    b = lineIntersect(p2, e, a, b);
    c = lineIntersect(p2, e, d, c);
  }

  return "M" + a + "L" + b + " " + c + " " + d + "Z";
}

// Compute intersection of two infinite lines ab and cd.
function lineIntersect(a, b, c, d) {
  var x1 = c[0], x3 = a[0], x21 = d[0] - x1, x43 = b[0] - x3,
      y1 = c[1], y3 = a[1], y21 = d[1] - y1, y43 = b[1] - y3,
      ua = (x43 * (y1 - y3) - y43 * (x1 - x3)) / (y43 * x21 - x43 * y21);
  return [x1 + ua * x21, y1 + ua * y21];
}

// Compute unit vector perpendicular to p01.
function perp(p0, p1) {
  var u01x = p0[1] - p1[1], u01y = p1[0] - p0[0],
      u01d = Math.sqrt(u01x * u01x + u01y * u01y);
  return [u01x / u01d, u01y / u01d];
}
