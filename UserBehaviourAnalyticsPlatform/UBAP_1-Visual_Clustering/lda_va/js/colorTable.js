var ColorLabel = function(gSVGName,pos,data,type){
	this.svgName = gSVGName;
	//this.data = data;
	this.width = pos.width;
	this.height = pos.height;
	this.x = pos.x;
	this.y = pos.y;
	d3.select("#"+this.svgName).selectAll("g").remove();
	this.gColorLabel = d3.select("#"+this.svgName).append("g")
		.attr("class","colorLabel")
		.attr("transform","translate("+this.x+","+this.y+")");
	this.unitWidth = 200;
	this.unitHeight = 20;
	this.init(data);

	this.operation = "select"

	this.type = type
	this.selectedIndex = {}
}
// var fillColor = d3.scale.category10();
var myColor = {}
//data: index,text,color,
ColorLabel.prototype = {
	init:function(data){
		this.data = data;
	},
	reset:function(){
		this.selectedIndex = {}
		var _this = this;
		notifyColorSelection(_this.data,_this.selectedIndex,actionGroupMapping,groupActionMapping)
		_this.highlightSelection()			
	},
	// init:function(poiInfo){
		 

	// 	var drawLabels = {};
	// 	for(var j=0;j<poiInfo.features.length;j++){
	// 		var category = poiInfo.features[j].properties.Type;
	// 		if(!drawLabels[category]){
	// 			drawLabels[category] = fillColor(category);
	// 		}
	// 	}
	// 	drawLabels["Uncertain"] = fillColor("Uncertain")
	// 	drawLabels["Non POI"] = fillColor("Non POI")

	// 	var drawLabelArray = []
	// 	var count = 0;
	// 	for(var cat in drawLabels){
	// 		drawLabelArray.push({index:count,text:cat,color:drawLabels[cat]})
	// 		count++;
	// 	}
	// 	this.data = drawLabelArray

	// 	// this.data = [];
	// 	// this.data.push({index:0,text:"all",color:"#ffff00"});
	// 	// this.data.push({index:1,text:"top 20 src",color:"#"+srcColorString});
	// 	// this.data.push({index:2,text:"top 20 dest",color:"#"+destColorString});
	// 	// this.data.push({index:3,text:"top 20 bi-dir",color:"#3cfff7"});
	// },
	draw:function(){
		var data = this.data;
		var myColorLabel = this;
		var gColorLabel = this.gColorLabel;
		var width = this.width;
		var height = this.height;
		var unitWidth = this.unitWidth;
		var unitHeight = this.unitHeight;
		var xMax = parseInt(width/unitWidth);

		var yMax = parseInt(data.length/xMax)

		var maxHeight = unitHeight*(yMax+1)

        setSvgAttr(d3.select("#"+this.svgName), $("#"+this.svgName).width(), maxHeight)
		var _this = this;


		var blockWidth = 20;
		var blockHeight = 20;
		var fontSize = 10
		if(_this.type && _this.type=="sub"){
			blockWidth = 10;
			blockHeight = 10;
		}


		var sel = gColorLabel.selectAll("g.colorBlock")
			.data(data,function(d){
				return d.text;
			});
		var enter = sel.enter()
			.append("g")
			.attr("class","colorBlock")
			.attr("transform",function(d){
				var index = d.index%xMax;
				var x = width - index*unitWidth - unitWidth;	
				index = parseInt(d.index/xMax);
				var y = index*unitHeight;

				return "translate("+x+","+y+")";
		});

		enter.append("rect");
		enter.append("text");
		sel.attr("transform",function(d){
				var index = d.index%xMax;
				var x = width - index*unitWidth - unitWidth;	
				index = parseInt(d.index/xMax);
				var y = index*unitHeight;
				return "translate("+x+","+y+")";
		})


		enter.merge(sel).select("rect")
			.attr("width",blockWidth)
			.attr("height",blockHeight)
			.attr("transform",function(d){
				var x = 0;
				var y = 0
				if(_this.type && _this.type=="sub"){
					x+=blockWidth/2.0
					y+=blockHeight/2.0
				}				
				return "translate("+x+","+y+")";
			})
			.style("fill",function(d){
				return d.color;
			})
			.on("click",function(d){
				if(_this.type && _this.type=="sub"){
					return;
				}
				var key = d.text;
				// if(_this.selectedIndex[key]){
				// 	delete _this.selectedIndex[key]
				// }else{
				// 	_this.selectedIndex[key] = true;
				// }
				var operation = _this.operation
				if(operation=="select"){
					if(_this.selectedIndex[key]){
						delete _this.selectedIndex[key]
					}else{
						_this.selectedIndex[key] = true;
					}
				}else{
					var selected = d3.entries(_this.selectedIndex).length?true:false
					if(selected){
						if(_this.selectedIndex[key]){
							delete _this.selectedIndex[key]
						}else{
							return;
						}
					}else{
						for(var i=0;i<data.length;i++){
							if(data[i].text!=key){
								_this.selectedIndex[data[i].text] = true
							}
						}
					}
				}


				notifyColorSelection(_this.data,_this.selectedIndex,actionGroupMapping,groupActionMapping)

				_this.highlightSelection()
			})

		enter.merge(sel).select("text")
			.attr("x",22)
			.attr("y",15)			
			.text(function(d){
				return d.text;
			})

		if(_this.type && _this.type=="sub"){
			enter.merge(sel).select("text").style("font-size","10px")
		}

		sel.exit().remove()
	},
	setSize:function(width,height){
		this.width = width;
		this.height =height;
	},
	highlightSelection:function(){
		var _this = this;
		var selectedIndex = this.selectedIndex

		var selectedFlag = d3.entries(selectedIndex).length?true:false
		this.gColorLabel.selectAll("g.colorBlock")
			.select("rect")
			.style("stroke",function(d){
				if(selectedIndex[d.text]){
					return "black"
				}else{
					return "none"
				}
			})
			.style("fill",function(d){
				if(selectedFlag){
					return "rgb(248,248,248)"
				}else{
					return d.color
				}
			})
	}
}

