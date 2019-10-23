var RiverView = function(svgName,pos,fillColor,parent){//x,y,idlist = key,value,idList
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
		.attr("class","documentPanel")
		.attr("transform","translate("+this.x+","+this.y+")");

	// this.id = id;
	this.parent = parent;
	this.init();
	//this.preprocessData();	
}

RiverView.prototype = {
	init:function(){
		this.vis.select(".xAxis").remove();
		this.vis.select(".yAxis").remove();
		this.vis.select("text").remove();

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

		this.vis.append("g")
			.attr("class","xAxis")
			.attr("transform","translate(0,"+this.height+")");

		this.vis.append("g")
			.attr("class","yAxis")
			;

		var textYPos = -10;
		var xMovement = -(this.width)*0.02;
		var yMovement = 5;

		// this.vis.append("text")
		// 	.attr("transform","translate("+this.width*3.0/4.0+"," + textYPos+")")
		// 	.text(this.titleText);
		// this.vis.append("text")
		// 	.attr("transform","translate("+xMovement+","+yMovement+") rotate(-90)")
		// //	.attr("transform","translate(-5,-5)")
		// 	.text("Topics")
		// 	.style("text-anchor","end")
		// this.vis.append("text")
		// 	// .attr("transform","translate("+this.width*7/10.0+","+(this.height+30)+")")
		// 	.attr("transform","translate("+this.width*9/10.0+","+(-10)+")")
		// 	.text("Actions");
	},
	updateData:function(data,groupCategory){
		this.data = data;

		this.preprocessData(groupCategory);
		this.update();
	},
	refresh:function(fillColor){
		this.fillColor = fillColor 
		this.update();
	},
	preprocessData:function(groupCategory){

		var fillColor = this.fillColor

		var groupIndex = {}
		for(var i =0;i<groupCategory.length;i++){
			groupIndex[groupCategory[i].rawID] = {info:groupCategory[i].info}
		}
		this.groupIndex = groupIndex


		var data = this.data;
		var xScale = this.xScale;
		var yScale = this.yScale;


		var categorizedData = []
		var keyIndex = {}

		this.keyIndex = keyIndex

		var dataList = []

		var count = 0;
		for(var i=0;i<data.length;i++){
			var seq = data[i].anomalSeq;
			var category = data[i].category;
			if(!keyIndex[category]){
				keyIndex[category] = {count:0,anomalyActionIndex:{}};
			}
			keyIndex[category].count++
			for(var j=0;j<seq.length;j++){
				seq[j].index = count++;
				seq[j].category = category;
				seq[j].info = groupIndex[category].info
				seq[j].dateTime = new Date(seq[j].dateTime)
				seq[j].data = data[i]
				dataList.push(seq[j])

				if(!keyIndex[category].anomalyActionIndex[seq[j].action]){
					keyIndex[category].anomalyActionIndex[seq[j].action] = 0
				}
				keyIndex[category].anomalyActionIndex[seq[j].action]++
			}
		}

		for(var i in keyIndex){
			var anomalyActionIndex = keyIndex[i].anomalyActionIndex
			var dataArray = d3.entries(anomalyActionIndex)
			dataArray.sort(function(a,b){
				return b.value - a.value
			})
			keyIndex[i].anomalyArray = dataArray
		}

		var minMaxTime = d3.extent(dataList.map(function(d){
			return d.dateTime
		}))

		var dateBinning = d3.timeDay.range(minMaxTime[0],minMaxTime[1])

		var keys = dateBinning
		var dateIndex = {}
		dateBinning = [d3.timeDay(minMaxTime[0])].concat(dateBinning)
		for(var i=0;i<dateBinning.length;i++){
			dateIndex[dateBinning[i]] = {dateTime:dateBinning[i]}
			for(var k in keyIndex){
				dateIndex[dateBinning[i]][k] = 0
			}
		}

		this.timeScale.domain([dateBinning[0],dateBinning[dateBinning.length-1]])

		for(var i=0;i<dataList.length;i++){
			var category = dataList[i].category;
			var dateValue = d3.timeDay.floor(dataList[i].dateTime)
			if(!dateIndex[dateValue]){
				console.log("sth wrong")
			}
			dateIndex[dateValue][category]++
		}

		var stackDataSource = []
		for(var i in dateIndex){
			stackDataSource.push(dateIndex[i])
		}

		var keySource = []
		for(var i in keyIndex){
			keySource.push(i)
		}

		var stack = d3.stack()
			.keys(keySource)
			// .order(d3.stackOrderNone)
			.offset(d3.stackOffsetWiggle)
			// .offset(d3.stackOffsetNone)

		var series = stack(stackDataSource)

		console.log(series)

function stackMax(layer) {
  return d3.max(layer, function(d) { return d[1]; });
}

function stackMin(layer) {
  return d3.min(layer, function(d) { return d[0]; });
}

		xScale.domain([0,dateBinning.length])
		yScale.domain([d3.min(series,stackMin),d3.max(series,stackMax)])

		this.dateBinning = dateBinning

		series.sort()

		this.series = series;

	},	
	update:function(){

		var series = this.series

		var fillColor = this.fillColor
		var groupIndex = this.groupIndex;
		var keyIndex = this.keyIndex

		var xScale = this.xScale
		var yScale = this.yScale

		var area = d3.area()
		    .x(function(d, i) { 
		    	return xScale(i); 
		    })
		    .y0(function(d) { 
		    	return yScale(d[0]); 
		    })
		    .y1(function(d) { 
		    	return yScale(d[1]); 
		    })
		    .curve(d3.curveCardinal)
		    ;

		var _this = this

		var z = d3.interpolateCool;

		var vis = this.vis;

		vis.select(".xAxis").call(this.xAxis)

		var sel = vis.selectAll("g.band")
			.data(series)

		var enter = sel.enter()
			.append("g").attr("class","band")

		enter.append("path")
		enter.append("title")

		enter.merge(sel).select("path")
			.attr("d",function(d,i){
				return area(d,i)
			})
			.style("fill",function(d){
				return fillColor(groupIndex[d.key].info.majorGroup)
			})
			.style("fill-opacity",0.8)
			.style("stroke","none")

		enter.merge(sel).select("title")
			.text(function(d){
				var str = d.key+": "+keyIndex[d.key].count+"\n";
				str+= "Top anomaly actions:\n"
				var anomalyArray = keyIndex[d.key].anomalyArray
				var length = d3.min([3,anomalyArray.length])
				for(var i=0;i<length;i++){
					str+= anomalyArray[i].key+":"+anomalyArray[i].value +"\n"
				}
				return str;
			})

		sel.exit().remove();

		// var dataBlocks =  this.dataBlocks

		// var _this = this;

		// var vis = this.vis;
		// vis.select(".xAxis").call(this.xAxis);
		// vis.select(".yAxis").call(this.yAxis);

		// var sel = vis.selectAll("g.bar")
		// 	.data(dataBlocks,function(d){
		// 		return d.xType +"," + d.yType;
		// 	})
		// var enter = sel.enter()
		// 	.append("g")
		// 	.attr("class","bar");
		// enter.append("rect");
		// enter.append("title");

		// enter.merge(sel)
		// 	.select("rect")
		// 	.attr("width",function(d){
		// 		return d.width;
		// 	})
		// 	.attr("height",function(d){
		// 		return d.height;
		// 	})
		// 	.attr("x",function(d){
		// 		return d.drawX;
		// 	})
		// 	.attr("y",function(d){
		// 		return d.drawY;
		// 	})
		// 	.style("fill",function(d){
		// 		return _this.fillColor(d.xType)
		// 		// return d.color
		// 	})
		// 	.style("fill-opacity",function(d){
		// 		return d.opacity
		// 	})

		// enter.merge(sel)
		// 	.select("title")
		// 	.text(function(d){
		// 		return d.xType+","+d.yType+": " +d.value+"\n"+"Belong: Topic "+d.belongYIndex+", Tasks - "+actionGroupMapping[d.xType];
		// 	})

		// sel.exit().remove();

		// this.drawLabel()
	},
	drawLabel:function(){

	}
}
