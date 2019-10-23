var TableView = function(divName,multiSelection,id,parent){//x,y,idlist = key,value,idList

	this.id = id;
	this.parent = parent;

	this.divName = divName
	this.multiSelection = multiSelection

	this.init()
}


TableView.prototype = {
	init: function(){


	},
	buildTable:function(data,clickFunction,count){
		var divName = this.divName
		var table = $("#"+divName).DataTable(data)

		var multiSelection = this.multiSelection

		$('#' +divName +' tbody').off( 'click')

		$("#"+divName +" tbody").on('click','tr',function(){
			if(multiSelection){
		        if ( $(this).hasClass('selected') ) {
		            $(this).removeClass('selected');
		        }
		        else {        	
		            $(this).addClass('selected');
		        }
				clickFunction(table.row(this).data())

			}else{
		        if ( $(this).hasClass('selected') ) {
		            $(this).removeClass('selected');
		        }
		        else {        	
		            table.$('tr.selected').removeClass('selected');
		            $(this).addClass('selected');
		        }
				clickFunction(table.row(this).data())		
			}
		})

		if(count){
			for(var i=0;i<count;i++){
				$('#'+divName+ ' tbody tr:eq('+i+')').addClass("selected")	
			}
		}
	}
}

var WeiboTableView = function(divName,multiSelection,id,parent){//x,y,idlist = key,value,idList

	this.id = id;
	this.parent = parent;

	this.divName = divName
	this.multiSelection = multiSelection

	this.init()
}


WeiboTableView.prototype = {
	init: function(){

		var tableView = new TableView(this.divName,true)
		this.tableView = tableView
	},
	buildTable:function(tableData,count){


		var schema = {
			destroy:true,
			data:tableData,
			columns:[
		        { data: 'name' ,title:'Name'},
		        { data: 'timeStamp',title:'Time' },
		        { data: 'text',title:'Weibo' },
		        { data: 'totalChildren',title:'Num' }			
			],
			dom: 'T<"clear">lfrtip',
	        tableTools: {
	            // "sRowSelect": "multi",
	            // "aButtons": [ "select_all", "select_none" ]
	            "aButtons":[]
	        },
	        "lengthChange": false,
	        scrollCollapse: true,
        	paging:         false,
        	scrollY:        '46vh',  
		}

		if(!count){
	        schema["order"] = [[ 3, "desc" ]]			
		}else{
			schema["bSort"] = false
		}

		this.schema = schema

		function notify(weibo){
			notifyMessageSelection(weibo.mid)
		}

		this.tableView.buildTable(schema,notify,count)

	},
	updateData:function(data){

		var tableData = data.map(function(d){
			return d.data;
		})

		tableData.sort(function(a,b){
			return b.totalChildren - a.totalChildren
		})

		this.tableData = tableData

		this.buildTable(tableData)

	},
	highlightTable:function(nameIndex){
		var sortedData = []

		var data = this.tableData;

		for(var i=0;i<data.length;i++){
			if(nameIndex[data[i].name]){
				sortedData.push(data[i])
			}
		}
		sortedData.sort(function(a,b){
			return a.name != b.name
		})
		var count = sortedData.length;

		for(var i=0;i<data.length;i++){
			if(!nameIndex[data[i].name]){
				sortedData.push(data[i])
			}
		}
		// this.schema.data = sortedData
		this.buildTable(sortedData,count)

	},
	highlightTableByWeibo:function(data){
		var sortedData = []
		var tableData = this.tableData

		var idIndex = {}
		for(var i=0;i<data.length;i++){
			idIndex[data[i].data.mid] = true
		}

		for(var i=0;i<tableData.length;i++){
			if(idIndex[tableData[i].mid]){
				sortedData.push(tableData[i])
			}
		}
		sortedData.sort(function(a,b){
			return a.name != b.name
		})
		var count = sortedData.length;

		for(var i=0;i<tableData.length;i++){
			if(!idIndex[tableData[i].mid]){
				sortedData.push(tableData[i])
			}
		}
		this.buildTable(sortedData,count)
	}
}

