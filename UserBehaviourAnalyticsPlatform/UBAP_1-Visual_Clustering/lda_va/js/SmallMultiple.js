var SmallMultiple = function(gSVGName,pos,fillColor,id,titleText,parent){//x,y,idlist = key,value,idList
	this.svgName = gSVGName;
	//this.data = data;
	this.width = pos.width;
	this.height = pos.height;
	this.x = pos.x;
	this.y = pos.y;
	this.titleText = titleText;

	this.fillColor = fillColor

	this.filterParameter = {
		xNum:4,
		visible:true,
	}

	this.margin = {
		top:2.5,
		right:0,
		bottom:2.5,
		left:0
	}


	this.vis = d3.select("#"+this.svgName).append("g")
		.attr("class","smallMultiple")
		.attr("id","smallMultiple")
		.attr("transform","translate("+this.x+","+this.y+")");
	this.id = id;
	this.parent = parent;
	this.sortingIndex = true;

	this.mObject = {}


	this.init();
	//this.preprocessData();	
}

SmallMultiple.prototype = {
	init:function(){

	},
	refresh:function(fillColor){
		var mObject = this.mObject
		for(var i in mObject){
			mObject[i].refresh(fillColor)
		}
	},
	sorting:function(){
		var data = this.data;
		this.sortingIndex = !this.sortingIndex;

		// var sortingIndex = this.sortingIndex;
		// if(sortingIndex){
		// 	data.sort(function(a,b){
		// 		return b.srcIndex - a.srcIndex;
		// 	})
		// }else{
		// 	data.sort(function(a,b){
		// 		return b.linksData.length - a.linksData.length;
		// 	})
		// }
//		this.data = data;
		this.refresh();
	},
	highlightNode:function(nameIndex,resetFlag){
		var mObject = this.mObject;
		for(var i in mObject){
			mObject[i].highlightNode(nameIndex,resetFlag);
		}
	},
	updateData:function(allData,resetFlag,parent){

		this.remove()

		this.data = allData;
		var count = allData.length;
		this.parent = parent;

		// var xNum = 1;
		var xNum = this.filterParameter.xNum;
		var width = this.width;
		// var yNum = allData.length;
		var yNum = Math.ceil((count)/xNum);
		var height = this.height;

		// if(height/yNum>200){
		// 	height = 200*yNum;
		// }

		// var fixHeight = this.height/4;
		// if(fixHeight<150){
		// 	fixHeight = 150;
		// }

		// height = fixHeight*yNum;///fixed it

  		d3.select("#"+this.svgName).attr("height",height);


		this.drawArea = {
			 x: this.margin.left,
			 y: this.margin.top,
			width:width/xNum - this.margin.left - this.margin.right,
			height:height/yNum - this.margin.top - this.margin.bottom,
			moveWidth:width/xNum,
			moveHeight:height/yNum,
		}

		this.xLayoutScale = d3.scaleBand()
			.domain(d3.range(xNum))
//			.rangeBands([this.drawArea.x,this.width-this.margin.right],0.1);
			.range([0,this.width]);

		this.yLayoutScale = d3.scaleBand()
			.domain(d3.range(yNum))
			.range([0,this.height])


		this.draw(resetFlag);
		this.highlightData([]);
	},
	remove:function(){
		var mObject = this.mObject;
		// for(var i in mObject){
		// 	mObject[i].remove();
		// }
		this.mObject = {};
	},
	draw:function(resetFlag){
		var data = this.data;
		var _this = this;
		var vis = this.vis;
		var xNum = this.filterParameter.xNum;
		var drawWidth = this.drawArea.width;
		var drawHeight = this.drawArea.height;
		var moveWidth = this.drawArea.moveWidth;
		var moveHeight = this.drawArea.moveHeight;

		var xLayoutScale = this.xLayoutScale;
		var yLayoutScale = this.yLayoutScale;		

		var sel = vis.selectAll("g.smallMultiple")
			.data(data,function(d){
				return d.id;
			})

		var enter = sel.enter().append("g")
			.attr("class","smallMultiple")
			.attr("id",function(d){
				return "smallMultiple" + d.id;
			});

		sel.exit().remove();

		mObject = this.mObject;

		var fillColor = this.fillColor

		
		for(var i=0;i<data.length;i++){
			var x = (i)%xNum;
			var y = parseInt((i)/xNum);
			var pos = {x:xLayoutScale(x),y:yLayoutScale(y),
				width:xLayoutScale.bandwidth()-this.margin.left-this.margin.right,
				height:yLayoutScale.bandwidth()-this.margin.top-this.margin.bottom,margin:_this.margin,
				originWidth:xLayoutScale.bandwidth(),
				originHeight:yLayoutScale.bandwidth()};
			// console.log(pos,"posss")
//			var pos = {x:x*moveWidth,y:y*moveHeight,width:drawWidth,height:drawHeight,margin:_this.margin};
			var sel = vis.select("#smallMultiple"+data[i].id);
			if(!mObject[i]){
				mObject[i] = new CircleView(sel,pos,"",0,fillColor);
        // eventVis.updateData(root);

				// mObject[i] = new Sparkline(sel,"smallMultiple"+data[i].id,pos,data[i].id,data[i].title,this);
			}
			// var showAxis = false;
			// if(i==data.length-1){
			// 	showAxis = true;
			// }
			// mObject[data[i].id].setGlobalStat(globalClusterPairs[data[i].srcIndex+","+data[i].destIndex].linksData.length)
			mObject[data[i].id].updateData(data[i],resetFlag);
		}


		this.mObject = mObject;

	},
	highlightData:function(hData){
	}
}