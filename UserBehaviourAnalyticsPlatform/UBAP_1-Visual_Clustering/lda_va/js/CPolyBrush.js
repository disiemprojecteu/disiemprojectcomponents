var PolyBrush = function(svgGroup){
	this.svgGroup = svgGroup;
	svgGroup.select("g.polybrush").remove();
	this.brushSel = svgGroup.append("g").attr("class","polybrush");
    this.enableHandle = false;
    this.lastBrush = null;
//	this.setBrush();
}

PolyBrush.prototype = {
    init:function(pos,xScale,yScale,notifyCallBack,notifyCallBackFinished,enableHandle){
        this.xScale = xScale;
        this.yScale = yScale;
        this.pos = pos;
        this.brushLock = false;
        this.notifyCallBack = notifyCallBack;
        this.notifyCallBackFinished = notifyCallBackFinished;
        this.enableHandle = enableHandle;
        this.setBrush();
    },
    resetBrush:function(){
		this.brushSel.selectAll("*").remove();
		this.setBrush();
    },
	setBrush:function(){


		var myBrush = this;
		var _this = this;
		var sel = this.brushSel;
        var notifyCallBack = this.notifyCallBack;
        var notifyCallBackFinished = this.notifyCallBackFinished;

		var polyBrush = d3.svg.polybrush()
			.x(this.xScale)
			.y(this.yScale)
			.on("brushstart",polyBrushStart)
			.on("brush",polyBrushMove)
			.on("brushend",polyBrushEnd);

		function polyBrushStart(){
			console.log("start");
			myBrush.brushLock = true;
		}
		function polyBrushMove(){
			var e = d3.event;
			console.log("brush",e.x,e.y)
			if(polyBrush.extent().length!=0){
				// myCircular.brushing = 1;
			}
			notifyCallBack(e)
			//console.log("hello");
		}
		function calculateDistance(pt1,pt2){//without square
			return Math.sqrt((pt1[0]-pt2[0])*(pt1[0]-pt2[0])+(pt1[1]-pt2[1])*(pt1[1]-pt2[1]));
		}
		
		function polyBrushEnd(){
			console.log(polyBrush.extent());
			var e = d3.event;

			if(polyBrush.extent().length>2){
				var lines = polyBrush.extent();
				// var points = [];
				// var center = [0,0];
				// for(var i=0;i<lines.length;i++){
				// 	var p = [lines[i][0],lines[i][1]]
				// 	points.push(p)
				// 	center[0]+=p[0];
				// 	center[1]+=p[1];					
				// }
				// center[0] = center[0]/lines.length;
				// center[1] = center[1]/lines.length;
				// var disMax = Number.MIN_VALUE;
				// for(var i=0;i<latLngLines.length;i++){
				// 	var dis = calculateDistance([latLngLines[i][0],latLngLines[i][1]],center)
				// 	dis = dis*DISTANCE_PER_DEGREE;
				// 	if(dis>disMax){
				// 		disMax = dis;
				// 	}
				// }

				// myCircular.brushForDetail(latLngLines,center,disMax);//brushing

			}
			notifyCallBackFinished(polyBrush);
			_this.resetBrush();
			// myCircular.brushing = 0;
			// myCircular.gPolyBrush = gSel.append("g")
			// 	.attr("class","polyBrush")
		}
		//gSel.selectAll("g.polyBrush").remove();
		this.brushSel.call(polyBrush);

		this.polyBrush = polyBrush;

        // sel.selectAll("rect.extent").style("fill","none")
        //                 .style("stroke","rgba(195,178,255,0.5)")
        //                 .style("stroke-opacity",0.5);
	},
    updateBrush:function(startVal,endVal){
    	return;
    	if(this.brushLock){
    		return;
    	}
        var sel = this.brushSel;
        var stPos = this.xScale(startVal);
        var edPos = this.xScale(endVal);
        var width = edPos-stPos;
        if(!startVal || !endVal || !width || width<0){
            return;
        }

//        this.setBrush();

    	this.filteredStartEndVal = [startVal,endVal];
        this.generalBrush.extent(this.filteredStartEndVal);
        sel.selectAll("rect.extent")
            .attr("x",stPos)
            .attr("width",width);
        sel.selectAll("g.w")
            .style("display",null)
            .attr("transform","translate("+stPos+",0)");
        sel.selectAll("g.e")
            .style("display",null)
            .attr("transform","translate("+edPos+",0)");1

        sel.classed("selecting",true);

    },
    enableBrush:function(){
    	d3.select("g.polybrush").style("pointer-events","all");
    	//d3.select(".icon-white").style("poniter-events","all");
    },
    disableBrush:function(){
    	d3.select("g.polybrush").style("pointer-events","none");
    	//d3.select(".icon-white").style("poniter-events","none");
    },
	_removePolyBrush:function(){
		//////it is a big trick, not to use too much, stop here.
		this.brushing = false;
		this.brushSel.selectAll("g.polyBrush").remove();
	}
}