var KeyPlayerTableView = function(divName,multiSelection,id,parent){//x,y,idlist = key,value,idList

	this.id = id;
	this.parent = parent;

	this.divName = divName
	this.multiSelection = multiSelection

	this.selectedKeyPlayer = {}


	this.init()
}


KeyPlayerTableView.prototype = {
	init: function(){

		var tableView = new TableView(this.divName,true)
		this.tableView = tableView
	},
	buildTable:function(tableData,count){
		var schema = {
			destroy:true,
			data:tableData,
			columns:[
		        { data: 'name' ,title:'Name'},
		        { data: 'weiboNum',title:'Weibos' },
		        { data: 'totalChildren',title:'Num' }			
			],
			dom: 'T<"clear">lfrtip',
	        tableTools: {
	            // "sRowSelect": "multi",
	            "aButtons": [ "select_all", "select_none" ]
	            // "aButtons":[]
	        },
	        // "order": [[ 2, "desc" ]],
	        "lengthChange": false,
	        scrollCollapse: true,
        	paging:         false,
        	scrollY:        '16vh',  
		}

		if(!count){
	        schema["order"] = [[ 2, "desc" ]]			
		}else{
			schema["bSort"] = false
		}

		var _this = this;

		function notify(data){
			var name = data.name;
			if(!_this.selectedKeyPlayer[name]){
				_this.selectedKeyPlayer[name] = true
			}else{
				delete _this.selectedKeyPlayer[name]
			}
			notifyKeyPlayer(_this.selectedKeyPlayer)
		}

		this.tableView.buildTable(schema,notify,count)


		$("#ToolTables_"+this.divName+"_0").on("click",function(){
			_this.selectedKeyPlayer = {}
			for(var i=0;i<_this.tableData.length;i++){
				_this.selectedKeyPlayer[_this.tableData[i].name] = true
			}
			notifyKeyPlayer(_this.selectedKeyPlayer,true)
		})

		$("#ToolTables_"+this.divName+"_1").on("click",function(){
			_this.selectedKeyPlayer = {}
			notifyKeyPlayer(_this.selectedKeyPlayer)
		})
	},
	updateData:function(data,existingIndex){

		var tableData = data.map(function(d){
			return d.data;
		})

		this.selectedKeyPlayer = {}
		var _this = this

		var keyPlayerIndex = {}
		for(var i=0;i<tableData.length;i++){
			var key = tableData[i].name;
			if(!keyPlayerIndex[key]){
				keyPlayerIndex[key] = {
					name:key,
					weiboNum:0,
					totalChildren:0
				}
			}
			keyPlayerIndex[key].weiboNum++;
			keyPlayerIndex[key].totalChildren+=tableData[i].totalChildren
		}
		var keyPlayers = []
		for(var i in keyPlayerIndex){
			keyPlayers.push(keyPlayerIndex[i])
		}

		keyPlayers.sort(function(a,b){
			return b.totalChildren - a.totalChildren
		})

		this.tableData = keyPlayers;


		if(!existingIndex){

			if(d3.entries(this.selectedKeyPlayer).length){
				notifyKeyPlayer({})
			}


			this.buildTable(keyPlayers)
		}else{
			this.highlightTable(existingIndex)
		}


	},
	highlightTable:function(nameIndex){
		var sortedData = []

		var data = this.tableData;

		var selectedKeyPlayer = {}

		for(var i=0;i<data.length;i++){
			if(nameIndex[data[i].name]){
				sortedData.push(data[i])
				selectedKeyPlayer[data[i].name] = true;
			}
		}
		sortedData.sort(function(a,b){
			return a.name != b.name
		})
		var count = sortedData.length;

		for(var i=0;i<data.length;i++){
			if(!nameIndex[data[i].name]){
				sortedData.push(data[i])
			}
		}
		// this.schema.data = sortedData
		this.buildTable(sortedData,count)

		this.selectedKeyPlayer = selectedKeyPlayer
		notifyKeyPlayer(selectedKeyPlayer)

	}
}






