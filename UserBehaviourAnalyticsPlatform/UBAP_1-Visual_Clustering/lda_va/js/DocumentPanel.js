

var DocumentPanel = function(svgName,pos,id,titleText,parent){//x,y,idlist = key,value,idList
	// this.width = pos.width;
	// this.height = pos.height;
	// this.x = pos.x;
	// this.y = pos.y;
	// this.titleText = titleText;
	// var margin = pos.margin;

	// this.vis = d3.select("#"+svgName).append("g")
	// 	.attr("class","documentPanel")
	// 	.attr("transform","translate("+this.x+","+this.y+")");


	// this.id = id;
	// this.parent = parent;

	// this.showType = "people";//content, people

	// this.finished = false;
	// this.updated = false;
	// this.init();
	// this.lastHighlight = null;
}

// function notifyHistogramFilter(data,dataSel,isPair){
// 	linkFilter.updateData(data,dataSel,isPair);
// }

// function notifyKeywordsSelection(data){
// 	myCircos.circularWidget.updateClickUserData(data.data);
// }

DocumentPanel.prototype = {
	init: function(){
		this.vis.select(".xAxis").remove();
		this.vis.select(".yAxis").remove();
		this.vis.select("text").remove();

		var width = this.width;
		var height = this.height;

		var xScale = d3.scale.linear().range([0,width],0.1);
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
		this.resetPolyBrush()
	
// 		this.vis.append("g")
// 			.attr("class","xAxis")
// 			.attr("transform","translate(0,"+this.height+")");

// 		this.vis.append("g")
// 			.attr("class","yAxis");

// 		var textYPos = -10;
// 		var xMovement = -23;
// //		var xMovement = -(this.width/0.9)*0.05;
// 		var yMovement = 20;

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
	updateDocument:function(dataList,_callback){
		var _this = this;

		this._callback = _callback
		this.finished = false;
		function runProjection(data,matrix){
			// console.log(data,matrix)
			onmessage({data:{distance:matrix,cmd:"init"},obj:_this})
			_this.finished = true;
		}
		this.dataList = dataList;
		preprocessKeywords(dataList,runProjection,_callback);

	},
	refresh:function(){
		this.updated = false;

		this.updateData();
	},
	updateData:function(data,finishFlag){

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

		if(finishFlag){
			this._callback(dataList)
		}

		// this.preprocessData(finishFlag);

		// if(finishFlag){
		// 	var id = dataList[0].index;
		// 	var nodes = {}
		// 	nodes[id] = true;

		// 	// this.highlightNode(nodes)

		// }
		// if(!this.updated){
		// 	this.updated = true;
		// }

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
		if(finishFlag){
			this.updatePolyBrush();
			// this.addPolyBrush();
		}

		this.draw(finishFlag);
	},
	// preDraw:function(){

	// },
	draw:function(){
		var data = this.dataList;
		var xScale = this.xScale;
		var yScale = this.yScale;

		var vis = this.vis;

		var childrenLength = d3.extent(data.map(function(d){
			return d.children.length;
		}))

		var sizeMapping = d3.scale.linear().domain([childrenLength[0],(childrenLength[0]+childrenLength[1])/2,childrenLength[1]])
		.range([2,7,8])

		var sel = vis.selectAll("g.tsnePoint")
			.data(data,function(d){
				return d.id;
			})

		var enter = sel.enter().append("g")
			.attr("class","tsnePoint")

		enter.append("circle")
			.attr("class","tsneCircle")
			.style("fill",function(d){
				return fillColor(d.mainCategory);
				return fillColor(d.category);
			})
			.style("stroke","white")
			.style("stroke-width",0.5)
		enter.append("title");

		sel.select("circle")
			.transition()
			.attr("cx",function(d){
				var x = xScale(d._projPos[0]);
				return x;
			})
			.attr("cy",function(d){
				var y = yScale(d._projPos[1]);
				return y;
			})
			.attr("r",function(d){
				return sizeMapping(d.children.length)
			})
			// .attr("r",3)
			.style("fill",function(d){
				return fillColor(d.mainCategory);

				return fillColor(d.category);
			})
		
		sel.on("click",function(d){
				notifyMultiTreeSelectionByClicking(d,true)
			})
			// .style("stroke","white")

		sel.select("title")
			.text(function(d){
				return d.text;
			})

		sel.exit().remove()



	},
	resetPolyBrush:function(){
		this.polyBrush = new PolyBrush(this.vis);
	},
	updatePolyBrush:function(){
		var data = this.dataList;
		var xScale = this.xScale;
		var yScale = this.yScale;

		function filterPoints(data,brush){
			// var filteredData = [];
			var filteredDataIndex = {}
			for(var i=0;i<data.length;i++){
				if(brush.isWithinExtent(xScale(data[i]._projPos[0]),yScale(data[i]._projPos[1]))){
					// filteredData.push(data[i].index);
					filteredDataIndex[data[i].index]=true;
				}
			}
			// console.log(filteredData);
			return filteredDataIndex;
		}

		// var pos = {height:this.pos.height};
		// pos.height = this.pos.height*5.0/3.0;
		// console.log(pos.height)

		// this.polyBrush = new PolyBrush(this.vis);

		var _this = this;
		function onBrush(e){
			console.log(e);
			_this.filteredStartEndTime = e;
			// _this.parent.updateDetail(e,false,1);
		}

		function onBrushFinished(brush){
			// console.log(e,"finish")

			var filteredPoints = filterPoints(data,brush)
			notifyMultiTreeSelection(filteredPoints,true);
			
			// _this.filteredStartEndTime = e;
			// if(flag){
			// 	_this.filteredStartEndTime = null;
			// 	e = _this.xScale.domain();
			// 	// _this.parent.updateDetail(e,flag,2);
			// }
		}

		this.polyBrush.init({},this.xScale,this.yScale,onBrush,onBrushFinished);

	},
	// addPolyBrush:function(){//depr
	// 	var data = this.dataList;
	// 	var xScale = this.xScale;
	// 	var yScale = this.yScale;

	// 	function filterPoints(data,brush){
	// 		var filteredData = [];
	// 		for(var i=0;i<data.length;i++){
	// 			if(brush.isWithinExtent(xScale(data[i].projPos[0]),yScale(data[i].projPos[1]))){
	// 				filteredData.push(data[i]);
	// 			}
	// 		}
	// 		console.log(filteredData);
	// 		return filteredData;
	// 	}

	// 	// var pos = {height:this.pos.height};
	// 	// pos.height = this.pos.height*5.0/3.0;
	// 	// console.log(pos.height)

	// 	this.polyBrush = new PolyBrush(this.vis);

	// 	var _this = this;
	// 	function onBrush(e){
	// 		console.log(e);
	// 		_this.filteredStartEndTime = e;
	// 		// _this.parent.updateDetail(e,false,1);
	// 	}

	// 	function onBrushFinished(brush){
	// 		// console.log(e,"finish")

	// 		var filteredPoints = filterPoints(data,brush)

	// 		// _this.filteredStartEndTime = e;
	// 		// if(flag){
	// 		// 	_this.filteredStartEndTime = null;
	// 		// 	e = _this.xScale.domain();
	// 		// 	// _this.parent.updateDetail(e,flag,2);
	// 		// }
	// 	}

	// 	this.polyBrush.init({},this.xScale,this.yScale,onBrush,onBrushFinished);

	// },
	updateBrush:function(){

	},
	highlightNode:function(dataIndex){
		var flag = true;
		for(var i in dataIndex){
			if(dataIndex[i]){
				flag = false;
			}
		}
		d3.selectAll("circle.tsneCircle")
			.style("fill-opacity",function(d){
				if(dataIndex[d.index] || flag){
					return "1.0";
				}
				return "0.2"
			})

		var data = this.dataList;
		var filteredData = [];
		for(var i=0;i<data.length;i++){
			if(dataIndex[data[i].index] || flag){
				filteredData.push(data[i])
			}
		}

		if(!this.finished){
			return;
		}

		this.drawKeywords(filteredData,flag);
		// this.updatePolyBrush();
	},
	highlightNodeByKeywords:function(keywordsIndex,flag){
		d3.selectAll("circle.tsneCircle")
			.style("stroke",function(d){
				if(flag){
					return "white"
				}
				for(var i in keywordsIndex){
					if(d.segments.indexOf(i)!=-1){
						return "red";
					}
				}
				return "white"
			})
	},
	clickNodeByKeywords:function(keywordsIndex,flag){
		var data = this.dataList;
		var filteredPoints = {}
		for(var i=0;i<data.length;i++){
			for(var j in keywordsIndex){
				if(data[i].segments.indexOf(j)!=-1 || flag){
					filteredPoints[data[i].index] = true;
					break;
				}
			}
		}
		notifyMultiTreeSelection(filteredPoints,true);

	},
	drawKeywords:function(data){
		keywordsViz.updateData(data);
	}
}

function preprocessKeywords(smData,callback,_syncCallback){
	
    // var texts = []
    // for(var i=0;i<smData.length;i++){
    //   var text = ""
    //   if(smData[i].text){
    //     text+= smData[i].text;
    //     text+= " "
    //   }
    //   // text+= smData[i].key;
    //   texts.push(text)
    // }

   var texts = []
    M = smData.length
    // M = 10
    // for(var i=0;i<smData.length;i++){
    // for(var i=0;i<M;i++){
    //   var text = ""
    //   for(var j=0;j<smData[i].allNodes.length;j++){
    //     if(smData[i].allNodes[j].data.text){
    //       text+= smData[i].allNodes[j].data.text;
    //       text+= " "
    //     }
    //   }
    //   // text+= smData[i].key;
    //   texts.push(text)
    // }

    for(var i=0;i<M;i++){
    	texts.push(smData[i].textAggregation)
    }


    var stopIndex = {};
    for(var i=0;i<stopKeyWords.length;i++){
    	stopIndex[stopKeyWords[i]] = true;
    }
    stopCount = 0;

    // var texts = [text];
    // var url = "http://vis.pku.edu.cn/weiboutil/text/split"
    var url = "http://162.105.71.185:8080/weiboutil/text/split"
    $.ajax({
      type: "POST",
      url: url,
      data: {
        text: JSON.stringify(texts),
        keyword:30,
        weight:true,
        weibo:true
      },
      timeout:5000000,
      crossDomain: true,
      success: function(data) {
        if(data.result[0]){
          var drawData = data.result;
          console.log(drawData);
          for(var i=0;i<M;i++){
          	smData[i].words = drawData[i];
          	smData[i].segments = "";
          	for(var j=0;j<smData[i].words.length;j++){
          		if(stopIndex[smData[i].words[j][0]]){
          			stopCount++;
          			continue;
          		}
          		if(!isNaN(parseInt(smData[i].words[j][0]))){
          			stopCount++;
          			continue;
          		}
          		smData[i].segments += smData[i].words[j][0];
          		smData[i].segments += " ";
          	}
          }
          // _this.processHighlightingBox_After();
        }
        var matrix = K_TfIDF.tfidf(smData.slice(0,M));

        // _syncLoad();///....
        // _syncCallback();

        callback(smData,matrix)

  //       var thresholdNum = 10;
  //       var thresholdVal = 0.4;
  //       for(var i =0;i<matrix.length;i++){
  //       	var entries = d3.entries(matrix[i]);
  //       	entries.sort(function(a,b){
  //       		return a.value-b.value;
  //       	})
  //       	smData[i].relatedNodes = [];
  //       	for(var j=0;j<d3.min([thresholdNum,entries.length]);j++){
  //       		if(entries[j].value<thresholdVal){
  //       			smData[i].relatedNodes.push(smData[entries[j].key]);
  //       		}
  //       	}
  //       	console.log(smData[i].segments,smData[i].relatedNodes)
  //       }

		// detailSequence.updateData(gData)	

      },
      error: function() {
      	console.log("err")
    	// detailSequence.updateData(gData)	
        // _this.processHighlightingBox_After();
//        alert("Query Data Error!");
        return null;
      }
    });

}


stopKeyWords = ["http","'s","a","able","about","above","abst","accordance","according","accordingly","across","act","actually","added","adj","affected","affecting","affects","after","afterwards","again","against","ah","all","almost","alone","along","already","also","although","always","am","among","amongst","an","and","announce","another","any","anybody","anyhow","anymore","anyone","anything","anyway","anyways","anywhere","apparently","approximately","are","aren","arent","arise","around","as","aside","ask","asking","at","auth","available","away","awfully","b","back","be","became","because","become","becomes","becoming","been","before","beforehand","begin","beginning","beginnings","begins","behind","being","believe","below","beside","besides","between","beyond","biol","both","brief","briefly","but","by","c","ca","came","can","cannot","cant","cause","causes","certain","certainly","co","com","come","comes","contain","containing","contains","could","couldnt","d","date","did","didnt","different","do","does","doesnt","doing","done","dont","down","downwards","due","during","e","each","ed","edu","effect","eg","eight","eighty","either","else","elsewhere","end","ending","enough","especially","et","etal","etc","even","ever","every","everybody","everyone","everything","everywhere","ex","except","f","far","few","ff","fifth","first","five","fix","followed","following","follows","for","former","formerly","forth","found","four","from","further","furthermore","g","gave","get","gets","getting","give","given","gives","giving","go","goes","gone","got","gotten","h","had","happens","hardly","has","hasnt","have","havent","having","he","hed","hence","her","here","hereafter","hereby","herein","heres","hereupon","hers","herself","hes","hi","hid","him","himself","his","hither","home","how","howbeit","however","hundred","i","id","ie","if","ill","im","immediate","immediately","importance","important","in","inc","indeed","index","information","instead","into","invention","inward","is","isnt","it","itd","itll","its","itself","ive","j","just","k","keep	keeps","kept","kg","km","know","known","knows","l","largely","last","lately","later","latter","latterly","least","less","lest","let","lets","like","liked","likely","line","little","ll","look","looking","looks","ltd","m","made","mainly","make","makes","many","may","maybe","me","mean","means","meantime","meanwhile","merely","mg","might","million","miss","ml","more","moreover","most","mostly","mr","mrs","much","mug","must","my","myself","n","na","name","namely","nay","nd","near","nearly","necessarily","necessary","need","needs","neither","never","nevertheless","new","next","nine","ninety","no","nobody","non","none","nonetheless","noone","nor","normally","nos","not","noted","nothing","now","nowhere","o","obtain","obtained","obviously","of","off","often","oh","ok","okay","old","omitted","on","once","one","ones","only","onto","or","ord","other","others","otherwise","ought","our","ours","ourselves","out","outside","over","overall","owing","own","p","page","pages","part","particular","particularly","past","per","perhaps","placed","please","plus","poorly","possible","possibly","potentially","pp","predominantly","present","previously","primarily","probably","promptly","proud","provides","put","q","que","quickly","quite","qv","r","ran","rather","rd","re","readily","really","recent","recently","ref","refs","regarding","regardless","regards","related","relatively","research","respectively","resulted","resulting","results","right","run","s","said","same","saw","say","saying","says","sec","section","see","seeing","seem","seemed","seeming","seems","seen","self","selves","sent","seven","several","shall","she","shed","shell","shes","should","shouldnt","show","showed","shown","showns","shows","significant","significantly","similar","similarly","since","six","slightly","so","some","somebody","somehow","someone","somethan","something","sometime","sometimes","somewhat","somewhere","soon","sorry","specifically","specified","specify","specifying","still","stop","strongly","sub","substantially","successfully","such","sufficiently","suggest","sup","sure","system","take","taken","taking","tell","ten","tends","th","than","thank","thanks","thanx","that","thats","the","their","theirs","them","themselves","then","thence","there","thereafter","thereby","thered","therefore","therein","thereof","therere","theres","thereto","thereupon","these","they","theyd","theyre","thick","thin","thing","things","think","thinks","third","this","thorough","thoroughly","those","thou","though","thoughh","thought","thoughts","thousand","three","throug","through","throughout","thru","thus","til","tip","to","today","together","too","took","top","toward","towards","tried","tries","truly","try","trying","ts","turn","turned","turning","turns","twelve","twenty","twice","two","un","under","unfortunately","unless","unlike","unlikely","until","unto","up","upon","ups","us","use","used","useful","usefully","usefulness","uses","using","usually","value","various","very","via","viz","vol","vols","vs","want","wanted","wanting","wants","was","way","ways","we","wed","welcome","well","wells","went","were","what","whatever","whats","when","whence","whenever","where","whereafter","whereas","whereby","wherein","wheres","whereupon","wherever","whether","which","while","whim","whither","who","whod","whoever","whole","whom","whomever","whos","whose","why","widely","will","willing","wish","with","within","without","wonder","words","work","worked","working","works","world","would","www","year","years","yes","yet","you","youd","young","younger","youngest","your","youre","yours","yourself","yourselves","zero","algorithm","approach","method","process","way"]