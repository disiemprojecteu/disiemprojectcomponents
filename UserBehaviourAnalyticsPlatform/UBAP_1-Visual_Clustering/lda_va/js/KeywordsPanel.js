
var KeywordsPanel = function(svgName,pos,id,titleText,parent){//x,y,idlist = key,value,idList
	//this.svgName = gSVGName;
	//this.data = data;
	this.width = pos.width;
	this.height = pos.height;
	this.x = pos.x;
	this.y = pos.y;
	this.titleText = titleText;
	var margin = pos.margin;

	this.vis = d3.select("#"+svgName).append("g")
		.attr("class","keywordsPanel")
		.attr("transform","translate("+this.x+","+this.y+")");


	this.id = id;
	this.parent = parent;

	this.init();
	this.lastHighlight = null;
	//this.preprocessData();	
}

// function notifyHistogramFilter(data,dataSel,isPair){
// 	linkFilter.updateData(data,dataSel,isPair);
// }

// function notifyKeywordsSelection(data){
// 	myCircos.circularWidget.updateClickUserData(data.data);
// }

KeywordsPanel.prototype = {
	init: function(){
		this.vis.select(".xAxis").remove();
		this.vis.select(".yAxis").remove();
		this.vis.select("text").remove();

		var width = this.width;
		var height = this.height;

		var xScale = d3.scale.ordinal().rangeBands([0,width],0.1);
//		var xScale = d3.scale.linear().range([0,width]);

		var yScale = d3.scale.linear()
			.range([0,height])
//			.range([height,0]);
		var xAxis = d3.svg.axis()
			.scale(xScale)
			.orient("bottom")
			.ticks(1).tickSubdivide(1).tickSize(0);

			//.tickValues([]);

		var yAxis = d3.svg.axis()
			.scale(yScale)
			.orient("left")
			.ticks(4)
//			.ticks(1).tickSubdivide(1).tickSize(0);

		this.xScale = xScale;
		this.yScale = yScale;
		this.xAxis = xAxis;
		this.yAxis = yAxis; 
	
		this.vis.append("g")
			.attr("class","xAxis")
			.attr("transform","translate(0,"+this.height+")");

		this.vis.append("g")
			.attr("class","yAxis");

		var textYPos = -10;
		var xMovement = -23;
//		var xMovement = -(this.width/0.9)*0.05;
		var yMovement = 20;

		// this.vis.append("text")
		// 	.attr("transform","translate("+0+"," + (this.height+yMovement) +")")
		// 	.text(this.titleText);

		// this.gBarChart.append("text")
		// 	.attr("transform","translate("+xMovement+","+yMovement+") rotate(-90)")
		// //	.attr("transform","translate(-5,-5)")
		// 	.text("Time Distance (hrs)")
		// 	.style("text-anchor","end")
		// this.gBarChart.append("text")
		// 	.attr("transform","translate("+this.width*7/10.0+","+(this.height+30)+")")
		// 	.text("Geo Distance (km)");

	},
	updateData:function(data){
		this.data = data;
		// this.rawKeywords = keywords;

		this.preprocessData();
		this.drawKeywords();
	},
	preprocessData:function(){

		var data = this.data;
		var keywords = {};
		for(var i=0;i<data.length;i++){
			var segments = data[i].segments.split(" ");
			for(var j=0;j<segments.length;j++){
				if(!keywords[segments[j]]){
					keywords[segments[j]] = [segments[j],0,[]]
				}
				keywords[segments[j]][1]++;
				keywords[segments[j]][2].push(data[i]);
			}
		}

		var keywordsArray = [];
		for(var i in keywords){
			keywordsArray.push(keywords[i])
		}
		keywordsArray.sort(function(a,b){
			return b[1]-a[1];
		})

		this.keywords = keywordsArray

		// var keywords = this.rawKeywords;
		// var data = this.data;

		// for(var i=0;i<keywords.length;i++){
		// 	var text = keywords[i][0];
		// 	keywords[i][2] = [];
		// 	for(var j=0;j<data.length;j++){
		// 		if(data[j].text.indexOf(text)!=-1){
		// 			keywords[i][2].push(data[j])
		// 		}
		// 	}
		// }
		// this.keywords = keywords;
	},
	highlightSelection:function(highlightData){
		var lastHighlight = this.lastHighlight;
		if(lastHighlight && lastHighlight.length==1 && highlightData.length ==1 &&
			lastHighlight[0]==highlightData[0]){
			this.lastHighlight = null;
			highlightData = [];
		}

		this.lastHighlight = highlightData;
		var dataSel = this.dataSel;

		if(!highlightData.length){
			this.vis.selectAll("g.histogramFilter")
				.classed("dehighlightedBar",false);
			dataSel.style("visibility","visible");
			return;
		}

		var highlightIndex = {};
		for(var i=0;i<highlightData.length;i++){
			highlightIndex[highlightData[i].index] = true;
		}
		
		this.vis.selectAll("g.histogramFilter")
			.classed("dehighlightedBar",function(d){
				if(highlightIndex[d.index]){
					return false;
				}
				return true;
			});

		dataSel.style("visibility",function(d){

			if(highlightIndex[d.key]){
				return "visible";
			}
			return "hidden";
		})


	},

	drawKeywords:function(){
		// if(!rect){
		// 	rect = {x1:0,x2:0,y1:0,y2:0}
		// }
		var rect = {x1:0,x2:this.width,y1:0,y2:this.height}
		var keywords = this.keywords;

		var myBossPanel = this;
		var gBossChart = this.vis;
		var sizeScale = d3.scale.linear().domain(d3.extent(keywords.map(function(d){
			return d[1];
		}))).range([10,30]);

		var threshold = 30;

		var frequency_list = [];
		for(var i=0;i<d3.min([keywords.length,threshold]);i++){
			frequency_list.push({text:keywords[i][0],size:sizeScale(keywords[i][1]),data:keywords[i][2]});
		}
		var color = d3.scale.linear()
            .domain([0,1,2,3,4,5,6,10,15,20,100])
            .range(["#ddd", "#ccc", "#bbb", "#aaa", "#999", "#888", "#777", "#666", "#555", "#444", "#333", "#222"]);


        d3.layout.cloud().size([rect.x2-rect.x1,Math.abs(rect.y2-rect.y1)])
        	.words(frequency_list)
        	.rotate(0)
        	.fontSize(function(d){
        		return d.size;
        	})
        	.on("end",draw)
        	.start();

        function draw(words){
        	var sel = gBossChart.selectAll("g.keywords")
        		.data(words,function(d){
        			return d.text;
        		})

        	var enter = sel.enter().append("g")	
        		.attr("class","keywords")
        	enter.append("text");
        	sel.select("text")
        		.text(function(d){
        			return d.text;
        		})
        		.transition()
        		.attr("transform",function(d){
        			var x = d.x + rect.x1 + (rect.x2-rect.x1)/2.0;
        			var y = d.y + rect.y1 + (rect.y2-rect.y1)/2.0;
        			return "translate("+[x,y]+")";
        		})
        		.style("font-size",function(d){
        			return d.size
        		})
        		// .style("fill",function(d){
        		// 	return color(d.size);
        		// })
        		// .style("stroke",function(d){
        		// 	return color(d.size);
        		// })

			sel.on("mouseover",function(d){
				d3.select(this).select("text").style("fill","red");
				var keyword = d.text;
				var hIndex = {};
				hIndex[keyword] = true;
				documentViz.highlightNodeByKeywords(hIndex)
			})
			.on("mouseout",function(d){
				if(d.clicked){
					return;
				}
				documentViz.highlightNodeByKeywords({},true)				
				d3.select(this).select("text").style("fill","black")
			})
			.on("click",function(d){
				if(d.clicked){
					d.clicked = false;
					documentViz.clickNodeByKeywords({},true)

					// notifyKeywordsSelection({data:[]});
					return;
				}
				sel.each(function(dd){
					dd.clicked =false;
					d3.select(this).select("text").style("fill","black")
				})

				d.clicked = true;
				d3.select(this).select("text").style("fill","red");

				var keyword = d.text;
				var hIndex = {};
				hIndex[keyword] = true;
				documentViz.highlightNodeByKeywords(hIndex)				
				documentViz.clickNodeByKeywords(hIndex)
				// notifyKeywordsSelection(d);
			})

        	sel.exit().remove();

			// var flag = myBossPanel.filterParameter.viewKeywords;
			// var str = flag?"visible":"hidden";
			// d3.selectAll(".keywords").style("visibility",str);		        	
        }
	}
}