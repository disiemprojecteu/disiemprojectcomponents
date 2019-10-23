var MatrixView = function(svg,pos,titleText,id,fillColor,parent){//x,y,idlist = key,value,idList
	// this.svgName = gSVGName;
	//this.data = data;
	this.width = pos.width;
	this.height = pos.height;
	this.x = pos.x;
	this.y = pos.y;
	this.fillColor = fillColor;
	this.titleText = titleText;

	// this.gBarChart = d3.select("#"+this.svgName).append("g")
	// 	.attr("class","sequence")
	// 	.attr("id","barChart"+id)
	// 	.attr("transform","translate("+this.x+","+this.y+")");
	this.gBarChart = svg
		.attr("transform","translate("+this.x+","+this.y+")");

	this.id = id;
	this.parent = parent;
	this.init();
	this.highlightingData = []
	this.operation = 'select'

	this.sortingOrder = null

	this.lastData = []
	//this.preprocessData();	
}

MatrixView.prototype = {
	init:function(){
		this.gBarChart.select(".xAxis").remove();
		this.gBarChart.select(".yAxis").remove();
		this.gBarChart.select("text").remove();

		var width = this.width;
		var height = this.height;

		//var xScale = d3.scale.ordinal().rangeBands([0,width],0.1);
		var xScale = d3.scaleLinear().range([0,width]);
		var timeScale = d3.scaleLinear().range([0,width]);

		var yScale = d3.scaleLinear()
			.range([0,height-100]);
		var xAxis = d3.axisBottom()
			.scale(xScale)
			// .scale(timeScale)
			// .orient("bottom")
			.tickValues([]);

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

		this.gBarChart.append("g")
			.attr("class","xAxis")
			// .attr("transform","translate(0,"+this.height+")");

		this.gBarChart.append("g")
			.attr("class","yAxis")
			;

		var textYPos = -10;
		var xMovement = -(this.width)*0.02;
		var yMovement = 5;

		// this.gBarChart.append("text")
		// 	.attr("transform","translate("+this.width*3.0/4.0+"," + textYPos+")")
		// 	.text(this.titleText);
		// this.gBarChart.append("text")
		// 	.attr("transform","translate("+xMovement+","+yMovement+") rotate(-90)")
		// //	.attr("transform","translate(-5,-5)")
		// 	.text("Topics")
		// 	.style("text-anchor","end")
		this.gBarChart.append("text")
			// .attr("transform","translate("+this.width*7/10.0+","+(this.height+30)+")")
			.attr("transform","translate("+this.width*9/10.0+","+(-10)+")")
			.text("Actions");
	},
	updateData:function(data,filterFlag,sortingFlag,customizedOrdering){
		this.data = data;

		if(!filterFlag){
			this.lastData = data
		}

		this.matrix = data

		this.xNum = d3.entries(data[0]).length;
		this.yNum = data.length;

		this.preprocessData(sortingFlag,customizedOrdering);
		this.update();
	},
	refresh:function(fillColor){
		this.fillColor = fillColor 
		this.update();
		this.highlightData(this.highlightingData)
	},
	resetData:function(){
		// this.data = this.lastData
		this.updateData(this.lastData)
		this.highlightData(this.highlightingData)

	},
	calculateSimilarity:function(){
		var data = this.data;
		var matrix = []

		var len = data.length;
		for(var i=0;i<len;i++){
			var rows = []
			for(var j=0;j<len;j++){
				rows.push({i:i,j:j,dis:-1})
			}
			matrix.push(rows)
		}

		for(var i=0;i<data.length;i++){
			var currentData = data[i]
			for(var j=i+1;j<data.length;j++){
				var distance = 0
				var lens = currentData.length;
				for(var k=0;k<lens;k++){
					var val1 = currentData[k].value;
					var val2 = data[j][k].value;
					distance+= Math.abs(val1-val2)
				}
				matrix[i][j].dis = distance
				matrix[j][i].dis = distance
				// matrix[i][j] = {i:i,j:j,dis:distance}
				// matrix[j][i] = {i:j,j:i,dis:distance};
			}
			// matrix[i][i] = {i:i,j:i,dis:-1}
		}

		var sortedData = []
		var counting = data.length;
		sortedData.push(data[0]) //default one
		sortedFlag = {"0":true}
		var currentIndex = 0
		while(counting){
			var dupList = []
			for(var i=0;i<matrix[currentIndex].length;i++){
				dupList.push(matrix[currentIndex][i])
			}
			dupList.sort(function(a,b){
				return a.dis - b.dis
			})
			var flag = false;
			for(var i=0;i<dupList.length;i++){
				if(dupList[i].dis!=-1 && !sortedFlag[dupList[i].j]){
					sortedData.push(data[dupList[i].j])
					currentIndex = dupList[i].j
					sortedFlag[dupList[i].j] = true
					flag = true;
					counting--
					break;
				}
			}
			if(!flag){
				break;
			}
		}

		this.data = sortedData
	},
	sortingDataFix:function(dataOrder){
	    var actionIndex = {}
	    var data = this.data;

	    if(!data.length){
	    	return
	    }
	    for(var i=0;i<data[0].length;i++){
	        // actionOrders.push(matrixView.data[0][i].key)
	        actionIndex[data[0][i].key] = i
	    }

	    var newData = []
	    for(var i=0;i<data.length;i++){
	    	var newRow = []
	    	for(var j=0;j<dataOrder.length;j++){
	    		newRow.push(data[i][actionIndex[dataOrder[j].key]])
	    	}
			newRow.topicIndex = data[i].topicIndex;
			newRow.ldaIndex = data[i].ldaIndex;
			newRow.rawID = data[i].rawID;
			newRow.matrixIndex = data[i].matrixIndex
			newRow.info = data[i].info
			newData.push(newRow)	    	
	    }

	    this.data = newData

   	},
	sortingData:function(){
		var data = this.data;

		var xKeyMapping = {}

		var count = 0
		for(var j=0;j<data[0].length;j++){
			xKeyMapping[j] = {index:j, xKey:data[0][j].key, yKeys:[], maxVal:-1, yIndex:null}
		}
		for(var i=0;i<data.length;i++){
			var yKey = i;
			for(var j=0;j<data[i].length;j++){
				xKeyMapping[j].yKeys[yKey] = data[i][j].value
				if(xKeyMapping[j].maxVal<data[i][j].value){
					xKeyMapping[j].maxVal = data[i][j].value
					xKeyMapping[j].yIndex = yKey;
				}
			}
		}

		var xKeyMappingList = d3.entries(xKeyMapping)

		xKeyMappingList.sort(function(a,b){
			if(b.value.yIndex!=a.value.yIndex){
				return a.value.yIndex - b.value.yIndex
			}else{
				return b.value.maxVal - a.value.maxVal;
			}
		})
//here there is a refresh operation.  take care..
		var newData = []
		for(var i=0;i<data.length;i++){
			var newRow = []
			for(var j=0;j<xKeyMappingList.length;j++){
				data[i][xKeyMappingList[j].value.index].belongYIndex = xKeyMappingList[j].value.yIndex;
				newRow.push(data[i][xKeyMappingList[j].value.index])
				// newRow[xKeyMappingList[j].key] = xKeyMappingList[j].value.yKeys[i]
			}
			newRow.topicIndex = data[i].topicIndex;
			newRow.ldaIndex = data[i].ldaIndex;
			newRow.rawID = data[i].rawID;
			newRow.matrixIndex = data[i].matrixIndex
			newRow.info = data[i].info
			newData.push(newRow)
		}

		this.data = newData;


	},
	getHighlightingKey:function(){

		var xKeyMapping = {}
		var highlightKey = {}
		var hThreshold = 1

		var data = this.data

		for(var i=0;i<data.length;i++){
			var dupData = []

			for(var j=0;j<data[i].length;j++){
				xKeyMapping[data[i][j].key] = j
				dupData.push(data[i][j])
			}
			var xList = dupData.sort(function(a,b){
				return b.value - a.value
			})
			for(var j=0;j<d3.min([xList.length,hThreshold]);j++){
				highlightKey[xList[j].key] = xKeyMapping[xList[j].key]
			}
		}

		this.highlightKey = highlightKey
	},
	preprocessData:function(sortingFlag,customizedOrdering){



		var fillColor = this.fillColor


		var data = this.data;
		var xScale = this.xScale;
		var yScale = this.yScale;

		var yMapping = []
		for(var i=0;i<this.yNum;i++){
			yMapping.push(i)
		}
		var xMapping = []
		for(var i=0;i<this.xNum;i++){
			xMapping.push(i)
		}

		// yScale.domain([0,this.yNum-1])
		// xScale.domain([0,this.xNum-1])

		// yScale.domain(yMapping)
		// xScale.domain(xMapping)

		xScale.domain([0,this.xNum])
		yScale.domain([0,this.yNum])

		var xWidth = xScale(1)-xScale(0)
		var yHeight = Math.abs(yScale(1) - yScale(0))

		this.xWidth = xWidth
		this.yHeight = yHeight
		// var xWidth = xScale.bandwidth();
		// var yHeight = yScale.bandwidth();

		// var zScaleX = d3.scaleLinear().range([0,xWidth])
		// var zScaleY = d3.scaleLinear().range([0,yHeight])

		var maxVal = 0

		var allValues = []
		for(var i=0;i<data.length;i++){
			for(var j=0;j<data[i].length;j++){
				allValues.push(data[i][j].value)
				if(data[i][j].value>maxVal){
					maxVal = data[i][j].value
				}				
			}
		}


		// var newData = []

		// for(var i=0;i<data.length;i++){
		// 	for(var j in data[i]){
		// 		data[i][j] = +data[i][j]
		// 		if(data[i][j]>maxVal){
		// 			maxVal = data[i][j]
		// 		}				
		// 	}
		// 	var newList = d3.entries(data[i])
		// 	newData.push(newList)
		// }

		// var highlightKey = {}
		// var hThreshold = 5
		// for(var i=0;i<newData.length;i++){
		// 	for(var j=0;j<hThreshold;j++){
		// 		highlightKey[newData[i][j].key] = xKeyMapping[newData[i][j].key]
		// 	}
		// }

		// this.highlightKey = highlightKey


		if(!sortingFlag && !this.sortingAlready){
			this.calculateSimilarity();
			this.sortingData()			
		}else{
			this.sortingAlready = true;
			if(!this.sortingOrder){
				this.sortingOrder = this.data[0]
			}
			this.sortedData = this.data
		}

		if(this.sortingAlready){
			var addingIndex = 11
			// wired operation
			var dataIndex = {}
			for(var i=0;i<data.length;i++){
				dataIndex[data[i].rawID] = data[i]
			}
			var newData =[]
			if(globalDataOrder){
				for(var i=0;i<globalDataOrder.length;i++){
					newData.push(dataIndex[globalDataOrder[i].rawID])
				}					
				this.data = newData;
				data = newData
			}
			// var dataIndex = {}
			// var sortedData= this.sortedData
			// for(var i=0;i<sortedData.length;i++){
			// 	dataIndex[sortedData[i].rawID] = true
			// }
			// for(var i=0;i<data.length;i++){
			// 	if(!dataIndex[data[i].rawID]){
			// 		sortedData.splice(addingIndex,0,data[i])
			// 		break;
			// 	}
			// }
			// this.data = sortedData///wired operation ..
			this.sortingDataFix(this.sortingOrder)
		}

		// if(this.sortingAlready){
		// 	this.calculateSimilarity()
		// }


		this.getHighlightingKey()

		var data = this.data;

		// allValues.sort(function(a,b){
		// 	return b - a
		// })
		// var xDomain = []
		// var count = 0
		// xDomain.push(maxVal)
		// var xRange = []
		// xRange.push(1)
		// for(var i=0;i<allValues.length;i++){
		// 	if(count>=allValues.length/10.0){
		// 		count = 0;
		// 		xDomain.push(allValues[i])
		// 		xRange.push(xRange[xRange.length-1]-0.1)
		// 	}
		// 	count++
		// }
		// xDomain.push(0)
		// xRange.push(0)

		allValues.sort(function(a,b){
			return a - b
		})
		var q3 = d3.quantile(allValues,0.75)
		var q1 = d3.quantile(allValues,0.25)
		var k = 3;
		var boundary = q3+k*(q3-q1)
		// var zScale = d3.scaleLinear().domain([0,boundary,maxVal]).range([0,0.9,1])


		// var zScale = d3.scaleLinear().domain(xDomain).range(xRange)
		// var zScale = d3.scaleLinear().domain([0,maxVal/100,maxVal]).range([0,0.5,1])
		var zScale = d3.scaleLinear().domain([0,maxVal/10,maxVal]).range([0,0.9,1])

		// var zScale = d3.scaleLinear().domain([0,maxVal]).range([0,1])
		// if(dataIndex==0){
		// 	 zScale = d3.scaleLinear().domain([0,maxVal/10,maxVal]).range([0,0.9,1])
		// }

		// if(dataIndex==0){
		// 	zScale = d3.scalePow().exponent(0.3).domain([0,1]).range([0,1])
		// }
		// var zScale = d3.scalePow().exponent(0.3).domain([0,1]).range([0,1])
		// var zScale = d3.scalePow().exponent(0.3).domain([0,maxVal]).range([0,1])

		var dataBlocks = []
		var threshold = 0.0000;
		var index = 0
		for(var i=0;i<data.length;i++){
			var xIndex = 0
			for(var j=0;j<data[i].length;j++){
				if(data[i][j].value>threshold){
					dataBlocks.push({
						index:j,
						x:j,
						y:i,
						xType:data[i][j].key,
						yType:i,
						opacity:zScale(data[i][j].value),
						// color:fillColor(data[i][j].key),
						width:xWidth,
						height:yHeight,
						drawX:xScale(j),
						drawY:yScale(i),
						value:data[i][j].value,
						belongYIndex:data[i][j].belongYIndex,//depr
						rawID:data[i].rawID
					})
				}
				xIndex++;
			}
		}

		this.dataBlocks = dataBlocks

	},	
	// preprocessData:function(){

	// 	this.sortingData()


	// 	var fillColor = this.fillColor


	// 	var data = this.data;
	// 	var xScale = this.xScale;
	// 	var yScale = this.yScale;

	// 	var yMapping = []
	// 	for(var i=0;i<this.yNum;i++){
	// 		yMapping.push(i)
	// 	}
	// 	var xMapping = []
	// 	for(var i=0;i<this.xNum;i++){
	// 		xMapping.push(i)
	// 	}

	// 	// yScale.domain([0,this.yNum-1])
	// 	// xScale.domain([0,this.xNum-1])

	// 	yScale.domain(yMapping)
	// 	xScale.domain(xMapping)


	// 	var xWidth = xScale.bandwidth();
	// 	var yHeight = yScale.bandwidth();

	// 	// var zScaleX = d3.scaleLinear().range([0,xWidth])
	// 	// var zScaleY = d3.scaleLinear().range([0,yHeight])

	// 	var maxVal = 0

	// 	var xKeyMapping = {}
	// 	var newData = []
	// 	for(var i=0;i<data.length;i++){
	// 		var count = 0
	// 		for(var j in data[i]){
	// 			xKeyMapping[j] = count++
	// 			if(data[i][j]>maxVal){
	// 				maxVal = data[i][j]
	// 			}
	// 		}
	// 		var xList = d3.entries(data[i]).sort(function(a,b){
	// 			return b.value - a.value
	// 		})
	// 		newData.push(xList)
	// 	}

	// 	var highlightKey = {}
	// 	var hThreshold = 5
	// 	for(var i=0;i<newData.length;i++){
	// 		for(var j=0;j<hThreshold;j++){
	// 			highlightKey[newData[i][j].key] = xKeyMapping[newData[i][j].key]
	// 		}
	// 	}

	// 	this.highlightKey = highlightKey


	// 	// var zScale = d3.scaleLinear().domain([0,maxVal]).range([0,1])
	// 	var zScale = d3.scalePow().exponent(1).domain([0,maxVal]).range([0,1])

	// 	var dataBlocks = []
	// 	var threshold = 0.0000;
	// 	var index = 0
	// 	for(var i=0;i<data.length;i++){
	// 		var xIndex = 0
	// 		for(var j in data[i]){
	// 			if(data[i][j]>threshold){
	// 				dataBlocks.push({
	// 					index:index++,
	// 					x:xIndex,
	// 					y:i,
	// 					xType:j,
	// 					yType:i,
	// 					opacity:zScale(data[i][j]),
	// 					color:fillColor(j),
	// 					width:xWidth,
	// 					height:yHeight,
	// 					drawX:xScale(xIndex),
	// 					drawY:yScale(i),
	// 					value:data[i][j]
	// 				})
	// 			}
	// 			xIndex++;
	// 		}
	// 	}

	// 	this.dataBlocks = dataBlocks

	// },
	update:function(){

		var dataBlocks =  this.dataBlocks

		var _this = this;

		var gBarChart = this.gBarChart;
		gBarChart.select(".xAxis").call(this.xAxis);
		gBarChart.select(".yAxis").call(this.yAxis);

		var sel = gBarChart.selectAll("g.bar")
			.data(dataBlocks,function(d){
				return d.xType +"," + d.yType;
			})
		var enter = sel.enter()
			.append("g")
			.attr("class","bar");
		enter.append("rect").attr("class","matrixBlock");
		enter.append("title");

		enter.merge(sel)
			.select("rect")
			.attr("width",function(d){
				return d.width;
			})
			.attr("height",function(d){
				return d.height;
			})
			.attr("x",function(d){
				return d.drawX;
			})
			.attr("y",function(d){
				return d.drawY;
			})
			.style("fill",function(d){
				return _this.fillColor(d.xType)
				// return d.color
			})
			.style("fill-opacity",function(d){
				return d.opacity
			})
			.style("stroke-width",0.3)
			.style("stroke","none")
			.on("mouseover",function(d){
				hoveringNotification(d.rawID,null,d.xType)
				 // _this.hoveringMethod(d.rawID,null,d.xType)
			})
			.on("mouseout",function(d){
				hoveringNotification(d.rawID,true,d.xType)
				// _this.hoveringMethod(d.rawID,true,d.xType)
			})



		enter.merge(sel)
			.select("title")
			.text(function(d){
				return d.xType+","+d.yType+": " +d.value+"\n"+"Belong: Topic "+d.rawID+", Tasks - "+actionGroupMapping[d.xType];
				// return d.xType+","+d.yType+": " +d.value+"\n"+"Belong: Topic "+d.belongYIndex+", Tasks - "+actionGroupMapping[d.xType];
			})

		sel.exit().remove();

		this.drawLabel()
		this.updateBrush();
	},
	hoveringMethod:function(rawID, offFlag, columnID){

		var data = this.highlightingData
		var highlightingIndex = {}
		for(var i=0;i<data.length;i++){
			highlightingIndex[data[i].rawID] = true
		}

        var nodesSel = this.gBarChart.selectAll("g.bar")
        	.filter(function(d){
        		return (d.rawID==rawID || (columnID && d.xType==columnID))
        	})
        nodesSel.select("rect").style('stroke', function(d){
        	if(!offFlag){
        		d.tempStroke = d3.select(this).style("stroke")
        		return "red"
        	}else{
        		if(highlightingIndex[d.rawID]){
        			return "black"
        		}else{
        			return "none"
        		}
        		// return "none"
        		// return d.tempStroke
        	}
        })		
	},
	highlightData:function(data){
		this.highlightingData = data
		var highlightingIndex = {}
		for(var i=0;i<data.length;i++){
			highlightingIndex[data[i].rawID] = true
		}

        var nodesSel = this.gBarChart.selectAll("g.bar")
        	.filter(function(d){
        		return highlightingIndex[d.rawID]
        	})

        nodesSel.select("rect").style('stroke', function(d){
        	return "black"
        })			
	},
	updateBrush:function(){
		var width = this.width;
		var height = 100;

		var data = this.data;

		_this = this
		var xScale = this.xScale
		var yScale = this.yScale

		var brush = d3.brushX()
		    .extent([[0, 0], [width, height]])
		    .on("end", brushed);

		var brushY = d3.brushY()
			.extent([[0,0],[this.x,this.height]])
			.on("end", brushYEnd)

		this.gBarChart.selectAll("g.brush").remove()

		this.gBarChart.append("g")
	      .attr("class", "brush")
	      .attr("transform","translate("+0+","+(this.height-100)+")")
	      .call(brush)
	      // .call(brush.move, x.range());

//create brush function redraw scatterplot with selection
		function brushed() {
		  var selection = d3.event.selection;
		  if (!d3.event.selection) {
		  	_this.resetData()
		  	console.log('There is no selection');
		  	return;
		  }  

		  var d = selection.map(xScale.invert)

		  _this.updateDataByBrushX(d)

		  console.log(selection)

		}
		function brushYEnd() {
		  var selection = d3.event.selection;
		  if (!d3.event.selection) {
		  	_this.updateDataByBrushY(yScale.domain(),true)
		  	// _this.resetData()
		  	console.log('There is no selection');
		  	return;
		  }  

		  var d = selection.map(yScale.invert)

		  _this.updateDataByBrushY(d)

		  console.log(selection)

		}
		this.gBarChart.append("g")
	      .attr("class", "brush")
	      .attr("transform","translate("+(-1*_this.x)+","+0+")")
	      .call(brushY)



	},
	updateDataByBrushY:function(yRange,reset){
		var data = this.data;
		if(reset){
			data = this.lastData
		}
		var newData = []
		var operation = this.operation

		for(var i=0;i<data.length;i++){

			if(operation=="select"){
				if(i>=yRange[0] && i<=yRange[1] || reset){
					newData.push(data[i])
				}
			}else{
				if(!(i>=yRange[0] && i<=yRange[1] || reset)){
					newData.push(data[i])
				}				
			}


		}

		if(!newData.length){
			return;
		}

		var editingFlag = notifyDataFiltering(newData)
		if(editingFlag){
			return;
		}

		this.updateData(newData,true)
		this.highlightData(this.highlightingData)

	},
	updateDataByBrushX:function(xRange){
		var data = this.data;
		var newData = []
		var operation = this.operation

		for(var i=0;i<data.length;i++){
			var newRow = []
			for(var j=0;j<data[i].length;j++){

				if(operation=="select"){
					if(j>=xRange[0] && j<=xRange[1]){
						newRow.push(data[i][j])
					}				
				}else{
					if(!(j>=xRange[0] && j<=xRange[1])){
						newRow.push(data[i][j])
					}
				}
			}

			if(!newRow.length){
				return;
			}

			newRow.topicIndex = data[i].topicIndex;
			newRow.ldaIndex = data[i].ldaIndex;
			newRow.rawID = data[i].rawID;
			newRow.matrixIndex = data[i].matrixIndex;
			newRow.info = data[i].info

			newData.push(newRow)

		}

		this.updateData(newData,true)
		this.highlightData(this.highlightingData)

	},
	drawLabel:function(){
		var labelData = this.highlightKey;
		var labelDataItems = d3.entries(labelData)
		var height = this.yScale.range()[this.yScale.range().length-1]

		var xScale = this.xScale;

		var _this = this;

		var gBarChart = this.gBarChart;

		var sel = gBarChart.selectAll("text.xLabel")
			.data(labelDataItems,function(d){
				return d.key
			})

		var enter = sel.enter().append("text")
			.attr("class","label xLabel")

		enter.merge(sel)
			.attr("transform",function(d){
				var x = xScale(d.value)
				var y = height + 5
				return "translate("+[x,y]+") rotate(45)"
			})
			.text(function(d){
				return d.key
			})
			.style("text-anchor","start")
		  	.style("pointer-events","none")

		sel.exit().remove();



		var yLabelData = this.data;
		var yScale = this.yScale;
		var _this = this;

		var sampledYLabelIndex = {}
		var accY = 0
		for(var i=0;i<yLabelData.length;i++){
			var y = yScale(i);
			if(y>=accY){
				sampledYLabelIndex[i] = true
				accY = y+_this.yHeight/2.0+8
			}
		}

		var selY = gBarChart.selectAll("text.yLabel")
			.data(yLabelData,function(d){
				return d.ldaIndex + "," + d.topicIndex
			})

		var enterY = selY.enter().append("text")
			.attr("class","label yLabel")

		enterY.merge(selY)
			.attr("transform",function(d,i){
				var x = -2;
				// var y = yScale(i) + yScale.bandwidth()
				var y = yScale(i) + _this.yHeight

				return "translate("+[x,y]+")"
			})
			.text(function(d){
				return d.rawID
				// return "LDA" + d.ldaIndex +"-T"+d.topicIndex
			})
			.style("opacity",function(d,i){
				if(sampledYLabelIndex[i]){
					return 1.0
				}else{
					return 0.0
				}
			})
			.style("font-size","8px")
			.style("text-anchor","end")
		  	.style("pointer-events","none")

		selY.exit().remove()
	}
}
