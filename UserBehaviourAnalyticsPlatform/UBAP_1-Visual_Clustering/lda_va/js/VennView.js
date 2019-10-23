var VennView = function(svgName,pos,fillColor,titleText,id,parent){//x,y,idlist = key,value,idList
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
	this.vis = d3.select("#"+svgName).append("g")
		.attr("transform","translate("+this.x+","+this.y+")");

	this.id = id;
	this.parent = parent;
	this.init();
	//this.preprocessData();	
}

VennView.prototype = {
	init:function(){

		var chart = venn.VennDiagram()
		this.chart = chart

	},
	refresh:function(fillColor,data){
		this.fillColor = fillColor;
		this.vis.selectAll("*").remove()
		this.updateData(data)
	},
	updateData:function(data){

		var sets = []
		var thresholdVal = 20;
		for(var i in data){
			if(!data[i].size || data[i].size<thresholdVal){
				
				// console.log("few data inside", data[i].sets,)
				continue;
			}
			sets.push({sets:data[i].sets,size:data[i].size})
		}
		this.dataIndex = data

		var _this = this
		var colorSet = function(set){
			if(set=='Others'){
				return "#444"
			}
			return _this.fillColor(_this.dataIndex[set].majorGroup)
		}

		this.data = sets;
		var chart = this.chart.width(this.width).height(this.height)
			.colours(colorSet)
		this.vis.datum(sets).call(chart)

		var div = this.vis;

		// add a tooltip
		d3.select("body").selectAll("div.venntooltip").remove()
		var tooltip = d3.select("body").append("div")
		    .attr("class", "venntooltip");

		// add listeners to all the groups to display tooltip on mouseover
		div.selectAll("g")
		    .on("mouseover", function(d, i) {
		        // sort all the areas relative to the current item
		        venn.sortAreas(div, d);

		        // Display a tooltip with the current size
		        tooltip.transition().duration(400).style("opacity", .9);
		        tooltip.text(d.size + " Sessions");
		        
		        // highlight the current path
		        var selection = d3.select(this).transition("tooltip").duration(400);
		        selection.select("path")
		            .style("stroke-width", 3)
		            .style("fill-opacity", d.sets.length == 1 ? .4 : .1)
		            .style("stroke-opacity", 1);

		        if(d.sets.length==1){
			        hoveringNotification(d.sets[0])
		        }

		        // _this.hoveringMethod(d.sets[0])
		    })

		    .on("mousemove", function() {
		        tooltip.style("left", (d3.event.pageX) + "px")
		               .style("top", (d3.event.pageY - 28) + "px");
		    })
		    .on("mouseout", function(d, i) {
		        tooltip.transition().duration(400).style("opacity", 0);
		        var selection = d3.select(this).transition("tooltip").duration(400);
		        selection.select("path")
		            .style("stroke-width", 0)
		            .style("fill-opacity", d.sets.length == 1 ? .25 : .0)
		            .style("stroke-opacity", 0);

		        if(d.sets.length==1){
			        hoveringNotification(d.sets[0],true)
		        }		            
		    })
		    .on("mousedown",function(d,i){
		    	clickVennNode(d.sets,_this.dataIndex[""].dataIndex) //not a good way to proceed
		    })
		    ;

	},
	hoveringMethod:function(rawID,offFlag){

		var strokeWidth = offFlag?0:3
		var fillOpacity = offFlag?0.25:0.4
		var strokeOpacity = offFlag?0:1

		this.vis.selectAll("g").filter(function(d){
			return d.sets.length==1 && d.sets[0]==rawID
		})
		.select("path")
        .style("stroke-width", strokeWidth)
        .style("fill-opacity", fillOpacity)
        .style("stroke-opacity", strokeOpacity);		
	},
	draw:function(){

	}
}
