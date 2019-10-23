

var TopicPanel = function(svgName,pos,colorSet,id,titleText,parent){//x,y,idlist = key,value,idList
	//this.svgName = gSVGName;
	//this.data = data;
	this.width = pos.width;
	this.height = pos.height;
	this.x = pos.x;
	this.y = pos.y;
	this.titleText = titleText;
	var margin = pos.margin;

	this.colorSet = colorSet

	this.vis = d3.select("#"+svgName).append("g")
		.attr("class","documentPanel")
		.attr("transform","translate("+this.x+","+this.y+")");


	this.id = id;
	this.parent = parent;

	this.showType = "people";//content, people

	this.medoidFinished = false;
	this.medoidReset = false;
	this.medoids = []
	this.currentMedoid = null;

	this.finished = false;
	this.updated = false;
	this.init();
	this.lastHighlight = null;

	this.extendingThreshold = 0.5
	//this.preprocessData();	
}

// function notifyHistogramFilter(data,dataSel,isPair){
// 	linkFilter.updateData(data,dataSel,isPair);
// }

// function notifyKeywordsSelection(data){
// 	myCircos.circularWidget.updateClickUserData(data.data);
// }

TopicPanel.prototype = {
	init: function(){
		this.vis.select("text").remove();

		var width = this.width;
		var height = this.height;

		var xScale = d3.scaleLinear().range([0,width],0.1);
//		var xScale = d3.scale.linear().range([0,width]);

		var yScale = d3.scaleLinear()
			.range([0,height])
//			.range([height,0]);

		this.xScale = xScale;
		this.yScale = yScale;
		this.resetPolyBrush()
	
	},
	updateDocument:function(dataSource){
		var _this = this;
		this.finished = false;
		function runProjection(data,matrix){
			_this.dataList = data
			// for(var i=0;i<data.length;i++){
			// 	data[i].matrixIndex = i;
			// }
			_this.distanceMatrix = matrix;
			// console.log(data,matrix)
			onmessage({data:{distance:matrix,cmd:"init"},obj:_this})
			_this.finished = true;
		}
		// this.dataList = dataList;
		this.dataSource = dataSource
		preprocessTopics(dataSource,runProjection);

	},
	updateDocumentMDS:function(dataSource){
		this.dataSource = dataSource
		var _this = this;
		this.finished = false;

		function runProjection(data,matrix){
			_this.dataList = data
			
			// for(var i=0;i<data.length;i++){
			// 	data[i].matrixIndex = i;
			// }
			_this.distanceMatrix = matrix;

			var pointPos = numeric.transpose(mds.classic(matrix))
			console.log(pointPos)
			// _this.updateData(pointPos,true)

			for(var i=0;i<data.length;i++){
				data[i].projPos = [pointPos[0][i],pointPos[1][i]]
			}

			_this.preprocessData(true)
		}

		preprocessTopics(dataSource,runProjection)
	},
	refresh:function(colorSet,selectedActionIndex){
		this.updated = false;
		this.colorSet = colorSet
		var data = this.dataList
		var selected = d3.entries(selectedActionIndex).length?true:false;
		if(selected){
			for(var i=0;i<data.length;i++){
				calculatingRepresentativeColorGroup(data[i],selectedActionIndex)
			}			
		}else{
			for(var i=0;i<data.length;i++){
				calculatingRepresentiveActionGroup(data[i],actionGroupMapping)
			}			
		}

		this.drawPie(true);
		this.highlightMedoids();
	},
	updateData:function(data,finishFlag){

		console.log("finishFlag",finishFlag)

		if(!data){
			data = this.lastData;
		}
		this.lastData = data;
		// this.data = data;
		// this.rawKeywords = keywords;

		if(this.updated && this.showType=="people"  && data.length && data[0].kPos){
			return;//....
		}

		if(this.showType=="people" && data.length && data[0].kPos){
			finishFlag = true;//....
		}

		var dataList = this.dataList;
		for(var i=0;i<dataList.length;i++){
			dataList[i].projPos = data[i];
		}

		this.preprocessData(finishFlag);

		if(finishFlag){
			// var id = dataList[0].index;
			// var nodes = {}
			// nodes[id] = true;

			// this.highlightNode(nodes)

		}
		if(!this.updated){
			this.updated = true;
		}

		// this.drawKeywords();
	},
	preprocessData:function(finishFlag){
		var xScale = this.xScale;
		var yScale = this.yScale;

		var data = this.dataList;

		if(this.showType == "people" && data.length && data[0].kPos){
			for(var i=0;i<data.length;i++){
				data[i]._projPos = data[i].kPos;
			}
			// finishFlag = true;
		}else{ //if(this.showType == "content"){
			for(var i=0;i<data.length;i++){
				data[i]._projPos = data[i].projPos;
			}
		}


		xScale.domain(d3.extent(data.map(function(d){
			return d._projPos[0];
		})))
		yScale.domain(d3.extent(data.map(function(d){
			return d._projPos[1];
		})))

		// this.draw(finishFlag);
		this.drawPie(finishFlag);

		if(finishFlag){
			this.updatePolyBrush();
			// this.addPolyBrush();
		}

	},
	// preDraw:function(){

	// },
	// refresh:function(colorSet){
	// 	this.colorSet = colorSet
	// 	this.drawPie();
	// },
	// draw:function(){
	// 	var data = this.dataList;
	// 	var xScale = this.xScale;
	// 	var yScale = this.yScale;

	// 	var vis = this.vis;

	// 	var _this = this

	// 	// var sizeMapping = d3.scaleLinear().domain(d3.extent(data.map(function(d){
	// 	// 	return d.info.frequencySum
	// 	// }))).range([3,8])

	// 	var sel = vis.selectAll("g.tsnePoint")
	// 		.data(data,function(d){
	// 			return d.ldaIndex+","+d.topicIndex;
	// 		})

	// 	var enter = sel.enter().append("g")
	// 		.attr("class","tsnePoint")

	// 	enter.append("circle")
	// 		.attr("class","tsneCircle")
	// 		.style("fill",function(d){
	// 			// return "blue"
	// 			return _this.colorSet(d.info.majorGroup)
	// 			return fillColor(d.mainCategory);
	// 			return fillColor(d.category);
	// 		})
	// 		.style("stroke","white");
	// 	enter.append("title");

	// 	enter.merge(sel).select("circle")
	// 		// .transition()
	// 		.attr("cx",function(d){
	// 			var x = xScale(d._projPos[0]);
	// 			return x;
	// 		})
	// 		.attr("cy",function(d){
	// 			var y = yScale(d._projPos[1]);
	// 			return y;
	// 		})
	// 		.attr("r",function(d){
	// 			return 5
	// 			return sizeMapping(d.info.frequencySum)
	// 		})
	// 		// .attr("r",3)
	// 		.style("fill",function(d){
	// 			return _this.colorSet(d.info.majorGroup)

	// 			return fillColor(d.mainCategory);

	// 			return fillColor(d.category);
	// 		})
	// 		// .style("stroke",function(d){
	// 		// 	if(d.seriesId.series==1){
	// 		// 		return "black"
	// 		// 	}else{
	// 		// 		return "white"
	// 		// 	}
	// 		// })
		
	// 	sel.on("click",function(d){
	// 			notifyMultiTreeSelectionByClicking(d,true)
	// 		})
	// 		// .style("stroke","white")

	// 	enter.merge(sel).select("title")
	// 		.text(function(d){

	// 			return "LDA " + d.seriesId.series + ", Topic: "+d.seriesId.topic
	// 			;
	// 		})

	// 	sel.exit().remove()

	// 	// this.circleSel = circleSel


	// },
	drawPie:function(){
		var data = this.dataList;
		var xScale = this.xScale;
		var yScale = this.yScale;

		var vis = this.vis;

		var _this = this

		// var sizeMapping = d3.scaleLinear().domain(d3.extent(data.map(function(d){
		// 	return d.info.frequencySum
		// }))).range([3,8])

		var pie = d3.pie()
			.sort(null)
			.value(function(d){
				return d.value.frequency
			})

		var arcPath = d3.arc()
			.outerRadius(8)
			.innerRadius(0)

		var sel = vis.selectAll("g.tsnePoint")
			.data(data,function(d){
				return d.ldaIndex+","+d.topicIndex;
			})

		var enter = sel.enter().append("g")
			.attr("class","tsnePoint")

		enter.append("g")
			.attr("class","tsneCircle")

		enter.append("title");

		enter.merge(sel).select("g")
			.attr("transform",function(d){
				 var x = xScale(d._projPos[0]);
				 var y = yScale(d._projPos[1]);
				 return "translate("+[x,y]+")";
			})
			.each(function(d){
				var cData = pie(d.info.groupCategories)
				var cVis = d3.select(this)
				var gSel = cVis.selectAll("g.arc")
					.data(cData,function(dd){
						return dd.key
					})

				var gEnter = gSel.enter().append("g")
					.attr("class","arc")

				gEnter.append("path")

				gEnter.merge(gSel).select("path")
					.attr("d",arcPath)
					.style("fill",function(dd){
						return _this.colorSet(dd.data.key)
					})
					.style("stroke","white")
					.on("mousedown",function(dd){
						console.log("clicked",d)
						_this.extendSelectionByClicking(d)

				        //in case of sync problem
				        d.tempStroke = d3.select(this).style("stroke")

					})
					.on("mouseover",function(dd){
						hoveringNotification(d.rawID)
						// _this.hoveringMethod(d.rawID)
					})
					.on("mouseout",function(dd){
						hoveringNotification(d.rawID,true)
						// _this.hoveringMethod(d.rawID,true)
					})
					// .style("stroke-width","0.5")


				gSel.exit().remove()
			})

		
		var f = d3.format(".000%")

		enter.merge(sel).select("title")
			.text(function(d){
				var str = ""
				var newCategories = []
				for(var i=0;i<d.info.groupCategories.length;i++){
					newCategories.push(d.info.groupCategories[i])
				}
				newCategories.sort(function(a,b){
					return b.value.frequency - a.value.frequency
				})
				for(var i=0;i<newCategories.length;i++){
					if(newCategories[i].value.frequency<0.01){
						str+="..."
						break;
					}
					str+=newCategories[i].key
					str+=": "
					str+=f(+newCategories[i].value.frequency)
					str+="\n"
				}				
				return "LDA " + d.seriesId.series + ", Topic: "+d.seriesId.topic
				+"\n"+str;
			})

		sel.exit().remove()

		// this.circleSel = circleSel


	},	
	resetPolyBrush:function(){
		// this.polyBrush = new PolyBrush(this.vis);
		var flag = true;
        if (flag) {
            this.vis.select("rect.lassoRect").style("pointer-events", "all")
            this.vis.select("g.lasso").style("visibility", "visible")
        } 		
	},
	updatePolyBrush:function(){
        var _this = this

        var physSVG = this.vis
        // var nodesSel = physSVG.selectAll("g.tsnePoint").select("circle")
        var nodesSel = physSVG.selectAll("g.tsnePoint").select("g")

        // var nodesSel = this.circleSel

        physSVG.select("rect.lassoRect").remove()
        physSVG.select("g.lasso").remove()

        var xScale = this.xScale
        var yScale = this.yScale

        var width = this.width;
        var height = this.height;

        var rect = physSVG
        	// .append("rect")
        	.insert("rect",":first-child")
            .attr("class", "lassoRect")
            .attr("x", xScale[0])
            .attr("y", yScale[0])
            .attr("width", width)
            .attr("height", height)
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
                .style("fill-opacity", 1.0)

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
                .style("fill-opacity", 1.0)
                // .attr("r",7);

            // Reset the style of the not selected dots
            lasso.notSelectedItems()
                .style("fill-opacity", 0.2)
                // .attr("r",3.5);


            var filteredNodeData = lasso.selectedItems().data()

            var currentMedoid = null;
            if (!filteredNodeData.length) {
                filteredNodeData = lasso.notSelectedItems().data();
                _this.currentMedoid = null
                //select nothing, select all
            }else{
            	currentMedoid = _this.calculateMedoid(filteredNodeData)


            	_this.checkMedoidOverlapping(currentMedoid)

            	// for(var i=0;i<medoids.length;i++){
            	// 	if(medoids[i].ldaIndex==currentMedoid.ldaIndex && medoids[i].topicIndex == currentMedoid.topicIndex){
            	// 		existingFlag = true;
            	// 		break;
            	// 	}
            	// }

            	if(!_this.medoidReset){
            		_this.medoids.push(currentMedoid)
            	}
            	_this.currentMedoid = currentMedoid
            }
            _this.highlightMedoids()
            notifyDataSelection(filteredNodeData)
            // var selectedMessages = {}

            // for (var i = 0; i < filteredNodeData.length; i++) {
            //     for (var j = 0; j < filteredNodeData[i].value.weiboData.length; j++) {

            //         //shouldn't be like this..
            //         if (selectedMessages[filteredNodeData[i].value.weiboData[j].data.mid]) {
            //             continue;
            //         }
            //         filteredData.push(filteredNodeData[i].value.weiboData[j])
            //         selectedMessages[filteredNodeData[i].value.weiboData[j].data.mid] = filteredNodeData[i].value.weiboData[j]

            //     }
            // }
            // notifyDataSelection(filteredData)
            // _this.selectedMessages = {}

            if (!lasso.selectedItems().data().length) {
                lasso.notSelectedItems()
                    .style("fill-opacity", 1.0)
                // _this.updateKeywordsOnDemand(physSVG, [], h)
            } else {
                // _this.updateKeywordsOnDemand(physSVG, filteredNodeData, h)
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
	// //depr
	// updatePolyBrush:function(){
	// 	var data = this.dataList;
	// 	var xScale = this.xScale;
	// 	var yScale = this.yScale;

	// 	function filterPoints(data,brush){
	// 		// var filteredData = [];
	// 		var filteredDataIndex = {}
	// 		for(var i=0;i<data.length;i++){
	// 			if(brush.isWithinExtent(xScale(data[i]._projPos[0]),yScale(data[i]._projPos[1]))){
	// 				// filteredData.push(data[i].index);
	// 				filteredDataIndex[data[i].index]=true;
	// 			}
	// 		}
	// 		// console.log(filteredData);
	// 		return filteredDataIndex;
	// 	}

	// 	// var pos = {height:this.pos.height};
	// 	// pos.height = this.pos.height*5.0/3.0;
	// 	// console.log(pos.height)

	// 	// this.polyBrush = new PolyBrush(this.vis);

	// 	var _this = this;
	// 	function onBrush(e){
	// 		console.log(e);
	// 		_this.filteredStartEndTime = e;
	// 		// _this.parent.updateDetail(e,false,1);
	// 	}

	// 	function onBrushFinished(brush){
	// 		// console.log(e,"finish")

	// 		var filteredPoints = filterPoints(data,brush)
	// 		notifyMultiTreeSelection(filteredPoints,true);
			
	// 		// _this.filteredStartEndTime = e;
	// 		// if(flag){
	// 		// 	_this.filteredStartEndTime = null;
	// 		// 	e = _this.xScale.domain();
	// 		// 	// _this.parent.updateDetail(e,flag,2);
	// 		// }
	// 	}

	// 	this.polyBrush.init({},this.xScale,this.yScale,onBrush,onBrushFinished);

	// },
	checkMedoidOverlapping:function(currentMedoid){
		var _this = this;
    	var medoids = _this.medoids
    	var medoidIndex = {}

    	for(var i=0;i<medoids.length;i++){
    		var id = medoids[i].ldaIndex+","+medoids[i].topicIndex
    		medoidIndex[id] = 1;
    	}
    	var groupData = currentMedoid.groupData

    	for(var i=0;i<groupData.length;i++){
    		var id = groupData[i].ldaIndex+","+groupData[i].topicIndex;
    		if(medoidIndex[id]){
    			medoidIndex[id] = 2;
    		}
    	}

    	var newMedoids = []
    	for(var i=0;i<medoids.length;i++){
    		var id = medoids[i].ldaIndex+","+medoids[i].topicIndex
    		if(medoidIndex[id]!=2){
    			newMedoids.push(medoids[i])
    		}
    	}
    	_this.medoids = newMedoids;
	},
	editCurrentMedoids:function(groupData){
		if(!this.currentMedoid){
			return false;
		}
		var _this = this;

		var groupDataIndex = {}
		for(var i=0;i<groupData.length;i++){
			groupDataIndex[groupData[i].rawID] = true;
		}

		var newMedoid = this.calculateMedoid(groupData);

		var medoids = this.medoids;
		var ldaIndex = this.currentMedoid.ldaIndex
		var topicIndex = this.currentMedoid.topicIndex


		for(var i=0;i<medoids.length;i++){
			if(medoids[i].ldaIndex==ldaIndex && medoids[i].topicIndex==topicIndex){
				medoids.splice(i,1)
				break;
			}
		}

		this.checkMedoidOverlapping(newMedoid)

    	if(!_this.medoidReset){
    		_this.medoids.push(newMedoid)
    	}

        _this.highlightMedoids()

		this.highlightTopics(groupDataIndex,true)

        // notifyDataSelection(groupData,true)

        this.currentMedoid = newMedoid

        return true;

	},
	extendSelectionByClicking:function(clickedData){
		var data = this.dataList
		var matrix = this.distanceMatrix

		var _this = this;

		var dataIndex  = {}
		for(var i=0;i<data.length;i++){
			dataIndex[data[i].matrixIndex] = data[i]
		}


		var matrixItem = matrix[clickedData.matrixIndex]

		var maxDisValue = d3.max(matrixItem.map(function(d){
			return d
		}))

		var threshold = this.extendingThreshold

		threshold = threshold*maxDisValue;


		var filteredData = []
		var filteredDataIndex = {}

		for(var i=0;i<matrixItem.length;i++){
			if(matrixItem[i]<=threshold){
				filteredData.push(dataIndex[i])
				filteredDataIndex[dataIndex[i].rawID] = true
			}
		}

		var currentMedoid = this.calculateMedoid(filteredData)

		this.checkMedoidOverlapping(currentMedoid)

    	if(!_this.medoidReset){
    		_this.medoids.push(currentMedoid)
    	}

        _this.highlightMedoids()

		this.highlightTopics(filteredDataIndex)

        // notifyDataSelection(filteredData)

        this.currentMedoid = currentMedoid


	},
	hoveringMethod:function(rawID,offFlag){

		var medoids = this.medoids

		var medoidIndex = {}
		for(var i=0;i<medoids.length;i++){
			medoidIndex[medoids[i].rawID] = true
		}
		// return
        var nodesSel = this.vis.selectAll("g.tsnePoint").select("g")
        	.filter(function(d){
        		return d.rawID==rawID
        	})
        	.each(function(d){
        		gotoFrontLayer($(this).parent())
        	})

        nodesSel.selectAll("g").select("path").style('stroke', function(d){
        	if(!offFlag){
        		// d.tempStroke = d3.select(this).style("stroke")
        		return "red"
        	}else{
        		if(medoidIndex[rawID]){
        			return "black"
        		}else{
        			return "white"
        		}

        		// return d.tempStroke
        	}
        })

        var medoids = this.medoids
        // var medoidIndex = {}

        var medoidFlag = false
        var groupData = []
        for(var i=0;i<medoids.length;i++){
        	// medoidIndex[medoids[i].rawID] = true
        	if(medoids[i].rawID==rawID){
        		medoidFlag = true
        		groupData = medoids[i].groupData
        		// break;
        	}
        }

        if(!medoidFlag){
        	return;
        }

        var groupIndex = {}
        for(var i=0;i<groupData.length;i++){
        	groupIndex[groupData[i].rawID] = true;
        }

        var nodesSel = this.vis.selectAll("g.tsnePoint").select("g")
        	.filter(function(d){
        		return groupIndex[d.rawID] && d.rawID!=rawID
        	})

        nodesSel.selectAll("g").each(function(d){
        	d3.select(this).select("path").style('stroke', function(d){
	        	if(!offFlag){
	        		// d.tempStroke = d3.select(this).style("stroke")
	        		// console.log(d.tempStroke)
	        		return "rgb(200,70,70)"
	        	}else{
	        		if(medoidIndex[d.rawID]){
	        			return "black"
	        		}else{
	        			return "white"
	        		}

	        		// return d.tempStroke
	        	}
        	})
        })

	},
	calculateMedoid:function(filteredData){
		var data = this.dataList;
		var matrix = this.distanceMatrix;

		var distanceIndex = []
		for(var i=0;i<filteredData.length;i++){
			var ma = []
			for(var j=0;j<filteredData.length;j++){
				ma.push(0)
			}
			distanceIndex.push(ma)
		}
		for(var i=0;i<filteredData.length;i++){
			var index = filteredData[i].matrixIndex
			for(var j=i+1;j<filteredData.length;j++){
				var tIndex = filteredData[j].matrixIndex
				var dis = matrix[index][tIndex]
				distanceIndex[i][j] = dis
				distanceIndex[j][i] = dis
			}
		}
		
		for(var i=0;i<distanceIndex.length;i++){
			var accDis = 0
			for(var j=0;j<distanceIndex[i].length;j++){
				accDis+=distanceIndex[i][j]
			}
			distanceIndex[i].accDis = accDis
		}
		var minDis = distanceIndex[0].accDis
		var minIndex = 0
		for(var i=0;i<distanceIndex.length;i++){
			var accDis = distanceIndex[i].accDis
			if(accDis<minDis){
				minDis = accDis
				minIndex = i
			}
		}
		console.log("medoid",filteredData[minIndex])


		filteredData[minIndex].groupData = filteredData;
		return filteredData[minIndex]

	},
	removeMedoid:function(ldaIndex,topicIndex){
		var medoids = this.medoids;
		for(var i=0;i<medoids.length;i++){
			if(medoids[i].ldaIndex==ldaIndex && medoids[i].topicIndex==topicIndex){
				medoids.splice(i,1)
				break;
			}
		}
		this.currentMedoid = null;
		this.highlightMedoids();
	},
	highlightMedoids:function(){
		var medoids = this.medoids
        // var nodesSel = this.vis.selectAll("g.tsnePoint").select("circle")
        var nodesSel = this.vis.selectAll("g.tsnePoint").select("g")

        nodesSel.selectAll("g").select("path").attr('filter', "None")
        nodesSel.selectAll("g").select("path").style('stroke', "white")

        var medoidIndex = {}
        for(var i=0;i<medoids.length;i++){
        	medoidIndex[medoids[i].ldaIndex+","+medoids[i].topicIndex] = true
        }


       	var allGroupedData = {}
       	for(var i=0;i<medoids.length;i++){
       		for(var j=0;j<medoids[i].groupData.length;j++){
       			var id = medoids[i].groupData[j].ldaIndex + ","+medoids[i].groupData[j].topicIndex;
       			allGroupedData[id] = medoids[i].groupData[j]
       		}
       	}

       var groupSel = nodesSel.filter(function(d){
        	if(allGroupedData[d.ldaIndex+','+d.topicIndex] && !medoidIndex[d.ldaIndex+','+d.topicIndex]){
        		return true
        	}else{
        		return false
        	}
        })

       groupSel.selectAll("g").select("path").attr('filter', 'url(#dropShadow)')



        // nodesSel.style("stroke",function(d){
        // nodesSel.select("path").style("stroke",function(d){
        // 	if(medoidIndex[d.ldaIndex+','+d.topicIndex]){
        // 		return "black"
        // 	}else{
        // 		return "white"
        // 	}
        // })

       var filteredSel = nodesSel.filter(function(d){
        	if(medoidIndex[d.ldaIndex+','+d.topicIndex]){
        		return true
        	}else{
        		return false
        	}
        })

       	filteredSel.selectAll("g").select("path").style("stroke","black")

       	filteredSel.each(function(d){
       		gotoFrontLayer($(this).parent())
       	})



	},
	highlightTopics:function(topicIndex,matrixFlag){

		var dataList = this.dataList;
		var highlightingTopics = []
		for(var i=0;i<dataList.length;i++){
			if(topicIndex[dataList[i].rawID]){
				highlightingTopics.push(dataList[i])
			}
		}

        var nodesSel = this.vis.selectAll("g.tsnePoint").select("g")
        nodesSel
		.classed("not_possible", false)
		.classed("possible", false)
		.style("fill-opacity", 0.2)

            // Style the selected dots
        nodesSel.filter(function(d){
        	return topicIndex[d.rawID]
        })
        .classed("selected", true)
        .style("fill-opacity", 1.0)
                // .attr("r",7);


        notifyDataSelection(highlightingTopics,matrixFlag)


		return highlightingTopics
	},
	highlightTopicsByTopics:function(topicIndexArray){
		console.log("selected Others",topicIndexArray)
		var threshold = 20;

		var index = {}
		for(var i=0;i<d3.min([topicIndexArray.length,threshold]);i++){
			index[topicIndexArray[i].key]= true
		}

		return this.highlightTopics(index)

	},
	visualizeTopics:function(selectedData){

	},
	highlightTopicsByRange:function(valueRange){
        // var nodesSel = this.vis.selectAll("g.tsnePoint").select("circle")
        var nodesSel = this.vis.selectAll("g.tsnePoint").select("g")

        var data = this.dataList;
        var selectedData = []
        for(var i=0;i<data.length;i++){
        	if(data[i].ldaIndex>=valueRange[0] && data[i].ldaIndex<=valueRange[1]){
        		selectedData.push(data[i])
        	}
        }

        nodesSel
		.classed("not_possible", false)
		.classed("possible", false)
		.style("fill-opacity", 0.2)

            // Style the selected dots
        nodesSel.filter(function(d){
        	return (d.ldaIndex>=valueRange[0] && d.ldaIndex<=valueRange[1])
        })
        .classed("selected", true)
        .style("fill-opacity", 1.0)
                // .attr("r",7);


        notifyDataSelection(selectedData)

        return selectedData


	},
	selectMedoidsAll:function(){
        var nodesSel = this.vis.selectAll("g.tsnePoint").select("g")

        var medoids = this.medoids

        if(!medoids.length){
        	return
        }

       var medoidIndex = {}
        for(var i=0;i<medoids.length;i++){
        	medoidIndex[medoids[i].ldaIndex+","+medoids[i].topicIndex] = true
        }

        nodesSel
		.classed("not_possible", false)
		.classed("possible", false)
		.style("fill-opacity", 0.2)

            // Style the selected dots
        nodesSel.filter(function(d){
        	return medoidIndex[d.ldaIndex+','+d.topicIndex]
        })
        .classed("selected", true)
        .style("fill-opacity", 1.0)
                // .attr("r",7);


        notifyDataSelection(medoids)

	},
	highlightNodeByKeywords:function(keywordsIndex,flag){

	},
	clickNodeByKeywords:function(keywordsIndex,flag){

	},
	drawKeywords:function(data){
	}
}

function calculatingRepresentativeColorGroup(topicData,selectedActionIndex){
	var data = {}
	for(var i=0;i<topicData.length;i++){
		var action = topicData[i].key;
		var group = selectedActionIndex[action]?action:"Others";
		if(!data[group]){
			data[group] = {frequency:0}
		}
		data[group].frequency+=topicData[i].value		
	}
	var dataList = d3.entries(data)
	dataList.sort(function(a,b){
		return b.value.frequency - a.value.frequency
	})

	delete data["Others"]
	var newDataList = d3.entries(data)

	newDataList.sort(function(a,b){
		return b.value.frequency - a.value.frequency
	})

	var sum = 0
	for(var i=0;i<newDataList.length;i++){
		sum+=newDataList[i].value.frequency
	}
	// console.log("frequency sum",sum)

	topicData.info = {majorGroup:newDataList[0].key,sum:sum,groupCategories:dataList,groupCategoriesRaw:newDataList}

}

function calculatingRepresentiveActionGroup(topicData,actionGroupMapping){
	var data = {}
	for(var i=0;i<topicData.length;i++){
		var action = topicData[i].key;
		var group = actionGroupMapping[action]
		if(!data[group]){
			data[group] = {frequency:0}
		}
		data[group].frequency+=topicData[i].value
	}
	var dataList = d3.entries(data)
	// dataList.sort(function(a,b){
	// 	return b.value.frequency - a.value.frequency
	// })

	var newDataList = []
	for(var i=0;i<dataList.length;i++){
		newDataList.push(dataList[i])
	}
	newDataList.sort(function(a,b){
		return b.value.frequency - a.value.frequency
	})

	var sum = 0
	for(var i=0;i<dataList.length;i++){
		sum+=dataList[i].value.frequency
	}
	// console.log("frequency sum",sum)

	topicData.info = {majorGroup:newDataList[0].key, groupCategories:dataList}

	// topicData.info = {majorGroup:dataList[0].key, groupCategories:d3.entries(data)}
}

//globally
// actionGroupMapping

function preprocessTopics(allTopics,callback){

	var matrix = []

	for(var i=0;i<allTopics.length;i++){
		var currentRow = []
		for(var j=0;j<allTopics.length;j++){
			currentRow.push(0)
		}
		matrix.push(currentRow)
	}

	var data = allTopics

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
			matrix[i][j] = distance
			matrix[j][i] = distance
			// matrix[i][j].dis = distance
			// matrix[j][i].dis = distance
			// matrix[i][j] = {i:i,j:j,dis:distance}
			// matrix[j][i] = {i:j,j:i,dis:distance};
		}
		// matrix[i][i] = {i:i,j:i,dis:-1}
	}

	callback(allTopics,matrix)

}



