var DetailView = function(svgName,pos,fillColor,parent){//x,y,idlist = key,value,idList
	// this.svgName = gSVGName;
	//this.data = data;
	this.width = pos.width;
	this.height = pos.height;
	this.x = pos.x;
	this.y = pos.y;
	this.fillColor = fillColor;
	// this.titleText = titleText;

	// this.vis = d3.select("#"+this.svgName).append("g")
	// 	.attr("class","sequence")
	// 	.attr("id","barChart"+id)
	// 	.attr("transform","translate("+this.x+","+this.y+")");
	this.vis = d3.select("#"+svgName)
		.attr("class","documentPanel")
		.attr("transform","translate("+this.x+","+this.y+")");

	// this.id = id;
	this.parent = parent;
	this.init();
	//this.preprocessData();	
}

DetailView.prototype = {
	init:function(){

	},
	updateData:function(data,sessionIndex){
		this.data = data;

		this.preprocessData(sessionIndex);
		this.update();
	},
	refresh:function(fillColor){
		this.fillColor = fillColor 
		this.update();
	},
	preprocessData:function(sessionIndex){

//             // var pos = {x:50,y:50,width:$("#topViewSvg").width()-100,height:$("#topViewSvg").height()-100,svgName:"topViewSvg"};
//             // eventVis = new BarChart(d3.select("#topViewSvg").append("g"),pos);
//             // eventVis.updateData(gData);
		var data = this.data;

		var pos1 = {x:0,y:0,width:this.width/2.0,height:this.height,svgName:"seqRaw"};
        rawSequenceVis = new BarChart(this.vis.append("g"),pos1,0,0,this.fillColor);

        var rawData = []
        var candidateData = []
        for(var i=0;i<data.length;i++){
        	var sessionItem = sessionIndex[data[i].id]
        	rawData.push(sessionItem)
        	candidateData.push(data[i].probabilitySequence[data[i].probabilitySequence.length-1].topTenProbabilityList)
        	candidateData[candidateData.length-1].id = data[i].id;
        	candidateData[candidateData.length-1].ip = sessionItem.ip;
        	candidateData[candidateData.length-1].label = data[i].anomalSeq[0].action;
        	
        }

        rawSequenceVis.updateData(rawData);

		var pos2 = {x:this.width/2.0,y:0,width:this.width/2.0,height:this.height,svgName:"seqRaw"};
        candidateSequenceVis = new BarChart(this.vis.append("g"),pos2,0,0,this.fillColor);
        candidateSequenceVis.updateData1(candidateData)

		var data = this.data;

	},	
	update:function(){
	}

}
