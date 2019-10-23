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

		var innerRadius = Math.min(width,height)/4.0
		var outerRadius = Math.min(width,height)/2.0

		var idbyIndex = {}

		var count = 0;
		for(var i in categoryIndex){
			idbyIndex[count++] = i
		}
		this.idbyIndex = idbyIndex

		var chord = d3.chord()
			.padAngle(0.05)
			.sortSubgroups(d3.descending)

		var chordData = chord(matrix)

		var minRatio = Number.MAX_VALUE
		var minIndex = -1
		var minRange = -1
		var groupData = chordData.groups;

		for(var i=0;i<groupData.length;i++){
			var range = groupData[i].endAngle - groupData[i].startAngle;
			var ratio = range/matrix[i][i]
			if(minRatio>ratio){
				ratio = minRatio
				minIndex = i
				minRange = range
			}
		}

		var unitRadius = Math.sqrt(innerRadius*minRange*(outerRadius - innerRadius)/matrix[minIndex][minIndex])/2.0

		var circleData = []
		for(var i=0;i<groupData.length;i++){
			var xIndex = 0;
			var yIndex = 0;
			var itemNum = matrix[i][i]
			var startAngle = groupData[i].startAngle
			var endAngle = groupData[i].endAngle
			for(var j=0;j<itemNum;j++){

				if(alpha>endAngle){
					xIndex = 0
					yIndex++
				}else{
					xIndex++
				}
				var r = yIndex*unitRadius*2 + innerRadius
				var alpha = xIndex*(endAngle - startAngle)/ (unitRadius*2*30) + startAngle
				var item = {x: r*Math.sin(alpha),y:-r*Math.cos(alpha),radius:unitRadius,index:j,group:i,id:i+","+j}

				circleData.push(item)

			}
		}

		this.circleData = circleData;


		this.innerRadius = innerRadius
		this.outerRadius = outerRadius

		this.chordData = chordData
	},	
	update:function(){

		var chordData = this.chordData
		var circleData = this.circleData

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

	
		var arc = d3.arc()
			.innerRadius(innerRadius)
			.outerRadius(outerRadius)

		var ribbon = d3.ribbon()
			.radius(innerRadius)

		var fillColor = this.fillColor

		var chordSel = svg.append("g")
			.attr("transform","translate("+ width/2 +"," + height/2 + ")")
			.datum(chordData)

		var groupSel = chordSel.append("g")
			.attr("class","groups")
			.selectAll("g")
			.data(function(d){
				return d.groups
			})

		var groupEnter = groupSel.enter().append("g")

		groupEnter.append("path")
		groupEnter.append("text")

		groupEnter.merge(groupSel).select("path")
			.attr("id",function(d){
				return "group"+d.index
			})		
			.style("fill",function(d){
				return fillColor(categoryIndex[idbyIndex[d.index]].majorGroup)
			})
			.attr("d",arc)
			.style("stroke","white")

		groupEnter.merge(groupSel).select("text")
			.attr("x",6)
			.attr("dy",15)
			.style("font-size",8)
			.each(function(d){
				var _sel = d3.select(this)

				_sel.selectAll("textPath").remove()
				_sel.append("textPath")
					.attr("xlink:href",function(dd){
						return "#group"+ d.index
					})
					.text(function(dd){
						return categoryIndex[idbyIndex[d.index]].category
					})
			})


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


		var ribbonSel = chordSel.append("g")
			.attr("class","ribbons")
			.selectAll("g")
			.data(function(d){
				return d
			})

		var ribbonEnter = ribbonSel.enter().append("g")
		ribbonEnter.append("path")

		ribbonEnter.merge(ribbonSel).select("path")
			.attr("d",function(d){
				return ribbon(d)
			})
			.style("fill",function(d){
				return fillColor(categoryIndex[idbyIndex[d.source.index]].majorGroup)
			})
			.style("stroke","none")

		var circleSel = chordSel.append("g")
			.attr("class","circles")
			.selectAll("g")
			.data(circleData,function(d){
				return d.id;
			})

		var circleEnter = circleSel.enter().append("g")
		circleEnter.append("circle")

		circleEnter.merge(circleSel).select("circle")
			.attr("cx",function(d){
				return d.x
			})
			.attr("cy",function(d){
				return d.y
			})
			.attr("r",function(d){
				return d.radius;
			})
			.style("fill",function(d){
				return d3.rgb(fillColor(categoryIndex[idbyIndex[d.group]].majorGroup)).darker()
			})

		circleSel.exit().remove()

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
	drawLabel:function(){

	}
}