function gotoFrontLayer(dom){
    //dom.insertAfter(dom.parent());
    dom.appendTo(dom.parent());
}

function gotoBackLayer(dom){
	dom.prependTo(dom.parent())
}


// function preprocessKeywords(smData,callback){
	
//     var texts = []
//     for(var i=0;i<smData.length;i++){
//       var text = ""
//       if(smData[i].text){
//         text+= smData[i].text;
//         text+= " "
//       }
//       // text+= smData[i].key;
//       texts.push(text)
//     }


//     var stopIndex = {};
//     for(var i=0;i<stopKeyWords.length;i++){
//     	stopIndex[stopKeyWords[i]] = true;
//     }
//     stopCount = 0;

//     // var texts = [text];
//     var url = "http://vis.pku.edu.cn/weiboutil/text/split"
//     // var url = "http://162.105.71.185:8080/weiboutil/text/split"
//     $.ajax({
//       type: "POST",
//       url: url,
//       data: {
//         text: JSON.stringify(texts),
//         keyword:30,
//         weight:true,
//         weibo:true
//       },
//       timeout:50000,
//       crossDomain: true,
//       success: function(data) {
//         if(data.result[0]){
//           var drawData = data.result;
//           console.log(drawData);
//           for(var i=0;i<smData.length;i++){
//           	smData[i].words = drawData[i];
//           	smData[i].segments = "";
//           	for(var j=0;j<smData[i].words.length;j++){
//           		if(stopIndex[smData[i].words[j][0]]){
//           			stopCount++;
//           			continue;
//           		}
//           		if(!isNaN(parseInt(smData[i].words[j][0]))){
//           			stopCount++;
//           			continue;
//           		}
//           		smData[i].segments += smData[i].words[j][0];
//           		smData[i].segments += " ";
//           	}
//           }
//           // _this.processHighlightingBox_After();
//         }
//         var matrix = K_TfIDF.tfidf(smData);

