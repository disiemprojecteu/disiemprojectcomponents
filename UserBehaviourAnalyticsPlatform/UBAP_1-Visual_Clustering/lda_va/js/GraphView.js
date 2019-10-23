var GraphView = function(svgName,pos,id,titleText,parent){//x,y,idlist = key,value,idList
	this.width = pos.width;
	this.height = pos.height;
	this.x = pos.x;
	this.y = pos.y;
	this.titleText = titleText;
	var margin = pos.margin;

	this.vis = d3.select("#"+svgName).append("g")
		.attr("class","documentPanel")
		.attr("transform","translate("+this.x+","+this.y+")");


	this.id = id;
	this.parent = parent;


	this.showType = "people";//content, people

	this.finished = false;
	this.updated = false;
	this.init();
	this.lastHighlight = null;
}


GraphView.prototype = {
	init: function(){
		this.vis.select(".xAxis").remove();
		this.vis.select(".yAxis").remove();
		this.vis.select("text").remove();

		var width = this.width;
		var height = this.height;

		// var xScale = d3.scaleLinear().range([0,width],0.1);
		var xScale = d3.scaleLinear().range([0,width]);

		var yScale = d3.scaleLinear()
			.range([0,height])
//			.range([height,0]);

		this.xScale = xScale;
		this.yScale = yScale;

	},
	updateData:function(graph,nodeIndex,eventIndex,fakeData){
		this.graph = graph;
		this.nodeIndex = nodeIndex;
		this.eventIndex = eventIndex;

		this.fakeData = fakeData

		this.draw()
	},
	updateData1:function(data){


		var _this = this;
		graph = data.graph
		nodeIndex = this.nodeIndex
		eventIndex = this.eventIndex;

		var width = this.width;
		var height = this.height


		var xScale = this.xScale;
		var yScale = this.yScale;

		var svg = this.vis;
		var color = d3.scaleOrdinal(d3.schemeCategory20);

		var nodes = graph.nodes;

		// nodes = nodes.splice(0,100)

		// var sizeMapping = d3.scaleLinear().domain(d3.extent(nodes.map(function(d){
  //         return d.data.children.length
  //       }))).range([3,6])
	var sizeMapping2 = d3.scaleLinear().domain([0,1,d3.max(nodes.map(function(d){
          return d.data.totalChildren
        }))]).range([4,5,6])


        xScale.domain(d3.extent(nodes.map(function(d){
        	return d.data.loc[0]
        }))).range([-width/2,width/2])
        yScale.domain(d3.extent(nodes.map(function(d){
        	return d.data.loc[1]
        }))).range([-height/2,height/2])

        for(var i=0;i<nodes.length;i++){
        	nodes[i].x = xScale(nodes[i].data.loc[0]);
        	nodes[i].y = yScale(nodes[i].data.loc[1]);
        	// console.log("nodes graph",nodes[i].x,nodes[i].y)
        }
	  var node1 = svg.append("g")
	      .attr("class", "nodes")
	      .attr("transform","translate("+[width/2,height/2]+")")


	  // var node = svg.append("g")
	  //     .attr("class", "nodes")
	  //     .attr("transform","translate("+[width/2,height/2]+")")



	  //   nodeSel = node.selectAll("g")
	  //   .data(nodes)
	  //   .enter().append("g")

	  //   nodeSel.append("circle").attr("r", function(d){
	  //       return 2
	  //       // if(!d.parent){
	  //       //   return 2
	  //       // }
	  //       // if(d.depth){
	  //       // 	return 0
	  //       // }
	  //       return sizeMapping2(d.data.totalChildren)

	  //       return sizeMapping(d.data.children.length)
	  //       return sizeMapping(d.depth)
	  //     })
	  //     .style("fill", function(d) { 
	  //       return color(d.file); 
	  //     })
	  //     .style("fill-opacity",0.3)
	  //     .style("stroke","none")
	  //     // .call(d3.drag()
	  //     //     .on("start", dragstarted)
	  //     //     .on("drag", dragged)
	  //     //     .on("end", dragended));

	  //   node.selectAll("circle")
	  //       .attr("cx", function(d) { 
	  //       	return (d.x); 
	  //       })
	  //       .attr("cy", function(d) { 
	  //       	return (d.y); 
	  //       });


	  // 	nodeSel.append("title")
	  //     .text(function(d) { 
	  //     	return d.data.name+": "+d.data.text; });

	   	drawRealMap(graph,{width:_this.width,height:_this.height},node1)


	},
	drawKeywords:function(keywordNodes,weightFunction){
		var width = this.width;
		var height = this.height;

		var _this = this;
		var level = 8;

		var threshold = 50;


		var xRange, yRange;
		xRange = [0,width]	
		yRange = [0,height]

		var xScale = d3.scaleLinear().range([0,level-1])
			.domain(xRange);

		var yScale = d3.scaleLinear().range([0,level-1])
			.domain(yRange);

		aggregateBins = [];

		for(var i=0;i<level;i++){
			for(var j=0;j<level;j++){
				var center = [xScale.invert(i),yScale.invert(j)]
				aggregateBins[i*level+j]={
					wordIndex:{},
					center:center,
					height:Math.abs(yScale.invert(j+1) - yScale.invert(j)),
					width:xScale.invert(i+1)-xScale.invert(i),
					index:i*level+j,count:0,data:[]
				};
			}
		}
		cIndex = {}
		var valDistribution = []

		for(var i=0;i<keywordNodes.length;i++){
			var x = keywordNodes[i].fx;
			var y = keywordNodes[i].fy;

			// var weight = keywordNodes[i].allNodes.length;
			// var weight = keywordNodes[i].children.length/10;

			var weight = weightFunction(keywordNodes[i])

			var xIndex = parseInt(xScale(x));
			var yIndex = parseInt(yScale(y));

			var obj = aggregateBins[xIndex*level+yIndex];
			
			for(var j=0;j<keywordNodes[i].words.length;j++){
				var word = keywordNodes[i].words[j][0]
				var val = keywordNodes[i].words[j][1];

				var wordIndex = obj.wordIndex
				if(!wordIndex[word]){
					wordIndex[word] = {data:[],val:0}
				}
				wordIndex[word].data.push(keywordNodes[i])
				wordIndex[word].val+= (+val)*weight;
			}

		}

		var wordThreshold = 0.5;

		for(var i=0;i<aggregateBins.length;i++){
			aggregateBins[i].wordList = d3.entries(aggregateBins[i].wordIndex)
			aggregateBins[i].wordList.sort(function(a,b){
				return b.value.val - a.value.val;
			})
			for(var j=0;j<aggregateBins[i].wordList.length;j++){
				valDistribution.push(aggregateBins[i].wordList[j].value.val)
			}
			aggregateBins[i].maxVal = 0
			if(aggregateBins[i].wordList && aggregateBins[i].wordList.length){
				aggregateBins[i].maxVal = aggregateBins[i].wordList[0].value.val;
			}
		}
		console.log("val",valDistribution)
		var quantileThreshold = d3.quantile(valDistribution,0.01)

		var wordMaxVal = d3.max(aggregateBins.map(function(d){
			return d.maxVal
		}))

		var sizeMapping = d3.scaleLinear().domain([0,quantileThreshold,wordMaxVal]).range([0,4,12])

		// var sizeMapping = d3.scaleLinear().domain([wordThreshold,wordMaxVal]).range([6,12])
		//depr
		// })).range([0.2,1.5])

		this.gWords = this.vis.append("g").attr("class","keywords")
		gWords = this.gWords


		var sel = gWords.selectAll("g.sourceTexts")
			.data(aggregateBins,function(d){
				return d.index;
			})

		sel.enter().append("g")
			.attr("class","sourceTexts")
			.merge(sel)
			.each(function(d){

			var _this = d3.select(this)
			var rect = {x1:d.center[0],x2:d.center[0]+d.width,
				y1:d.center[1],y2:d.center[1]+d.height}

			var keywords = d.wordList
			var threshold = 20;

			var frequency_list = [];
			for(var i=0;i<d3.min([keywords.length,threshold]);i++){
				var cVal = keywords[i].value.val;
				if(i>0 && cVal<quantileThreshold){
					continue;
				}
				frequency_list.push({text:keywords[i].key,size:sizeMapping(keywords[i].value.val),data:d.data});
			}

			d3.layout.cloud().size([rect.x2-rect.x1,Math.abs(rect.y2-rect.y1)])
        	.words(frequency_list)
        	.rotate(0)
        	.fontSize(function(d){
        		return d.size;
        	})
        	.on("end",draw)
        	.start();	

        	function draw(words){
        		var sel1 = _this.selectAll("g.keywords")
        		.data(words,function(d){
        			return d.text;
        		})

	        	var enter1 = sel1.enter().append("g")	
	        		.attr("class","keywords")
				enter1.append("text").attr("class","background")
					.attr("transform",function(d){
		        			var x = d.x + rect.x1 + (rect.x2-rect.x1)/2.0;
		        			var y = d.y + rect.y1 + (rect.y2-rect.y1)/2.0;
		        			return "translate("+[x,y]+")";
		        		})
						.text(function(d){
							return d.text
						})
						.style("font-size",function(d){
		        			return d.size + "px"
						})
						.style("stroke-width","2px")
						.style("stroke","white");


				enter1.append("text").attr("class","foreground")
					.attr("transform",function(d){
	        			var x = d.x + rect.x1 + (rect.x2-rect.x1)/2.0;
	        			var y = d.y + rect.y1 + (rect.y2-rect.y1)/2.0;
	        			return "translate("+[x,y]+")";
	        		})
					.text(function(d){
						return d.text
					})
					.style("font-size",function(d){
	        			return d.size + "px"
					})
					.style("color","#ccc");
		
	        	// sel1.select("text")
	        	// 	.text(function(d){
	        	// 		return d.text;
	        	// 	})
	        	// 	// .transition()
	        	// 	.attr("transform",function(d){
	        	// 		var x = d.x + rect.x1 + (rect.x2-rect.x1)/2.0;
	        	// 		var y = d.y + rect.y1 + (rect.y2-rect.y1)/2.0;
	        	// 		return "translate("+[x,y]+")";
	        	// 	})
	        	// 	.style("font-size",function(d){
	        	// 		return d.size
	        	// 	})

				sel1.select("text.background")
					.style("font-size",function(d){
	        			return d.size + "px"
					})

				sel1.select("text.foreground")
					.style("font-size",function(d){
	        			return d.size + "px"
					})

	        	sel1.exit().remove();
        	}		
		})

		sel.exit().remove();



	},
	updateData2:function(data){
		graph = data.graph;

		graph = this.addTimeNodes(data.graph)

		this.graph = graph

		var width = this.width;
		var height = this.height


		var xScale = this.xScale;
		var yScale = this.yScale;

        xScale.range([-width/2,width/2])
        yScale.range([-height/2,height/2])


		var svg = this.vis.append("g").attr("class","gGraph");
		var svg1 = this.vis.append("g").attr("class","gMap")
			.attr("transform","translate("+[width/2.0,height/2.0]+")");

		
		var nodes = graph.nodes;
		var edges = graph.links;

		var nodeIndex = {}
		for(var i=0;i<nodes.length;i++){
			nodeIndex[nodes[i].key] = nodes[i]
		}

		var color = d3.scaleOrdinal(d3.schemeCategory20);

		var distanceMappingWeibo = d3.scaleLinear().domain(d3.extent(edges.filter(function(d){
			return d.type && d.type=="weibo"
		}).map(function(d){
			return d.countRatio
		}))).range([50,10])

		var distanceMappingKeywords = d3.scaleLinear().domain(d3.extent(edges.filter(function(d){
			return !(d.type && d.type=="weibo")
		}).map(function(d){
			return d.countRatio
		}))).range([300,50])

		var simulation = d3.forceSimulation()
			    .force("link", 
			      d3.forceLink().id(function(d) { 
			          return d.key; 
			        })
			        // .strength(function(d){
			        // 	if(d.type && d.type=="weibo"){
			        // 		return d.count/1000
			        // 	}
			        // 	return d.count/3000
			        // })
			        .distance(function(d){
			        	if(d.type && d.type=="weibo"){
			        		return distanceMappingWeibo(d.countRatio)
			        	}else if(d.type && d.type=="time"){
			        		return 30
			        	}
			        	return distanceMappingKeywords(d.countRatio)	        	
			        	// return distanceMapping(d.countRatio)
			        	// return 20000/d.count/d.count
			        })
			      )
			    .force("charge", d3.forceManyBody()
			        .strength(-30)
			        .distanceMin(50)
			        // .distanceMax(100)
			      )
			    .force("center", d3.forceCenter(width / 2, height / 2))
			    .force("collide", d3.forceCollide(10)
			        .strength(1.5))
			    // .force("x",d3.forceX(width/2)
			    //     .strength(0.01))
			    // .force("y",d3.forceY(height/2)
			    //     .strength(0.01))
			    // .alphaDecay(0.03)
			    // // .alphaTarget(0.5)
			    // // .alpha(0.5);

	        // var sizeMapping = d3.scaleLinear().domain(d3.extent(nodes.map(function(d){
	        //   return d.depth
	        // }))).range([1,0])

			// var sizeMapping = d3.scaleLinear().domain(d3.extent(nodes.map(function(d){
			var sizeMapping = d3.scaleLinear().domain(d3.extent(nodes.map(function(d){
	          return d.value.count
	        }))).range([3,8])

	        // var linkSizeMapping = d3.scaleLinear().domain([0,2,d3.max(edges.map(function(d){
	        var linkSizeMapping = d3.scaleLinear().domain([0,d3.max(edges.map(function(d){
	          return d.count
	        }))]).range([0,3])

	  var lineSvg = d3.line()
	    .x(function(d){
	      if(!d){
	        console.log("err")
	      }
	      return d.x
	    })
	    .y(d=>d.y)
	    .curve(d3.curveBundle.beta(0.8))

	  var link = svg.append("g")
	      .attr("class", "links")
	    .selectAll("path")
	    .data(edges)
	    .enter().append("path")
	      .style("stroke-width", function(d) {
	      	// if(d.type=="fake"){
	      	// 	return
	      	// } 
	      	if(d.type=="time"){
	      		return 1
	      	}
	        return linkSizeMapping(d.count)
	        // return Math.sqrt(d.value); 
	      })
	      .style("stroke",function(d){
	      	return "black"
	        // return color(nodes[nodeIndex[d.source]].file)
	      })
	      .style("stroke-opacity",0.8);

	  var node = svg.append("g")
	      .attr("class", "nodes")

	  var node1 = svg.append("g")
	      .attr("class", "map")	      

	    nodeSel = node.selectAll("g")
	    .data(nodes)
	    .enter().append("g")



	    nodeSel.append("circle").attr("r", function(d){
	        // return 2
	        // if(!d.parent){
	        //   return 2
	        // }
	        // if(d.type=="fake"){
	        // 	return;
	        // }
	    	// if((d.type && d.type=="weibo")){
	    	// 	return d3.select(this).attr("class","weibo")
	    	// }	    	
	        return sizeMapping(d.value.count)
	        // return sizeMapping(d.depth)
	      })
	      .attr("fill", function(d) { 

	      	if(!(d.type && d.type=="weibo")){
	      		//add color
	      		// console.log("color1",color1)
	      		return d.color
	      	}else if(d.type && d.type=="time"){
	      		return "red"
	      	}

	      	return "blue"
	        return color(d.file); 
	      })
	      .style("stroke","none")
	      .call(d3.drag()
	          .on("start", dragstarted)
	          .on("drag", dragged)
	          .on("end", dragended));

	    nodeSel.append("text")
	    	.text(function(d){
	    		if(d.type && d.type=="weibo"){
	    			return ""
	    		}
	    		if(d.value.count>10){
	    			return d.key
	    		}
	    	})
	    	.style("font-size",function(d){
	    		return sizeMapping(d.value.count)*4 +"px"
	    	})

	  	nodeSel.append("title")
	      .text(function(d) { 
	      	return d.data.name+": "+d.data.text; });


	   function weightFunction(d){
	   	return d.value.count
	   }

	  // this.drawKeywords(nodes,weightFunction)

	  _this = this;

	  simulation
	      .nodes(graph.nodes)
	      .on("tick", ticked)
	      .on("end",function(d){

	        // _this.timeLayout(graph)

			svg.attr("transform","translate("+[width/2.0,height/2.0]+")");

	        xScale.domain(d3.extent(nodes.map(function(d){
	        	return d.x
	        }))).range([-width/2,width/2])
	        yScale.domain(d3.extent(nodes.map(function(d){
	        	return d.y
	        }))).range([-height/2,height/2])

	        for(var i=0;i<nodes.length;i++){
	        	nodes[i].x = xScale(nodes[i].x)
	        	nodes[i].y = yScale(nodes[i].y)
	        }
	        ticked()

	        // preDrawRealMap(graph,{width:_this.width,height:_this.height},svg1)
	        // preDrawRealMap(data.graph,{width:_this.width,height:_this.height},svg1)
	        mapView.updateData(data.graph,{width:_this.width,height:_this.height},svg1)


	        // return
			
	        // drawRealMap(graph,{width:_this.width*2,height:_this.height*2},svg)
	        console.log("end")
	        // drawPoly()
	        // drawFlow()
	        // drawVoronoi()
	        // drawPeopleTraj()
	      });

	  simulation.force("link")
	      .links(graph.links);

	  function ticked() {

	  	console.log("ticksssss")
	    // link
	    //     .attr("x1", function(d) { return d.source.x; })
	    //     .attr("y1", function(d) { return d.source.y; })
	    //     .attr("x2", function(d) { return d.target.x; })
	    //     .attr("y2", function(d) { return d.target.y; });

	    link.attr("d",function(d){
	    	// if(!(d.type && d.type=="weibo")){
	    	// 	return ""
	    	// }
	      return "M"+[d.source.x,d.source.y]+"L"+
	        [d.target.x,d.target.y]
	    })

	    // link.attr("d",function(d){
	    //   return lineSvg(d.source.path(d.target))
	    // })

	    // node.each(function(d){
	    // 	console.log(d.x,d.y)
	    // })

	    node.selectAll("circle")
	        .attr("cx", function(d) { return d.x; })
	        .attr("cy", function(d) { return d.y; })
	        // .style("fill",function(d){
	        // 	if(d.type && d.type=="weibo"){
	        // 		return "red"
	        // 	}
	        // });

	    node.selectAll("text")
	        .attr("x", function(d) { return d.x; })
	        .attr("y", function(d) { return d.y; });


	  }


			function dragstarted(d) {
			  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
			  d.fx = d.x;
			  d.fy = d.y;
			}

			function dragged(d) {
			  d.fx = d3.event.x;
			  d.fy = d3.event.y;
			}

			function dragended(d) {
			  if (!d3.event.active) simulation.alphaTarget(0);
			  d.fx = null;
			  d.fy = null;
			}

		this.nodeSel = node
		this.linkSel = link;

	},
	addTimeNodes:function(graph){
		var newNodes = []
		var newLinks = []

		var nodes = graph.nodes;
		var links = graph.links;

		var slotIndex = {}

		for(var i=0;i<nodes.length;i++){
			var slot = nodes[i].slotIndex
			if(!slot && slot!=0){
				continue;
			}
			if(!slotIndex[slot]){
				slotIndex[slot] = {id:"slot"+slot,key:"slot"+slot,
					slot:i,keywords:[],value:{count:0},
					data:{name:"slot"+slot},type:"time"}
			}
			slotIndex[slot].keywords.push(nodes[i])
			slotIndex[slot].value.count++;
		}

		for(var i in slotIndex){
			newNodes.push(slotIndex[i])
		}
		for(var i=0;i<newNodes.length;i++){
			var words = newNodes[i].keywords;
			for(var j=0;j<words.length;j++){
				newLinks.push({
					source:newNodes[i].key,
					target:words[j].key,
					count:1,
					type:"time"
				})
			}
		}

		var newGraph = {}

		newGraph.nodes = graph.nodes.concat(newNodes)
		newGraph.links = graph.links.concat(newLinks)

		return newGraph
	},
	// notifyMap:function(width,height,graph,svg){
	// },
	timeLayout:function(graph){
		var newGraph = this.addTimeNodes(graph);
		this.updateGraphLayout(graph,newGraph);
	},
	weiboLayout:function(graph,newGraph){
		this.updateGraphLayout(graph,newGraph)
	},
	updateGraphLayout:function(graph,newGraph,notifyNewGraph){

		// var newGraph = this.addTimeNodes(graph)

		var width = this.width;
		var height = this.height


		var xScale = this.xScale;
		var yScale = this.yScale;

        xScale.range([-width/2,width/2])
        yScale.range([-height/2,height/2])


		var svg = this.vis.select("g.gGraph");
		var svg1 = this.vis.select("g.gMap")
			// .attr("transform","translate("+[width/2.0,height/2.0]+")");

		
		var nodes = newGraph.nodes;
		var edges = newGraph.links;

		var nodeIndex = {}
		for(var i=0;i<nodes.length;i++){
			nodeIndex[nodes[i].key] = nodes[i]
		}

		var color = d3.scaleOrdinal(d3.schemeCategory20);

		var distanceMappingWeibo = d3.scaleLinear().domain(d3.extent(edges.filter(function(d){
			return d.type && d.type=="weibo"
		}).map(function(d){
			return d.countRatio
		}))).range([50,10])

		var distanceMappingKeywords = d3.scaleLinear().domain(d3.extent(edges.filter(function(d){
			return !(d.type && d.type=="weibo")
		}).map(function(d){
			return d.countRatio
		}))).range([300,50])

		var simulation = d3.forceSimulation()
			    .force("link", 
			      d3.forceLink().id(function(d) { 
			          return d.key; 
			        })
			        // .strength(function(d){
			        // 	if(d.type && d.type=="weibo"){
			        // 		return d.count/1000
			        // 	}
			        // 	return d.count/3000
			        // })
			        .distance(function(d){
			        	if(d.type && d.type=="weibo"){
			        		return distanceMappingWeibo(d.countRatio)
			        	}else if(d.type && d.type=="time"){
			        		return 30
			        	}
			        	return distanceMappingKeywords(d.countRatio)	        	
			        	// return distanceMapping(d.countRatio)
			        	// return 20000/d.count/d.count
			        })
			      )
			    .force("charge", d3.forceManyBody()
			        .strength(-30)
			        .distanceMin(50)
			        // .distanceMax(100)
			      )
			    .force("center", d3.forceCenter(width / 2, height / 2))
			    .force("collide", d3.forceCollide(10)
			        .strength(1.5))
			    // .force("x",d3.forceX(width/2)
			    //     .strength(0.01))
			    // .force("y",d3.forceY(height/2)
			    //     .strength(0.01))
			    // .alphaDecay(0.3)
			    // // .alphaTarget(0.5)
			    // .alpha(0.5);

	        // var sizeMapping = d3.scaleLinear().domain(d3.extent(nodes.map(function(d){
	        //   return d.depth
	        // }))).range([1,0])

			// var sizeMapping = d3.scaleLinear().domain(d3.extent(nodes.map(function(d){
			var sizeMapping = d3.scaleLinear().domain(d3.extent(nodes.map(function(d){
	          return d.value.count
	        }))).range([3,8])

	        // var linkSizeMapping = d3.scaleLinear().domain([0,2,d3.max(edges.map(function(d){
	        var linkSizeMapping = d3.scaleLinear().domain([0,1,d3.max(edges.map(function(d){
	          return d.count
	        }))]).range([0,0.5,2])

	  var lineSvg = d3.line()
	    .x(function(d){
	      if(!d){
	        console.log("err")
	      }
	      return d.x
	    })
	    .y(d=>d.y)
	    .curve(d3.curveBundle.beta(0.8))

	  var linkSel = svg.select("g.links").selectAll("path")
	    .data(edges)

	  var link = linkSel.enter().append("path")
	      .style("stroke-width", function(d) {
	      	// if(d.type=="fake"){
	      	// 	return
	      	// } 
	      	if(d.type=="time"){
	      		return 0.5
	      	}
	        return linkSizeMapping(d.count)
	        // return Math.sqrt(d.value); 
	      })
	      .style("stroke",function(d){
	      	return "red"
	        // return color(nodes[nodeIndex[d.source]].file)
	      })
	      .style("stroke-opacity",function(d){
	      	if(d.type=="time"){
	      		return 0.8
	      	}else{
	      		return 0.2
	      	}
	      });

	  link = link.merge(linkSel)

	  var node = svg.select("g.nodes")

	    nodeSel = node.selectAll("g")
	    .data(nodes)

	    var nodeEnter = nodeSel.enter().append("g")

	    nodeEnter.append("circle")
	    nodeEnter.append("text")
	    nodeEnter.append("title")


	    nodeEnter.merge(nodeSel).select("circle").attr("r", function(d){
	        // return 2
	        // if(!d.parent){
	        //   return 2
	        // }
	        // if(d.type=="fake"){
	        // 	return;
	        // }
	    	// if((d.type && d.type=="weibo")){
	    	// 	return d3.select(this).attr("class","weibo")
	    	// }	    	
	        return sizeMapping(d.value.count)
	        // return sizeMapping(d.depth)
	      })
	      .attr("fill", function(d) { 

	      	if(!(d.type && d.type=="weibo")){
	      		//add color
	      		// console.log("color1",color1)
	      		return d.color
	      	}else if(d.type && d.type=="time"){
	      		return "red"
	      	}

	      	return "blue"
	        return color(d.file); 
	      })
	      .style("stroke","none")
	      .call(d3.drag()
	          .on("start", dragstarted)
	          .on("drag", dragged)
	          .on("end", dragended));

	    nodeEnter.merge(nodeSel).select("text")
	    	.text(function(d){
	    		if(d.type && d.type=="weibo"){
	    			return ""
	    		}
	    		if(d.type && d.type=="time"){
	    			return d.key
	    		}
	    		if(d.value.count>10){
	    			return d.key
	    		}
	    	})
	    	.style("font-size",function(d){
	    		return sizeMapping(d.value.count)/4 +"em"
	    	})

	  	nodeEnter.merge(nodeSel).select("title")
	      .text(function(d) { 
	      	return d.data.name+": "+d.data.text; 
	      });


	   function weightFunction(d){
	   	return d.value.count
	   }

	  // this.drawKeywords(nodes,weightFunction)

	  _this = this;

	  simulation
	      .nodes(nodes)
	      .on("tick", ticked)
	      .on("end",function(d){

			svg.attr("transform","translate("+[width/2.0,height/2.0]+")");

	        xScale.domain(d3.extent(nodes.map(function(d){
	        	return d.x
	        }))).range([-width/2,width/2])
	        yScale.domain(d3.extent(nodes.map(function(d){
	        	return d.y
	        }))).range([-height/2,height/2])

	        for(var i=0;i<nodes.length;i++){
	        	nodes[i].x = xScale(nodes[i].x)
	        	nodes[i].y = yScale(nodes[i].y)
	        }
	        tickedTransition()

	        // svg.style("display","none")

	        // preDrawRealMap(graph,{width:_this.width,height:_this.height},svg1)


	        // _this.timeLayout(graph)

	        // _this.notifyMap(width,height,graph,svg1)

	        // return
			
	        // drawRealMap(graph,{width:_this.width*2,height:_this.height*2},svg)
	        console.log("end")
	        // drawPoly()
	        // drawFlow()
	        // drawVoronoi()
	        // drawPeopleTraj()
	      });

	  simulation.force("link")
	      .links(edges);

	  function tickedTransition(){

		var t = d3.transition()
		    .duration(1000)
		    .ease(d3.easeLinear);

 // function endall(transition, callback) { 
 //    if (transition.size() === 0) { callback() }
 //    var n = 0; 
 //    transition 
 //        .each(function() { ++n; }) 
 //        .each("end", function() { if (!--n) callback.apply(this, arguments); }); 
 //  } 


	    link.attr("d",function(d){
	    	// if(!(d.type && d.type=="weibo")){
	    	// 	return ""
	    	// }
	      return "M"+[d.source.x,d.source.y]+"L"+
	        [d.target.x,d.target.y]
	    }).transition(t)
	    	.style("stroke-opacity",0)

	    node.selectAll("circle")
	        .attr("cx", function(d) { return d.x; })
	        .attr("cy", function(d) { return d.y; })
	        .transition(t)
	    	.style("fill-opacity",0)
	        // .style("fill",function(d){
	        // 	if(d.type && d.type=="weibo"){
	        // 		return "red"
	        // 	}
	        // });

		var flag = false;

	    node.selectAll("text")
	        .attr("x", function(d) { return d.x; })
	        .attr("y", function(d) { return d.y; })
			.transition(t)
	    	.style("fill-opacity",0)
	    	.on("end",function(d){
	    		if(!flag){
		    		flag = true;	    			
			        mapView.initData(graph,{width:_this.width,height:_this.height},svg1)	
	    		}
	    		console.log("end transition")
	    	})



	  }

	  function ticked() {


	  	console.log("ticksssss")
	    // link
	    //     .attr("x1", function(d) { return d.source.x; })
	    //     .attr("y1", function(d) { return d.source.y; })
	    //     .attr("x2", function(d) { return d.target.x; })
	    //     .attr("y2", function(d) { return d.target.y; });

	    link.attr("d",function(d){
	    	// if(!(d.type && d.type=="weibo")){
	    	// 	return ""
	    	// }
	      return "M"+[d.source.x,d.source.y]+"L"+
	        [d.target.x,d.target.y]
	    })

	    // link.attr("d",function(d){
	    //   return lineSvg(d.source.path(d.target))
	    // })

	    // node.each(function(d){
	    // 	console.log(d.x,d.y)
	    // })

	    node.selectAll("circle")
	        .attr("cx", function(d) { return d.x; })
	        .attr("cy", function(d) { return d.y; })
	        // .style("fill",function(d){
	        // 	if(d.type && d.type=="weibo"){
	        // 		return "red"
	        // 	}
	        // });

	    node.selectAll("text")
	        .attr("x", function(d) { return d.x; })
	        .attr("y", function(d) { return d.y; });


	  }


			function dragstarted(d) {
			  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
			  d.fx = d.x;
			  d.fy = d.y;
			}

			function dragged(d) {
			  d.fx = d3.event.x;
			  d.fy = d3.event.y;
			}

			function dragended(d) {
			  if (!d3.event.active) simulation.alphaTarget(0);
			  d.fx = null;
			  d.fy = null;
			}

		this.nodeSel = node
		this.linkSel = link;

	},
	updateData3:function(data){
		graph = data.graph;

		var allGraph = this.addTimeNodes(data.graph)

		var graph = allGraph

		var currentGraph = {nodes:[],links:[]}
		for(var i=0;i<graph.nodes.length;i++){
			if(graph.nodes[i].type=="weibo"){
				continue;
			}
			currentGraph.nodes.push(graph.nodes[i])
		}
		for(var i=0;i<graph.links.length;i++){
			if(graph.links[i].type=="weibo"){
				continue;
			}
			currentGraph.links.push(graph.links[i])
		}

		var graph = currentGraph

		var width = this.width;
		var height = this.height


		var xScale = this.xScale;
		var yScale = this.yScale;

        xScale.range([-width/2,width/2])
        yScale.range([-height/2,height/2])


		var svg = this.vis.append("g").attr("class","gGraph");
		var svg1 = this.vis.append("g").attr("class","gMap")
			.attr("transform","translate("+[width/2.0,height/2.0]+")");

		
		var nodes = graph.nodes;
		var edges = graph.links;

		var nodeIndex = {}
		for(var i=0;i<nodes.length;i++){
			nodeIndex[nodes[i].key] = nodes[i]
		}

		var color = d3.scaleOrdinal(d3.schemeCategory20);

		var distanceMappingWeibo = d3.scaleLinear().domain(d3.extent(edges.filter(function(d){
			return d.type && d.type=="weibo"
		}).map(function(d){
			return d.countRatio
		}))).range([50,10])

		var distanceMappingKeywords = d3.scaleLinear().domain(d3.extent(edges.filter(function(d){
			return !(d.type && d.type=="weibo")
		}).map(function(d){
			return d.countRatio
		}))).range([300,50])

		var simulation = d3.forceSimulation()
			    .force("link", 
			      d3.forceLink().id(function(d) { 
			          return d.key; 
			        })
			        // .strength(function(d){
			        // 	if(d.type && d.type=="weibo"){
			        // 		return d.count/1000
			        // 	}
			        // 	return d.count/3000
			        // })
			        .distance(function(d){
			        	if(d.type && d.type=="weibo"){
			        		return distanceMappingWeibo(d.countRatio)
			        	}else if(d.type && d.type=="time"){
			        		return 30
			        	}
			        	return distanceMappingKeywords(d.countRatio)	        	
			        	// return distanceMapping(d.countRatio)
			        	// return 20000/d.count/d.count
			        })
			      )
			    .force("charge", d3.forceManyBody()
			        .strength(-30)
			        .distanceMin(50)
			        // .distanceMax(100)
			      )
			    .force("center", d3.forceCenter(width / 2, height / 2))
			    .force("collide", d3.forceCollide(10)
			        .strength(1.5))
			    // .force("x",d3.forceX(width/2)
			    //     .strength(0.01))
			    // .force("y",d3.forceY(height/2)
			    //     .strength(0.01))
			    // .alphaDecay(0.3)
			    // .alphaTarget(0.5)
			    // // .alpha(0.5);

	        // var sizeMapping = d3.scaleLinear().domain(d3.extent(nodes.map(function(d){
	        //   return d.depth
	        // }))).range([1,0])

			// var sizeMapping = d3.scaleLinear().domain(d3.extent(nodes.map(function(d){
			var sizeMapping = d3.scaleLinear().domain(d3.extent(nodes.map(function(d){
	          return d.value.count
	        }))).range([3,8])

	        // var linkSizeMapping = d3.scaleLinear().domain([0,2,d3.max(edges.map(function(d){
	        var linkSizeMapping = d3.scaleLinear().domain([0,1,d3.max(edges.map(function(d){
	          return d.count
	        }))]).range([0,0.5,2])

	  var lineSvg = d3.line()
	    .x(function(d){
	      if(!d){
	        console.log("err")
	      }
	      return d.x
	    })
	    .y(d=>d.y)
	    .curve(d3.curveBundle.beta(0.8))

	  var link = svg.append("g")
	      .attr("class", "links")
	    .selectAll("path")
	    .data(edges)
	    .enter().append("path")
	      .style("stroke-width", function(d) {
	      	// if(d.type=="fake"){
	      	// 	return
	      	// } 
	      	if(d.type=="time"){
	      		return 0.5
	      	}
	        return linkSizeMapping(d.count)
	        // return Math.sqrt(d.value); 
	      })
	      .style("stroke",function(d){
	      	if(d.type=="time"){
	      		return "red"
	      	}
	      	return "black"
	        // return color(nodes[nodeIndex[d.source]].file)
	      })
	      .style("stroke-opacity",function(d){
	      	if(d.type=="time"){
	      		return 0.8
	      	}else{
	      		return 0.2
	      	}	      	
	      });

	  var node = svg.append("g")
	      .attr("class", "nodes")

	  var node1 = svg.append("g")
	      .attr("class", "map")	      

	    nodeSel = node.selectAll("g")
	    .data(nodes)
	    .enter().append("g")



	    nodeSel.append("circle").attr("r", function(d){
	        // return 2
	        // if(!d.parent){
	        //   return 2
	        // }
	        // if(d.type=="fake"){
	        // 	return;
	        // }
	    	// if((d.type && d.type=="weibo")){
	    	// 	return d3.select(this).attr("class","weibo")
	    	// }	    	
	        return sizeMapping(d.value.count)
	        // return sizeMapping(d.depth)
	      })
	      .attr("fill", function(d) { 

	      	if(!(d.type && d.type=="weibo")){
	      		//add color
	      		// console.log("color1",color1)
	      		return d.color
	      	}else if(d.type && d.type=="time"){
	      		return "red"
	      	}

	      	return "blue"
	        return color(d.file); 
	      })
	      .style("stroke","none")
	      .call(d3.drag()
	          .on("start", dragstarted)
	          .on("drag", dragged)
	          .on("end", dragended));

	    nodeSel.append("text")
	    	.text(function(d){
	    		if(d.type && d.type=="weibo"){
	    			return ""
	    		}
	    		if(d.value.count>10){
	    			return d.key
	    		}
	    	})
	    	.style("font-size",function(d){
	    		return sizeMapping(d.value.count)/5 +"em"
	    	})

	  	nodeSel.append("title")
	      .text(function(d) { 
	      	return d.data.name+": "+d.data.text; });


	   function weightFunction(d){
	   	return d.value.count
	   }

	  // this.drawKeywords(nodes,weightFunction)

	  _this = this;

	  simulation
	      .nodes(graph.nodes)
	      .on("tick", ticked)
	      .on("end",function(d){

	        // _this.timeLayout(graph)

	        _this.weiboLayout(data.graph,allGraph)

			// svg.attr("transform","translate("+[width/2.0,height/2.0]+")");

	  //       xScale.domain(d3.extent(nodes.map(function(d){
	  //       	return d.x
	  //       }))).range([-width/2,width/2])
	  //       yScale.domain(d3.extent(nodes.map(function(d){
	  //       	return d.y
	  //       }))).range([-height/2,height/2])

	  //       for(var i=0;i<nodes.length;i++){
	  //       	nodes[i].x = xScale(nodes[i].x)
	  //       	nodes[i].y = yScale(nodes[i].y)
	  //       }
	  //       ticked()

	  //       // preDrawRealMap(graph,{width:_this.width,height:_this.height},svg1)
	  //       // preDrawRealMap(data.graph,{width:_this.width,height:_this.height},svg1)
	  //       mapView.updateData(data.graph,{width:_this.width,height:_this.height},svg1)


	        // return
			
	        // drawRealMap(graph,{width:_this.width*2,height:_this.height*2},svg)
	        console.log("end")
	        // drawPoly()
	        // drawFlow()
	        // drawVoronoi()
	        // drawPeopleTraj()
	      });

	  simulation.force("link")
	      .links(graph.links);

	  function ticked() {

	  	console.log("ticksssss")
	    // link
	    //     .attr("x1", function(d) { return d.source.x; })
	    //     .attr("y1", function(d) { return d.source.y; })
	    //     .attr("x2", function(d) { return d.target.x; })
	    //     .attr("y2", function(d) { return d.target.y; });

	    link.attr("d",function(d){
	    	// if(!(d.type && d.type=="weibo")){
	    	// 	return ""
	    	// }
	      return "M"+[d.source.x,d.source.y]+"L"+
	        [d.target.x,d.target.y]
	    })

	    // link.attr("d",function(d){
	    //   return lineSvg(d.source.path(d.target))
	    // })

	    // node.each(function(d){
	    // 	console.log(d.x,d.y)
	    // })

	    node.selectAll("circle")
	        .attr("cx", function(d) { return d.x; })
	        .attr("cy", function(d) { return d.y; })
	        // .style("fill",function(d){
	        // 	if(d.type && d.type=="weibo"){
	        // 		return "red"
	        // 	}
	        // });

	    node.selectAll("text")
	        .attr("x", function(d) { return d.x; })
	        .attr("y", function(d) { return d.y; });

	       
	  }


			function dragstarted(d) {
			  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
			  d.fx = d.x;
			  d.fy = d.y;
			}

			function dragged(d) {
			  d.fx = d3.event.x;
			  d.fy = d3.event.y;
			}

			function dragended(d) {
			  if (!d3.event.active) simulation.alphaTarget(0);
			  d.fx = null;
			  d.fy = null;
			}

		this.nodeSel = node
		this.linkSel = link;

	},	
	draw:function(){

		var _this = this;
		graph = this.graph
		nodeIndex = this.nodeIndex
		eventIndex = this.eventIndex;

		var width = this.width;
		var height = this.height


		var xScale = this.xScale;
		var yScale = this.yScale;

		var svg = this.vis;

		var nodes = graph.nodes;
		var edges = graph.links;

		var oriNodes = [];
		var oriEdges = []
		for(var i=0;i<nodes.length;i++){
			oriNodes.push(nodes[i])
		}
		for(var i=0;i<edges.length;i++){
			oriEdges.push(edges[i])
		}

		var fakeData = this.fakeData;
		for(var i=0;i<fakeData.length;i++){
			fakeData[i].type = "fake"
			nodes.push(fakeData[i])
		}
		for(var i=0;i<fakeData.length;i++){
			var source = fakeData[i].data.mid
			var rawData = fakeData[i].rawData;
			for(var j=0;j<rawData.length;j++){
				var target = rawData[j].data.mid;
				if(nodeIndex[target]){
					edges.push({
						source:source,
						target:target,
						type:"fake"
					})					
				}
			}
		}



		var color = d3.scaleOrdinal(d3.schemeCategory20);

			var simulation = d3.forceSimulation()
			    .force("link", 
			      d3.forceLink().id(function(d) { 
			          return d.data.mid; 
			        })
			        .strength(3)
			        .distance(2)
			      )
			    .force("charge", d3.forceManyBody()
			        .strength(-1)
			        // .distanceMax(100)
			      )
			    // .force("center", d3.forceCenter(width / 2, height / 2))
			    .force("collide", d3.forceCollide(4)
			        .strength(1.5))
			    // .force("x",d3.forceX(width/2)
			    //     .strength(0.01))
			    // .force("y",d3.forceY(height/2)
			    //     .strength(0.01))
			    .alphaDecay(0.03)
			    // .alphaTarget(0.5)
			    // .alpha(0.5);

	        // var sizeMapping = d3.scaleLinear().domain(d3.extent(nodes.map(function(d){
	        //   return d.depth
	        // }))).range([1,0])

			// var sizeMapping = d3.scaleLinear().domain(d3.extent(nodes.map(function(d){
			var sizeMapping = d3.scaleLinear().domain(d3.extent(oriNodes.map(function(d){
	          return d.children.length
	        }))).range([1,4])

	        // var linkSizeMapping = d3.scaleLinear().domain([0,2,d3.max(edges.map(function(d){
	        var linkSizeMapping = d3.scaleLinear().domain([0,2,d3.max(oriEdges.map(function(d){
	          return nodes[nodeIndex[d.source]].depth
	        }))]).range([1,0.5,0.1])

	  var lineSvg = d3.line()
	    .x(function(d){
	      if(!d){
	        console.log("err")
	      }
	      return d.x
	    })
	    .y(d=>d.y)
	    .curve(d3.curveBundle.beta(0.8))

	  var link = svg.append("g")
	      .attr("class", "links")
	    .selectAll("path")
	    .data(oriEdges)
	    .enter().append("path")
	      .style("stroke-width", function(d) {
	      	if(d.type=="fake"){
	      		return
	      	} 
	        return linkSizeMapping(nodes[nodeIndex[d.source]].depth)
	        // return Math.sqrt(d.value); 
	      })
	      .style("stroke",function(d){
	        return color(nodes[nodeIndex[d.source]].file)
	      })
	      .style("stroke-opacity",0.2);

	  var node = svg.append("g")
	      .attr("class", "nodes")

	    nodeSel = node.selectAll("g")
	    .data(oriNodes)
	    .enter().append("g")

	    nodeSel.append("circle").attr("r", function(d){
	        // return 2
	        // if(!d.parent){
	        //   return 2
	        // }
	        if(d.type=="fake"){
	        	return;
	        }
	        return sizeMapping(d.children.length)
	        return sizeMapping(d.depth)
	      })
	      .attr("fill", function(d) { 
	        return color(d.file); 
	      })
	      .style("stroke","none")
	      .call(d3.drag()
	          .on("start", dragstarted)
	          .on("drag", dragged)
	          .on("end", dragended));

	  	nodeSel.append("title")
	      .text(function(d) { 
	      	return d.data.name+": "+d.data.text; });

	   // var fixedNodes = this.getFixedNodes(nodes)
	   var fixedNodes = this.getFakeFixedNodes(fakeData)

	   function weightFunction(d){
	   	return d.rawData.length
	   }

	  this.drawKeywords(fixedNodes,weightFunction)


	  simulation
	      .nodes(graph.nodes)
	      .on("tick", ticked)
	      .on("end",function(d){
	        // return

	        drawRealMap(graph.nodes,{width:_this.width*2,height:_this.height*2},svg)
	        console.log("end")
	        // drawPoly()
	        // drawFlow()
	        // drawVoronoi()
	        // drawPeopleTraj()
	      });

	  simulation.force("link")
	      .links(graph.links);

	  function ticked() {
	    // link
	    //     .attr("x1", function(d) { return d.source.x; })
	    //     .attr("y1", function(d) { return d.source.y; })
	    //     .attr("x2", function(d) { return d.target.x; })
	    //     .attr("y2", function(d) { return d.target.y; });

	    // link.attr("d",function(d){
	    //   return "M"+[d.source.x,d.source.y]+"L"+
	    //     [d.target.x,d.target.y]
	    // })

	    link.attr("d",function(d){
	      return lineSvg(d.source.path(d.target))
	    })

	    // node.each(function(d){
	    // 	console.log(d.x,d.y)
	    // })

	    node.selectAll("circle")
	        .attr("cx", function(d) { return d.x; })
	        .attr("cy", function(d) { return d.y; });
	  }


			function dragstarted(d) {
			  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
			  d.fx = d.x;
			  d.fy = d.y;
			}

			function dragged(d) {
			  d.fx = d3.event.x;
			  d.fy = d3.event.y;
			}

			function dragended(d) {
			  if (!d3.event.active) simulation.alphaTarget(0);
			  d.fx = null;
			  d.fy = null;
			}

		this.nodeSel = node
		this.linkSel = link;
	},
	getFakeFixedNodes:function(fakeData){
		var width = this.width;
		var height = this.height;

		var fixedNodes = []
		for(var i=0;i<fakeData.length;i++){
			if(fakeData[i].projPos){
				fixedNodes.push(fakeData[i])
				fakeData[i].fx = fakeData[i].projPos[0]
				fakeData[i].fy = fakeData[i].projPos[1]
			}
		}

		var projXScale = d3.scaleLinear().domain(d3.extent(fixedNodes.map(function(d){
			return d.fx
		}))).range([width/5.0,width*4.0/5.0])
		var projYScale = d3.scaleLinear().domain(d3.extent(fixedNodes.map(function(d){
			return d.fy
		}))).range([height/5.0,height*4.0/5.0])

		for(var i=0;i<fakeData.length;i++){
			if(fakeData[i].projPos){
				// fixedNodes.push(nodes[i])
				fakeData[i].fx = projXScale(fakeData[i].projPos[0]);
				fakeData[i].fy = projYScale(fakeData[i].projPos[1]); 
			}

		}
		return fixedNodes;

	},
	getFixedNodes:function(nodes){

		var width = this.width;
		var height = this.height;

		var fixedNodes = []
		for(var i=0;i<nodes.length;i++){
			if(nodes[i].projPos){
				fixedNodes.push(nodes[i])
				nodes[i].fx = nodes[i].projPos[0];
			nodes[i].fy = nodes[i].projPos[1]; 
			}
		}

		var projXScale = d3.scaleLinear().domain(d3.extent(fixedNodes.map(function(d){
			return d.fx
		}))).range([width/5.0,width*4.0/5.0])
		var projYScale = d3.scaleLinear().domain(d3.extent(fixedNodes.map(function(d){
			return d.fy
		}))).range([height/5.0,height*4.0/5.0])


		// xScale.domain(d3.extent(fixedNodes.map(function(d){
		// 	return d.fx
		// })))
		// yScale.domain(d3.extent(fixedNodes.map(function(d){
		// 	return d.fy
		// })))

		for(var i=0;i<nodes.length;i++){
			if(nodes[i].projPos){
				// fixedNodes.push(nodes[i])
				nodes[i].fx = projXScale(nodes[i].projPos[0]);
			nodes[i].fy = projYScale(nodes[i].projPos[1]); 
			console.log(nodes[i].fx,nodes[i].fy)
			}
			// nodes[i].fx = 100
			// nodes[i].fy = 400
		}

		return fixedNodes
	},
	highlightTimeRange:function(timeRange){
		var node = this.nodeSel;
		var link = this.linkSel;



		// d3.selectAll("g>circle").style("stroke",function(d){
		// 	if(d.dateTime>=timeRange[0] && d.dateTime<=timeRange[1]){
		// 		return "black"
		// 	}else{
		// 		return "none"
		// 	}
		// })
	},
}