function preprocessKeywords(events,callback,_syncCallback){
	
    var texts = []
    smData = events.events;
    M = smData.length
    // M = 5
    // for(var i=0;i<smData.length;i++){
    for(var i=0;i<M;i++){
      var text = ""
      for(var j=0;j<smData[i].allNodes.length;j++){
        if(smData[i].allNodes[j].data.text){
          text+= smData[i].allNodes[j].data.text;
          text+= " "
        }
      }
      // text+= smData[i].key;
      texts.push(text)
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
      timeout:50000,
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
        // var matrix = K_TfIDF.tfidf(smData);

        // _syncLoad();///....
        _syncCallback(events);

        // callback(smData,matrix)


      },
      error: function() {
      	console.log("err")

        return null;
      }
    });

}

stopKeyWords = ["http","'s"]


function drawKeywords(events){

  var wordRoots = {children:[],wordName:"root"}
  var nodes = events.events;
  for(var i=0;i<nodes.length;i++){
    var cNode = {file:nodes[i].file,
      root:nodes[i],children:[],wordName:nodes[i].data.name,
      value:nodes[i].allNodes.length}
    if(!nodes[i].words){
      continue
    }
    for(var j=0;j<nodes[i].words.length;j++){
      var word = nodes[i].words[j][0]
      var value = nodes[i].words[j][1]
      cNode.children.push({wordName:word,
        value:cNode.value*value})
    }
    wordRoots.children.push(cNode)
  }

  var svg = d3.select("#svg1"),
      diameter = +svg.attr("height"),
    g = svg.append("g").attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

      format = d3.format(",d");

    margin = 20;

var color = d3.scaleLinear()
    .domain([-1, 5])
    .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
    .interpolate(d3.interpolateHcl);

var pack = d3.pack()
    .size([diameter - margin, diameter - margin])
    .padding(2);

  root = d3.hierarchy(wordRoots)
      .sum(function(d) { return d.value; })
      .sort(function(a, b) { return b.value - a.value; });

  var focus = root,
      nodes = pack(root).descendants(),
      view;

  var circle = g.selectAll("circle")
    .data(nodes)
    .enter().append("circle")
      .attr("class", function(d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; })
      .style("fill", function(d) { return d.children ? color(d.depth) : null; })
      .on("click", function(d) { if (focus !== d) zoom(d), d3.event.stopPropagation(); });

  var text = g.selectAll("text")
    .data(nodes)
    .enter().append("text")
      .attr("class", "label")
      .style("fill-opacity", function(d) { return d.parent === root ? 1 : 0; })
      .style("display", function(d) { return d.parent === root ? "inline" : "none"; })
      .text(function(d) { return d.data.wordName; });

  var node = g.selectAll("circle,text");

  svg
      // .style("background", color(-1))
      .on("click", function() { zoom(root); });

  zoomTo([root.x, root.y, root.r * 2 + margin]);

  function zoom(d) {
    var focus0 = focus; focus = d;

    var transition = d3.transition()
        .duration(d3.event.altKey ? 7500 : 750)
        .tween("zoom", function(d) {
          var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
          return function(t) { zoomTo(i(t)); };
        });

    transition.selectAll("text")
      .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
        .style("fill-opacity", function(d) { return d.parent === focus ? 1 : 0; })
        .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
        .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
  }

  function zoomTo(v) {
    var k = diameter / v[2]; view = v;
    node.attr("transform", function(d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
    circle.attr("r", function(d) { return d.r * k; });
  }


}





// function drawKeywords(events){

//   var svg = d3.select("#svg1"),
//       diameter = +svg.attr("width"),
//       g = svg.append("g").attr("transform", "translate(2,2)"),
//       format = d3.format(",d");

//   var pack = d3.pack()
//       .size([diameter - 4, diameter - 4]);


//   root = d3.hierarchy(root)
//       .sum(function(d) { return d.allNodes; })
//       .sort(function(a, b) { return b.value - a.value; });

//   var node = g.selectAll(".node")
//     .data(pack(root).descendants())
//     .enter().append("g")
//       .attr("class", function(d) { return d.children ? "node" : "leaf node"; })
//       .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

//   node.append("title")
//       .text(function(d) { return d.data.name + "\n" + format(d.value); });

//   node.append("circle")
//       .attr("r", function(d) { return d.r; });

//   node.filter(function(d) { return !d.children; }).append("text")
//       .attr("dy", "0.3em")
//       .text(function(d) { return d.data.name.substring(0, d.r / 3); });

// }