//         callback(smData,matrix)

//   //       var thresholdNum = 10;
//   //       var thresholdVal = 0.4;
//   //       for(var i =0;i<matrix.length;i++){
//   //       	var entries = d3.entries(matrix[i]);
//   //       	entries.sort(function(a,b){
//   //       		return a.value-b.value;
//   //       	})
//   //       	smData[i].relatedNodes = [];
//   //       	for(var j=0;j<d3.min([thresholdNum,entries.length]);j++){
//   //       		if(entries[j].value<thresholdVal){
//   //       			smData[i].relatedNodes.push(smData[entries[j].key]);
//   //       		}
//   //       	}
//   //       	console.log(smData[i].segments,smData[i].relatedNodes)
//   //       }

// 		// detailSequence.updateData(gData)	

//       },
//       error: function() {
//       	console.log("err")
//     	// detailSequence.updateData(gData)	
//         // _this.processHighlightingBox_After();
// //        alert("Query Data Error!");
//         return null;
//       }
//     });

// }


// stopKeyWords = ["http","'s","a","able","about","above","abst","accordance","according","accordingly","across","act","actually","added","adj","affected","affecting","affects","after","afterwards","again","against","ah","all","almost","alone","along","already","also","although","always","am","among","amongst","an","and","announce","another","any","anybody","anyhow","anymore","anyone","anything","anyway","anyways","anywhere","apparently","approximately","are","aren","arent","arise","around","as","aside","ask","asking","at","auth","available","away","awfully","b","back","be","became","because","become","becomes","becoming","been","before","beforehand","begin","beginning","beginnings","begins","behind","being","believe","below","beside","besides","between","beyond","biol","both","brief","briefly","but","by","c","ca","came","can","cannot","cant","cause","causes","certain","certainly","co","com","come","comes","contain","containing","contains","could","couldnt","d","date","did","didnt","different","do","does","doesnt","doing","done","dont","down","downwards","due","during","e","each","ed","edu","effect","eg","eight","eighty","either","else","elsewhere","end","ending","enough","especially","et","etal","etc","even","ever","every","everybody","everyone","everything","everywhere","ex","except","f","far","few","ff","fifth","first","five","fix","followed","following","follows","for","former","formerly","forth","found","four","from","further","furthermore","g","gave","get","gets","getting","give","given","gives","giving","go","goes","gone","got","gotten","h","had","happens","hardly","has","hasnt","have","havent","having","he","hed","hence","her","here","hereafter","hereby","herein","heres","hereupon","hers","herself","hes","hi","hid","him","himself","his","hither","home","how","howbeit","however","hundred","i","id","ie","if","ill","im","immediate","immediately","importance","important","in","inc","indeed","index","information","instead","into","invention","inward","is","isnt","it","itd","itll","its","itself","ive","j","just","k","keep	keeps","kept","kg","km","know","known","knows","l","largely","last","lately","later","latter","latterly","least","less","lest","let","lets","like","liked","likely","line","little","ll","look","looking","looks","ltd","m","made","mainly","make","makes","many","may","maybe","me","mean","means","meantime","meanwhile","merely","mg","might","million","miss","ml","more","moreover","most","mostly","mr","mrs","much","mug","must","my","myself","n","na","name","namely","nay","nd","near","nearly","necessarily","necessary","need","needs","neither","never","nevertheless","new","next","nine","ninety","no","nobody","non","none","nonetheless","noone","nor","normally","nos","not","noted","nothing","now","nowhere","o","obtain","obtained","obviously","of","off","often","oh","ok","okay","old","omitted","on","once","one","ones","only","onto","or","ord","other","others","otherwise","ought","our","ours","ourselves","out","outside","over","overall","owing","own","p","page","pages","part","particular","particularly","past","per","perhaps","placed","please","plus","poorly","possible","possibly","potentially","pp","predominantly","present","previously","primarily","probably","promptly","proud","provides","put","q","que","quickly","quite","qv","r","ran","rather","rd","re","readily","really","recent","recently","ref","refs","regarding","regardless","regards","related","relatively","research","respectively","resulted","resulting","results","right","run","s","said","same","saw","say","saying","says","sec","section","see","seeing","seem","seemed","seeming","seems","seen","self","selves","sent","seven","several","shall","she","shed","shell","shes","should","shouldnt","show","showed","shown","showns","shows","significant","significantly","similar","similarly","since","six","slightly","so","some","somebody","somehow","someone","somethan","something","sometime","sometimes","somewhat","somewhere","soon","sorry","specifically","specified","specify","specifying","still","stop","strongly","sub","substantially","successfully","such","sufficiently","suggest","sup","sure","system","take","taken","taking","tell","ten","tends","th","than","thank","thanks","thanx","that","thats","the","their","theirs","them","themselves","then","thence","there","thereafter","thereby","thered","therefore","therein","thereof","therere","theres","thereto","thereupon","these","they","theyd","theyre","thick","thin","thing","things","think","thinks","third","this","thorough","thoroughly","those","thou","though","thoughh","thought","thoughts","thousand","three","throug","through","throughout","thru","thus","til","tip","to","today","together","too","took","top","toward","towards","tried","tries","truly","try","trying","ts","turn","turned","turning","turns","twelve","twenty","twice","two","un","under","unfortunately","unless","unlike","unlikely","until","unto","up","upon","ups","us","use","used","useful","usefully","usefulness","uses","using","usually","value","various","very","via","viz","vol","vols","vs","want","wanted","wanting","wants","was","way","ways","we","wed","welcome","well","wells","went","were","what","whatever","whats","when","whence","whenever","where","whereafter","whereas","whereby","wherein","wheres","whereupon","wherever","whether","which","while","whim","whither","who","whod","whoever","whole","whom","whomever","whos","whose","why","widely","will","willing","wish","with","within","without","wonder","words","work","worked","working","works","world","would","www","year","years","yes","yet","you","youd","young","younger","youngest","your","youre","yours","yourself","yourselves","zero","algorithm","approach","method","process","way"]
