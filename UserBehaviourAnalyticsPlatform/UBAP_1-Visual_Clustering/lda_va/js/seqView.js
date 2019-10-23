var BarChart = function(svg,pos,titleText,id,fillColor,parent){//x,y,idlist = key,value,idList
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
	//this.preprocessData();	
}

BarChart.prototype = {
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
			.range([0,height]);
		var xAxis = d3.axisBottom()
//			.scale(xScale)
			.scale(timeScale)
			// .orient("bottom")
			//.tickValues([]);

		var yAxis = d3.axisLeft()
			.scale(yScale)
			// .orient("left")
			.tickPadding(-3)
			.ticks(5);


		this.timeScale = timeScale

		this.xScale = xScale;
		this.yScale = yScale;
		this.xAxis = xAxis;
		this.yAxis = yAxis; 

		this.gBarChart.append("g")
			.attr("class","xAxis")
			.attr("transform","translate(0,"+this.height+")");

		this.gBarChart.append("g")
			.attr("class","yAxis");

		var textYPos = -10;
		var xMovement = -(this.width/0.9)*0.05;
		var yMovement = 5;

		this.gBarChart.append("text")
			.attr("transform","translate("+this.width*3.0/4.0+"," + textYPos+")")
			.text(this.titleText);
		this.gBarChart.append("text")
			.attr("transform","translate("+xMovement+","+yMovement+") rotate(-90)")
		//	.attr("transform","translate(-5,-5)")
			.text("Day")
			.style("text-anchor","end")
		this.gBarChart.append("text")
			.attr("transform","translate("+this.width*7/10.0+","+(this.height+30)+")")
			.text("Hour");
	},
	updateData:function(data){
		this.data = data;

		this.preprocessData();
		this.update();
	},
	updateData1:function(data){
		this.data = data;
		this.preprocessDataUniform();
		this.update1()
	},
	preprocessDataUniform:function(){
		var data = this.data;
		var xScale = this.xScale;
		var yScale = this.yScale;
		yScale.domain([0,data.length-1])

		var dataBlocks = []

		var disMax = 10

		for(var i=0;i<data.length;i++){
			for(var j=0;j<data[i].length;j++){
				var newItem = {
					xSt:j,
					xEd:j+1,
					xDis:1,
					y:i,
					id:data[i][j].action+","+j,
					stTime:0,
					seq:j,
					type:data[i][j].action,
					ip:data[i].ip,
					value:data[i][j].value,
					label:data[i].label
				}
				dataBlocks.push(newItem)
			}
		}

		xScale.domain([0,disMax])

		this.timeScale.domain([0,disMax/1000/3600])

		this.dataBlocks = dataBlocks
	},
	preprocessData:function(){


		var data = this.data;
		var xScale = this.xScale;
		var yScale = this.yScale;
		yScale.domain([0,data.length-1])

		var dataBlocks = []

		var disMax = 0

		for(var i=0;i<data.length;i++){
			if(!data[i].actionsTimestampQueue){
				continue;
			}
			var stTime = new Date(data[i]['@timestamp'])
			var id = data[i].PFX;
			var lastTime = stTime
			for(var j=0;j<data[i].actionsTimestampQueue.length;j++){
				var time = new Date(data[i].actionsTimestampQueue[j])
				var xDis = time - lastTime;
				var newItem = {
					xSt: lastTime,
					xEd: time,
					xDis: xDis,
					y: i,
					id: id,
					stTime:stTime,
					seq:j,
					type:data[i].actionsQueue[j],
					ip:data[i].ip
				}
				dataBlocks.push(newItem)
				lastTime = time;
			}
			var dis = lastTime - stTime;
			if(dis>disMax){
				disMax = dis;
			}
		}
		xScale.domain([0,disMax])

		this.timeScale.domain([0,disMax/1000/3600])

		this.dataBlocks = dataBlocks

	},
	update:function(){

		var xScale = this.xScale;
		var yScale = this.yScale;


		var yHeight = yScale.range()[yScale.range().length-1] - yScale.range()[0]
		var unitHeight = yHeight/yScale.domain()[yScale.domain().length-1]

		var dataBlocks = this.dataBlocks;
		// var fillColor = d3.scaleOrdinal(d3.schemeCategory10);
		var fillColor = this.fillColor

		for(var i=0;i<dataBlocks.length;i++){
			dataBlocks[i].drawX = xScale(dataBlocks[i].xSt) - xScale(dataBlocks[i].stTime)
			dataBlocks[i].width = xScale(dataBlocks[i].xEd) - xScale(dataBlocks[i].xSt)
			dataBlocks[i].drawY = yScale(dataBlocks[i].y)
			dataBlocks[i].height = unitHeight
			dataBlocks[i].color = fillColor(dataBlocks[i].type)
		}


		var _this = this;

		var gBarChart = this.gBarChart;
		gBarChart.select(".xAxis").call(this.xAxis);
		gBarChart.select(".yAxis").call(this.yAxis);

		var sel = gBarChart.selectAll("g.bar")
			.data(dataBlocks,function(d){
				return d.id +"," + d.seq;
			})
		var enter = sel.enter()
			.append("g")
			.attr("class","bar");
		enter.append("rect");
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
				return d.color
			})
			.style("fill-opacity",0.8)

		enter.merge(sel)
			.select("title")
			.text(function(d){
				return d.ip + ": " + d.type;
			})

		sel.exit().remove();
	},
	update1:function(){

		var xScale = this.xScale;
		var yScale = this.yScale;


		var opacityScale = d3.scaleLinear().domain([0,1]).range([0.1,1])		

		var yHeight = yScale.range()[yScale.range().length-1] - yScale.range()[0]
		var unitHeight = yHeight/yScale.domain()[yScale.domain().length-1]

		var dataBlocks = this.dataBlocks;
		// var fillColor = d3.scaleOrdinal(d3.schemeCategory10);
		var fillColor = this.fillColor

		for(var i=0;i<dataBlocks.length;i++){
			dataBlocks[i].drawX = xScale(dataBlocks[i].xSt) - xScale(dataBlocks[i].stTime)
			dataBlocks[i].width = xScale(dataBlocks[i].xEd) - xScale(dataBlocks[i].xSt)
			dataBlocks[i].drawY = yScale(dataBlocks[i].y)
			dataBlocks[i].height = unitHeight
			dataBlocks[i].color = fillColor(dataBlocks[i].type)
		}


		var _this = this;

		var gBarChart = this.gBarChart;
		// gBarChart.select(".xAxis").call(this.xAxis);
		gBarChart.select(".yAxis").call(this.yAxis);

		var sel = gBarChart.selectAll("g.bar")
			.data(dataBlocks,function(d){
				return d.id +"," + d.seq;
			})
		var enter = sel.enter()
			.append("g")
			.attr("class","bar");
		enter.append("rect");
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
				return d.color
			})
			.style("fill-opacity",function(d){
				return opacityScale(d.value)
			})

		enter.merge(sel)
			.select("title")
			.text(function(d){
				return "Actual action - "+ d.label + "\n" 
					+ "Predicted action - " + d.type+": " +d.value;
			})

		sel.exit().remove();

		this.gBarChart.selectAll("text").remove()
	}	
}
