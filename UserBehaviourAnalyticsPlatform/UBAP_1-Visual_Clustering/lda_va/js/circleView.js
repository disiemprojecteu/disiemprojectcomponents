var CircleView = function(svg,pos,titleText,id,fillColor,parent){//x,y,idlist = key,value,idList
	// this.svgName = gSVGName;
	//this.data = data;
	this.width = pos.width;
	this.height = pos.height;
	this.x = pos.x;
	this.y = pos.y;
	this.radius = d3.min([this.width/2.0,this.height/2.0])
	this.fillColor = fillColor;
	this.titleText = titleText;

	// this.gCircleView = d3.select("#"+this.svgName).append("g")
	// 	.attr("class","sequence")
	// 	.attr("id","barChart"+id)
	// 	.attr("transform","translate("+this.x+","+this.y+")");
	this.gCircleView = svg
		// .attr("transform","translate("+this.x+","+this.y+")")
	    .attr("transform", "translate(" + (this.x+ this.width / 2) + "," + (this.y + this.height / 2) + ")");

	this.id = id;
	this.parent = parent;
	this.init();
	//this.preprocessData();	
}

CircleView.prototype = {
	init:function(){

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

	},
	updateData:function(data){
		this.data = data;

		this.preprocessData();
		this.update();
	},
	preprocessData:function(){

		var radius = this.radius;

		var partition = d3.partition()
		    .size([2 * Math.PI, radius * radius]);

		var arc = d3.arc()
		    .startAngle(function(d) { return d.x0+0.01; })
		    .endAngle(function(d) { return d.x1-0.01; })
		    .innerRadius(function(d) { return Math.sqrt(d.y0); })
		    .outerRadius(function(d) { return Math.sqrt(d.y1); });


  // Turn the data into a d3 hierarchy and calculate the sums.
 		 var root = this.data
 		 	  .sum(function(d){
 		 	  	return d.leafSize
 		 	  })
		      // .sum(function(d) { return d.size; })
		      // .sort(function(a, b) { return b.value - a.value; });

		  // For efficiency, filter nodes to keep only those large enough to see.
		  var nodes = partition(root).descendants()
		      // .filter(function(d) {
		      //     return (d.x1 - d.x0 > 0.005); // 0.005 radians = 0.29 degrees
		      // });

		 this.root = root;
		 this.nodes = nodes;
		 this.arc = arc;
		 this.partition = partition;

	},
	refresh:function(fillColor){
		this.fillColor = fillColor
		this.update();
	},
	update:function(){

		var radius = this.radius
		var nodes =this.nodes;

		var root = this.root;
		var arc = this.arc;

		var vis = this.gCircleView;
		vis.select("circle").remove();

		// var fillColor = d3.scaleOrdinal(d3.schemeCategory10);
		var fillColor = this.fillColor

    // Bounding circle underneath the sunburst, to make it easier to detect
  // when the mouse leaves the parent g.
  vis.append("svg:circle")
      .attr("r", radius)
      .style("opacity", 0);

     // vis.selectAll("g.items").remove()


  // var path = vis.data([root]).selectAll("path")
  //     .data(nodes)
  //     .enter().append("svg:path")
  //     .attr("display", function(d) { return d.depth ? null : "none"; })
  //     .attr("d", arc)
  //     .style("stroke","none")
  //     // .attr("fill-rule", "evenodd")
  //     .style("fill", function(d) { return fillColor(d.data.name); })
  //     .style("opacity", 1)
  //     // .on("mouseover", mouseover);


  var sel = vis.selectAll("g.bar")
  	.data(nodes,function(d){
  		return d.id
  	})

  var enter = sel.enter().append("g")
  	.attr("class","bar")

  enter.append("path")
  enter.append("title")

  enter.merge(sel)
  	.select("path")
    .attr("display", function(d) { return d.depth ? null : "none"; })
	.attr("d", arc)
	.style("stroke","none")
	// .attr("fill-rule", "evenodd")
	.style("fill", function(d) { return fillColor(d.data.name); })
	.style("opacity", 1)

  enter.merge(sel)
  	.select("title")
  	.text(function(d){
  		return d.data.name+":"+d.data.size
  	})

  sel.exit().remove()

  // Add the mouseleave handler to the bounding circle.
  // d3.select("#container").on("mouseleave", mouseleave);

  // Get total size of the tree = value of root node from partition.
  // totalSize = path.datum().value;


	}
}