function notifyColorSelection(colorData, selectedIndex, actionGroupMapping, groupActionMapping){
	var result = updateColorLabels(colorData, selectedIndex, actionGroupMapping, groupActionMapping)

    var actionColorSet = result[2]
    var groupColorSet = result[1]
    var colorData1 = result[0]


    var posColor = {x:0, y:0, width:$("#topSecondTopViewSvg").width()-10,height:$("#topSecondTopViewSvg").height-10,svgName:"topTopViewSvg"}
    var colorLabel1 = new ColorLabel("topSecondTopViewSvg",posColor,colorData1,"sub")
    colorLabel1.draw();	

    var selectedActionIndex = {}
    for(var i in selectedIndex){
    	var group = i;
    	var actions = groupActionMapping[group].actions;
    	for(var j=0;j<actions.length;j++){
    		selectedActionIndex[actions[j]] = true;
    	}
    }

    refreshAllViews(actionColorSet,groupColorSet,selectedActionIndex)
}

function updateColorLabels(colorData, selectedIndex, actionGroupMapping, groupActionMapping){

	var detailedColor = d3.scaleOrdinal(d3.schemeCategory20)

	// for(var i=0;i<colorData.length;i++){
	// 	var id = colorData[i].value.id;
	// 	colorData[i].selected = false;
	// 	if(selectedIndex[id]){
	// 		colorData[i].selected = true;
	// 	}
	// 	colorData[i].color = "rgb(248,248,248)"
	// }

	var detailedDataArray = []
	var count = 0
	for(var i in selectedIndex){
		var group = i;
		var actions = groupActionMapping[group].actions

		for(var j=0;j<actions.length;j++){
			// var nData = {index:count++,color:detailedColor(actions[j]),text:actions[j]}
			var nData = {index:count++,text:actions[j]}
			detailedDataArray.push(nData)
		}
	}
	var selectedFlag = d3.entries(selectedIndex).length?true:false

	var detailedColorSet = function(action){
		var group = actionGroupMapping[action]
		if(selectedIndex[group]){
			return detailedColor(action)
		}else{
			return "rgb(248,248,248)"
		}
	}


	detailedDataArray.sort(function(a,b){
		return globalActionType[b.text].count - globalActionType[a.text].count;
	})

	for(var i=0;i<detailedDataArray.length;i++){
		detailedDataArray[i].index = i;
		detailedDataArray[i].color = detailedColor(detailedDataArray[i].text)
	}
	//update index for sorting

	if(!selectedFlag){
		return [detailedDataArray,originalGroupColorSet,originalActionColorSet]		
	}

	var newGroupColor = function(group){
		return "rgb(248,248,248)"
	}


	//update the original one

	// return [detailedDataArray,detailedColor,detailedColorSet]
	return [detailedDataArray,newGroupColor,detailedColorSet]
}


function extractColorLabelsByGroup(data,actionGroup){
  var actionType = {}
  colorSet =  d3.scaleOrdinal(d3.schemeCategory20);

  for(var i=0;i<data.length;i++){
    var actionsQueue = data[i].actionsQueue;
    if(!actionsQueue){
      continue;
    }
    for(var j=0;j<actionsQueue.length;j++){
      var action = actionsQueue[j]
      if(!actionType[action]){
        actionType[action] = {id:action,text:action,count:0}
      }
      actionType[action].count++;
    }
  }

  var actionGroupMapping = {}
  var groupActionMapping = {}
  for(var i=0;i<actionGroup.length;i++){
    var group = actionGroup[i].group;
    var action = actionGroup[i].action
    if(!groupActionMapping[group]){
      groupActionMapping[group] = {id:group,text:group,count:0,group:group,actions:[]}
    }
    groupActionMapping[group].actions.push(action)
    var countVal = 0
    if(actionType[action] && actionType[action].count){
    	countVal = actionType[action].count
    }
    // groupActionMapping[group].count+=actionType[action].count;
    groupActionMapping[group].count+= countVal;
    actionGroupMapping[action] = group;
  }

  var dataArray = d3.entries(groupActionMapping)
  dataArray.sort(function(a,b){
    return b.value.count - a.value.count;
  })
  for(var i=0;i<dataArray.length;i++){
    dataArray[i].index = i;
    dataArray[i].color = colorSet(dataArray[i].value.id)
    dataArray[i].text = dataArray[i].value.text;
  }

  var newColorSet = function(action){
    return colorSet(actionGroupMapping[action])
  }

  return [dataArray,colorSet,newColorSet,actionGroupMapping,groupActionMapping,actionType]

}

function extractColorLabels(data){
  var actionType = {}
  colorSet =  d3.scaleOrdinal(d3.schemeCategory20);

  for(var i=0;i<data.length;i++){
    var actionsQueue = data[i].actionsQueue;
    if(!actionsQueue){
      continue;
    }
    for(var j=0;j<actionsQueue.length;j++){
      var action = actionsQueue[j]
      if(!actionType[action]){
        actionType[action] = {id:action,text:action,count:0}
      }
      actionType[action].count++;
    }
  }

  var dataArray = d3.entries(actionType)
  dataArray.sort(function(a,b){
    return b.value.count - a.value.count;
  })
  for(var i=0;i<dataArray.length;i++){
    dataArray[i].index = i;
    dataArray[i].color = colorSet(dataArray[i].value.id)
    dataArray[i].text = dataArray[i].value.text;
  }
  return [dataArray,colorSet]

}