// 	_addPolyBrush:function(gSel){
// 		var padding = this.radius;
// 		var _this = this;

// 		function project(lat,lng){
// 			return _this.project(lat,lng);
// 		}
// 		function unproject(x,y){
// 			return _this.unprojectLayer(x,y);
// 		}

// 		var bounds = this.bounds;
// 		var bufferPixels = this.bufferPixels;

// 		var myCircular = this;
// 		var polyBrush = d3.svg.polybrush()
// 			.x(d3.scale.linear().range([bounds[0].x,bounds[0].x+2*padding]))
// 			.y(d3.scale.linear().range([bounds[1].y,bounds[1].y+2*padding]))
// 			.on("brushstart",polyBrushStart)
// 			.on("brush",polyBrushMove)
// 			.on("brushend",polyBrushEnd);

// 		function polyBrushStart(){
// 			console.log("start");
// 			//cheng gong kai shi
// 			//myCircular.brushing = 1;
// 		}
// 		function polyBrushMove(){
// 			var e = d3.event;
// 			console.log("brush",e.x,e.y)
// 			if(polyBrush.extent().length!=0){
// 				myCircular.brushing = 1;
// 			}
// 			//console.log("hello");
// 		}
// 		function calculateDistance(pt1,pt2){//without square
// 			return Math.sqrt((pt1[0]-pt2[0])*(pt1[0]-pt2[0])+(pt1[1]-pt2[1])*(pt1[1]-pt2[1]));
// 		}
		
// 		function polyBrushEnd(){
// 			console.log(polyBrush.extent());

// 			if(polyBrush.extent().length>2){
// 				var lines = polyBrush.extent();
// 				var latLngLines = [];
// 				var center = [0,0];
// //				var rp = myCircular.relativePixelPoint;
// 				for(var i=0;i<lines.length;i++){
// 					var p = unproject(lines[i][0],lines[i][1])
// 					latLngLines.push(p)
// //					var p = projection.fromDivPixelToLatLng({x:lines[i][0]+rp.x,y:lines[i][1]+rp.y});
// 					//console.log(p,p1);
// 					// center[0]+=p.lng();
// 					// center[1]+=p.lat();
// 					center[0]+=p[0];
// 					center[1]+=p[1];					
// 					// latLngLines.push([p.lng(),p.lat()]);
// 				}
// 				center[0] = center[0]/lines.length;
// 				center[1] = center[1]/lines.length;
// 				var disMax = Number.MIN_VALUE;
// 				for(var i=0;i<latLngLines.length;i++){
// 					var dis = calculateDistance([latLngLines[i][0],latLngLines[i][1]],center)
// 					dis = dis*DISTANCE_PER_DEGREE;
// 					if(dis>disMax){
// 						disMax = dis;
// 					}
// 				}

// 				myCircular.brushForDetail(latLngLines,center,disMax);//brushing

// 				// myCircular.parent.addSubRegionByPolyBrush(latLngLines,center,disMax);
// 				// if(myCircular.analysisParameter.enableFiltering){
// 				// 	bossChart.updateDataByCircos(myCircular.analysisParameter.enableFiltering,myCircular.parent);    			
// 			 //    	barChart.updateDataByCircos(myCircular.analysisParameter.enableFiltering,myCircular.parent);
// 				// }

// 			}
// 			myCircular.brushing = 0;
// 			gSel.selectAll("g.polyBrush").remove();

// 		}
// 		//gSel.selectAll("g.polyBrush").remove();
// 		myCircular.gPolyBrush = gSel.append("g")
// 			.attr("class","polyBrush")

// 		myCircular.gPolyBrush.call(polyBrush);			
// 	},