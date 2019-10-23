function setSvgAttr(svgSel, width, height) {
    svgSel.attr("width", width + "px");
    svgSel.attr("height", height + "px");
}

keywordColorMapping = {}
globalDataOrder = null

function createDefs(defs) {

var dropShadowFilter = defs.append('svg:filter')
      .attr('id', 'dropShadow')
      .attr('filterUnits', "userSpaceOnUse")
      .attr('width', '250%')
      .attr('height', '250%');
    dropShadowFilter.append('svg:feGaussianBlur')
      .attr('in', 'SourceGraphic') 
      .attr('stdDeviation', 2)
      .attr('result', 'blur-out'); 
    // dropShadowFilter.append('svg:feColorMatrix')
    //   .attr('in', 'blur-out') 
    //   .attr('type', 'hueRotate')
    //   .attr('values', 180)  
    //   .attr('result', 'color-out'); 
    dropShadowFilter.append('svg:feOffset')
      .attr('in', 'color-out')
      .attr('dx', 3)
      .attr('dy', 3)
      .attr('result', 'the-shadow');
    dropShadowFilter.append('svg:feBlend')
      .attr('in', 'SourceGraphic')
      .attr('in2', 'the-shadow')
      .attr('mode', 'normal');

}

function GetURLParameter(sParam) {
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) {
            return sParameterName[1];
        }
    }
    return null;
}

function readUserCluster(callback){
    d3.csv("data/users_clusters.csv",function(data){
        userClusterIndex = {}
        for(var i=0;i<data.length;i++){
            var user = data[i]['User ID'];
            var clusterIndex = data[i]['Cluster'];
            userClusterIndex[user] = clusterIndex
        }
        callback()
    })
}

function loadDataFile(){
    var dataName = GetURLParameter("data") 

    projectionName = GetURLParameter("projection")
    
    // var topicWordFile = ["data/lda_topic_word219.csv","data/VAST_lda_topic_word1.csv"]
    // var docTopicFile = ["data/lda_doc_topic219.csv","data/VAST_lda_doc_topic1.csv"]
    // var topicWordFile = ["data/lda_topic_word219.csv","data/VAST_lda_topic_word1.csv","data/VAST_lda_topic_word_fixtopic.csv"]
    // var docTopicFile = ["data/lda_doc_topic219.csv","data/VAST_lda_doc_topic1.csv","data/VAST_lda_doc_topic_fixtopic.csv"]
    var topicWordFile = ["data/lda_topic_word_final.csv","data/VAST_lda_topic_word1.csv","data/VAST_lda_topic_word_fixtopic.csv"]
    var docTopicFile = ["data/lda_doc_topic_final.csv","data/VAST_lda_doc_topic1.csv","data/VAST_lda_doc_topic_fixtopic.csv"]

    var colorFile1 = ["data/poi_function.csv",'data/poi_zone.csv']
    var colorFile = ["data/actionGroup.csv",'data/actions_tasks_update2.csv']

    var colorFiles = [colorFile,colorFile1,colorFile1]


    // var sequenceFiles = ["lss-asm-live-jsessions-anonymous","peoplePOIAllDay","peoplePOIAllDay"]
    var sequenceFiles = ["asm-data","peoplePOIAllDay","peoplePOIAllDay"]

    dataIndex = 0;
    if(dataName && dataName=="vast15"){
        dataIndex = 1
    }else if(dataName && dataName=='vast15_test'){
        dataIndex = 2
    }


    return [topicWordFile[dataIndex],docTopicFile[dataIndex],colorFiles[dataIndex],sequenceFiles[dataIndex]]
}

function readMultipleLDAResults(callback){

    fileNames = loadDataFile()

    var colorName = GetURLParameter("color")

    // var colorFile = ["data/poi_function.csv",'data/poi_zone.csv']
    // var colorFile = ["data/actionGroup.csv",'data/actions_tasks_update2.csv']

    var colorFile = fileNames[2]
    var colorIndex = 0
    if(colorName && colorName=="more"){
        colorIndex = 1
    }


    d3.csv(fileNames[0],function(data){
        d3.csv(fileNames[1],function(docTopicData){
    // d3.csv("data/lda_topic_word219.csv",function(data){
    //     d3.csv("data/lda_doc_topic219.csv",function(docTopicData){
    // d3.csv("data/VAST_lda_topic_word1.csv",function(data){
    //     d3.csv("data/VAST_lda_doc_topic1.csv",function(docTopicData){
            // d3.csv("data/actionGroup.csv",function(actionGroup){
            // d3.csv("data/actions_tasks_update2.csv",function(actionGroup){
            d3.csv(colorFile[colorIndex],function(actionGroup){
                actionGroupData = actionGroup

                ldaDataSeries = data;

                var results = {}
                for(var i=0;i<ldaDataSeries.length;i++){
                    var topic = parseInt(ldaDataSeries[i]['LDA'])
                    if(!results[topic]){
                        results[topic] = {topic:topic,data:[]}
                    }
                    delete ldaDataSeries[i]['LDA']
                    results[topic].data.push(ldaDataSeries[i])
                }

                var ldaTopicData = []
                for(var i in results){
                    ldaTopicData.push(results[i].data)
                    ldaTopicData[ldaTopicData.length-1].ldaIndex = i;
                }


                // var ldaTopicData = []

                // ldaTopicData.push(results['8'].data)
                // ldaTopicData.push(results['17'].data)

                callback(ldaTopicData,docTopicData,actionGroupData)


            })
        })
    })
}

// function readTopicModelingResults(callback){



//     d3.csv("python/doc_topic20.csv",function(doc_topic_data){
//         d3.csv("python/topic_word20.csv",function(topic_word_data){
//             d3.csv("python/topic_word10.csv",function(topic_word_data1){
//                 d3.csv("data/actionGroup.csv",function(actionGroup){
//                 // d3.csv("data/actions_tasks_update2.csv",function(actionGroup){
//                     doc_topic_matrix = doc_topic_data;
//                     topic_word_matrix = topic_word_data;
//                     topic_word_matrix1 = topic_word_data1
//                     actionGroupData = actionGroup

//                     callback()

//                 })
//             })
//         })
//     })
// }

function loadExistingMedoids(){

    for(var i=0;i<defaultMedoids.length;i++){
        defaultMedoids[i].groupData = []
    }

    topicProjection.medoids = defaultMedoids;
    topicProjection.selectMedoidsAll()

}

function loadExistingTopicAssignment(flag,dataOrder){

    if(flag){
        loadExistingMedoids()
    }

    if(!dataOrder){
        dataOrder = matrixView.data[0]
    }

    var assignment = existingCategories
    var dataIndex = sessionIndex

    var actionIndex = {}

    for(var i=0;i<dataOrder.length;i++){
        // actionOrders.push(matrixView.data[0][i].key)
        actionIndex[dataOrder[i].key] = i
    }
        var reg = /\d+/g

    var resultMatrix = {}
    for(var i in existingCategories){

        var res = i.match(reg)
        var ldaIndex = res[0];
        var topicIndex = res[1];

        var sessions = existingCategories[i].sessionPFXs;

        var actionOrders = []

        for(var j=0;j<dataOrder.length;j++){
            actionOrders.push({index:j,value:0,key:dataOrder[j].key})
        }        
        for(var j=0;j<sessions.length;j++){
            var id = sessions[j]
            var sData = dataIndex[id]
            var actionsQueue = sData.actionsQueue;
            for(var k=0;k<actionsQueue.length;k++){
                actionOrders[actionIndex[actionsQueue[k]]].value++
            }
        }
        // resultMatrix.push(actionOrders)
        resultMatrix[i] = actionOrders
        resultMatrix[i].ldaIndex = ldaIndex
        resultMatrix[i].topicIndex = topicIndex
        resultMatrix[i].rawID = i

        // resultMatrix[resultMatrix.length-1].ldaIndex = ldaIndex
        // resultMatrix[resultMatrix.length-1].topicIndex = topicIndex
        // resultMatrix[resultMatrix.length-1].rawID = i

    }

    resultMatrixList = []
    for(var i=0;i<matrixView.data.length;i++){
        var index = matrixView.data[i].rawID
        resultMatrixList.push(resultMatrix[index])
    }

    console.log("resultM",resultMatrixList)

}

function updateAssignmentMatrix(){
    matrixView.updateData(resultMatrixList,false,true)
}

function initJsonMultiple(ldaTopicData,ldaDocTopicData,actionGroupData){

    gLDATopicData = ldaTopicData
    gLDADocTopicData = ldaDocTopicData

    

    var fileMapping = {
        "zoushiming": 0,
    }
    fileIndex = 0

// fileNames
    d3.json("data/" + fileNames[3] + ".json", (err, dd) => {


        // d3.json("data/scores_of_predictions_full_topics_v2.json",function(predictedData){
            d3.json("data/newCategories.json",function(defaultTopicData){
                existingCategories = defaultTopicData

        //         d3.json("data/list_of_actions.txt",function(actionList){
                    // console.log("actionList",actionList)

                    // gData = dd;

                    sessionIndex = {}
                    gData = []
                    for(var i in dd){
                        gData.push(dd[i])
                    }
                    // sessionIndex = dd
                    for(var i=0;i<gData.length;i++){
                        sessionIndex[gData[i].PFX] = gData[i]
                    }

                    // riverData = testPrediction(predictedData,actionList,defaultTopicData,sessionIndex)




                    setSvgAttr(d3.select("#topViewSvg"), $("#topView").width(), $("#topView").height())
                    setSvgAttr(d3.select("#topTopViewSvg"), $("#topTopView").width(), $("#topTopView").height())
                    setSvgAttr(d3.select("#topSecondTopViewSvg"), $("#topSecondTopView").width(), $("#topSecondTopView").height())

                    setSvgAttr(d3.select("#bottomViewSvg"), $("#bottomView").width(), $("#bottomView").height())
                    setSvgAttr(d3.select("#bottomLeftViewSvg"), $("#bottomLeftView").width(), $("#bottomLeftView").height())
                    setSvgAttr(d3.select("#bottomTopViewSvg"), $("#bottomTopView").width(), $("#bottomTopView").height())

                    setSvgAttr(d3.select("#bottomBottomLeftViewSvg"), $("#bottomBottomLeftView").width(), $("#bottomBottomLeftView").height())
                   
                    setSvgAttr(d3.select("#newBottomViewSvg"), $("#newBottomView").width(), $("#newBottomView").height())


                    createDefs(d3.select("body").append("svg").append('svg:defs'))


                    var colorData = extractColorLabelsByGroup(gData,actionGroupData)
                    // var colorData = extractColorLabels(gData)

                    var actionColorSet = colorData[2]
                    var groupColorSet = colorData[1]
                    var colorData1 = colorData[0]

                    globalActionType = colorData[5]

                    originalActionColorSet = actionColorSet
                    originalGroupColorSet = groupColorSet

                    actionGroupMapping = colorData[3]
                    groupActionMapping = colorData[4]

                    var posColor = {x:0, y:0, width:$("#topTopViewSvg").width()-10,height:$("#topTopViewSvg").height-10,svgName:"topTopViewSvg"}
                    colorLabel = new ColorLabel("topTopViewSvg",posColor,colorData1)
                    colorLabel.draw();

                    var tw_matrixs = []
                    mergedMatrix = []
                    mergedMatrixIndex = {}
                    // for(var i=0;i<ldaTopicData.length;i++){
                    //     var tw_matrix = processTopicData(ldaTopicData[i])
                    //     tw_matrixs.push(tw_matrix)
                    //     mergedMatrixIndex[i+2] = {}
                    //     tw_matrix.ldaIndex = i+2;

                    //     for(var j=0;j<tw_matrix.length;j++){
                    //         tw_matrix[j].topicIndex = j;
                    //         tw_matrix[j].ldaIndex = i+2
                    //         mergedMatrix.push(tw_matrix[j])
                    //         mergedMatrixIndex[i+2][j] = {word:tw_matrix[j],doc:[]}
                    //     }
                    // }

                    for(var i=0;i<ldaTopicData.length;i++){
                        var tw_matrix = processTopicData(ldaTopicData[i])
                        tw_matrixs.push(tw_matrix)
                        mergedMatrixIndex[ldaTopicData[i].ldaIndex] = {}
                        tw_matrix.ldaIndex = ldaTopicData[i].ldaIndex;

                        for(var j=0;j<tw_matrix.length;j++){
                            tw_matrix[j].topicIndex = j;
                            tw_matrix[j].ldaIndex = tw_matrix.ldaIndex
                            mergedMatrix.push(tw_matrix[j])
                            mergedMatrixIndex[tw_matrix.ldaIndex][j] = {word:tw_matrix[j],doc:[]}
                        }
                    }


                    assignRawID(mergedMatrix)//assign the raw ID: lda_x_topic_y


                    var pos = {x:50,y:50,width:$("#topViewSvg").width()-100,height:$("#topViewSvg").height()-100,svgName:"topViewSvg"};
                    matrixView = new MatrixView(d3.select("#topViewSvg").append("g"),pos,"",0,actionColorSet);
                    matrixView.updateData(mergedMatrix);

                    // var tw_matrixs = [tw_matrix,tw_matrix1]

                    setSvgAttr(d3.select("#rightViewSvg"),$("#rightView").width(),$("#rightView").height());
                    var pos1 = {x:50,y:50,width:$("#rightView").width()-100,height:$("#rightView").height()-100}

                    topicProjection = new TopicPanel("rightViewSvg",pos1,groupColorSet)
                    // topicProjection.updateDocument(tw_matrixs, function(){});
                    // topicProjection.updateDocumentMDS(tw_matrixs, function(){});
                    // topicProjection.updateDocumentMDS(mergedMatrix, function(){});

                    if(projectionName && projectionName=="mds"){
                        topicProjection.updateDocumentMDS(mergedMatrix, function(){});
                    }else{
                        topicProjection.updateDocument(mergedMatrix, function(){});
                    }


                    gData = filterNoSession(gData)

                    //process the doc topic data
                    var docTopic = processDocTopicData(gData,mergedMatrixIndex,ldaDocTopicData)


                    // var users =[]
                    // var topUser = extractDataByUser(gData)[1]

                    // for(var i=0;i<8;i++){
                    //     root = mergeSecurityTree(topUser[i].value.data)
                    //     root.id = i
                    //     users.push(root)
                    // }


                    var reg = /\d+/g
                    defaultMedoids = []

                    // for(var i in defaultTopicData){
                    //     var res = i.match(reg)
                    //     var ldaIndex = res[0];
                    //     var topicIndex = res[1];

                    //     defaultMedoids.push(mergedMatrixIndex[ldaIndex][topicIndex].word)
                    // }

                    // globalTopicData = defaultTopicData

                    var maxLDANum = gLDATopicData[gLDATopicData.length-1].ldaIndex
                    var maxTopicNum = gLDATopicData[gLDATopicData.length-1].length

                    for(var i = 0; i<maxTopicNum;i++){
                        var ldaIndex = maxLDANum;
                        var topicIndex = i;

                        defaultMedoids.push(mergedMatrixIndex[ldaIndex][topicIndex].word)
                    }

                    globalTopicData = defaultTopicData



                    // var defaultMatrix = []
                    // for(var i in mergedMatrixIndex[12]){
                    //     defaultMatrix.push(mergedMatrixIndex[12][i].word)
                    // }
                    // defaultMedoids = defaultMatrix

                    // var resultSessions = filterSessionByTopic(gData,mergedMatrixIndex,defaultMatrix)
                    var resultSessions = filterSessionByTopic(gData,mergedMatrixIndex,defaultMedoids)

                    var groupSessions = []
                    for(var i=0;i<resultSessions.length;i++){
                        root = mergeSecurityTree(resultSessions[i])
                        root.id = i
                        groupSessions.push(root)
                    }

                    // var posVenn = {x:10,y:10,width:$("#bottomLeftViewSvg").width()-20,height:$("#bottomLeftViewSvg").height()-20,svgName:"bottomLeftViewSvg"};
                    // vennView = new VennView("bottomLeftViewSvg",posVenn,groupColorSet)

                    // for(var i in mergedMatrixIndex[8]){
                    //     defaultMedoids.push(mergedMatrixIndex[8][i].word)
                    // }



                    var setIndex = calculateDocumentCategories(gData,defaultMedoids,gLDADocTopicData)
                    globalSelectedTopics = defaultMedoids


                    ////globalChordData

                    var posChord = {x:10,y:10,width:$("#newBottomViewSvg").width()-20,height:$("#newBottomViewSvg").height()-20,svgName:"newBottomViewSvg"};
                    chordView = new ChordView("newBottomViewSvg",posChord,groupColorSet)
                    chordView.updateData(globalChordData)

                    // vennView.updateData(setIndex)

                    var posGrid = {x:10,y:10,width:$("#bottomViewSvg").width()-20,height:$("#bottomViewSvg").height()-20,svgName:"bottomViewSvg"};
                    gridEvents = new SmallMultiple("bottomViewSvg",posGrid,actionColorSet)

                    // gridEvents.updateData(groupSessions)



                    // var posRiver = {x:10,y:10,width:$("#bottomTopViewSvg").width()-20,height:$("#bottomTopViewSvg").height()-30,svgName:"bottomTopViewSvg"};
                    // riverView = new RiverView("bottomTopViewSvg",posRiver,groupColorSet)

                    // riverView.updateData(riverData,globalSelectedTopics)

                    // var posDetail = {x:10,y:10,width:$("#bottomBottomLeftViewSvg").width()-20,height:$("#bottomBottomLeftViewSvg").height()-30,svgName:"bottomBottomLeftViewSvg"};
                    // detailView = new DetailView("bottomBottomLeftViewSvg",posDetail,actionColorSet)


                    // var testingData = []
                    // for(var i=0;i<riverData.length;i++){
                    //     if(riverData[i].category == riverData[riverData.length-500].category){
                    //         testingData.push(riverData[i])
                    //     }
                    // }
                    // detailView.updateData(testingData,sessionIndex)

        //         })
            })

        // })

    })    
}

function hoveringNotification(rawID,offFlag,optionalColumnID){
    topicProjection.hoveringMethod(rawID,offFlag)
    // vennView.hoveringMethod(rawID,offFlag)
    matrixView.hoveringMethod(rawID,offFlag,optionalColumnID)
    chordView.hoveringMethod(rawID,offFlag)
}

function updatevennView(){
    var setIndex = calculateDocumentCategories(gData,topicProjection.medoids,gLDADocTopicData)
    globalSelectedTopics = topicProjection.medoids
    // vennView.updateData(setIndex)

    chordView.updateData(globalChordData)
}

function refreshAllViews(actionColorSet,groupColorSet,selectedActionIndex){
    matrixView.refresh(actionColorSet)

    var selected = d3.entries(selectedActionIndex).length?true:false;
    var vennColor = selected?actionColorSet:groupColorSet

    topicProjection.refresh(vennColor,selectedActionIndex)

    var setIndex = calculateDocumentCategories(gData,globalSelectedTopics,gLDADocTopicData)


    // vennView.refresh(vennColor,setIndex)
    // gridEvents.refresh(actionColorSet)

    chordView.refresh(vennColor)
}


// //deprict
// function initJson(){


//     fileNames = ["lss-asm-live-jsessions-anonymous"
//     ]

//     var fileMapping = {
//         "zoushiming": 0,
//     }
//     fileIndex = 0
//     // var fileName = GetURLParameter("data")
//     // if (fileName && fileMapping[fileName] != null) {
//     //     fileIndex = fileMapping[fileName]
//     // }

//     // var showAll = GetURLParameter("showAll")

//     // d3.json("data/"+ fileName[2]+"MergedTree"+ ".json", (err, dd) => {
//     // d3.json("data/"+ fileName[fileName.length-1]+".json", (err, dd) => {

//     d3.json("data/" + fileNames[fileIndex] + ".json", (err, dd) => {



//         gData = dd;

//         // gData = gData.slice(0,1000)

//         // gData = processMergeRoots(dd,1451577600,1478577423);  //shabu
//         // gData = processMergeRoots(dd,1457871037); //Trump
//         // gData = processMergeRoots(dd);

//         setSvgAttr(d3.select("#topViewSvg"), $("#topView").width(), $("#topView").height())
//         setSvgAttr(d3.select("#topTopViewSvg"), $("#topTopView").width(), $("#topTopView").height())

//         // // timeNodes = mergeKeywordsTime(gData)
//         // // textNodes = mergeKeywords(gData.events)
//         // textNodes = mergeKeywordsKeyPlayer(gData.events)


//         // // console.log("tree",sampleTree)

//         // // result = filterNodeLinks(gData)
//         // result = { graph: gData }
//         //     // drawGraphTest(gData)
//         //     // graphViz = new GraphView("topViewSvg",pos1)
//         //     // // graphViz.updateData1(result);
//         //     // graphViz.updateData1({graph:sampleTree});

//         // documentViz = new DocumentPanel()
//         // documentViz.updateDocument(textNodes, _syncLoad1);
//         // // documentViz.updateDocument(timeNodes,_syncLoad);

//         // // timeViz = new TimePanel("bottomView")
//         // // timeViz.updateData(gData)

//             // var pos = {x:50,y:50,width:$("#topViewSvg").width()-100,height:$("#topViewSvg").height()-100,svgName:"topViewSvg"};
//             // eventVis = new BarChart(d3.select("#topViewSvg").append("g"),pos);
//             // eventVis.updateData(gData);



//             var colorData = extractColorLabelsByGroup(gData,actionGroupData)
//             // var colorData = extractColorLabels(gData)

//             var actionColorSet = colorData[2]
//             var groupColorSet = colorData[1]
//             var colorData1 = colorData[0]

//             actionGroupMapping = colorData[3]

//             var posColor = {x:0, y:0, width:$("#topTopViewSvg").width()-10,height:$("#topTopViewSvg").height-10,svgName:"topTopViewSvg"}
//             var colorLabel = new ColorLabel("topTopViewSvg",posColor,colorData1)
//             colorLabel.draw();

//             var tw_matrix = processTopicData(topic_word_matrix)
//             var tw_matrix1 = processTopicData(topic_word_matrix1)

//                 var pos = {x:50,y:50,width:$("#topViewSvg").width()-100,height:$("#topViewSvg").height()-100,svgName:"topViewSvg"};
//                 matrixView = new MatrixView(d3.select("#topViewSvg").append("g"),pos,"",0,actionColorSet);
//                 matrixView.updateData(tw_matrix);

//             var tw_matrixs = [tw_matrix,tw_matrix1]

//       setSvgAttr(d3.select("#rightViewSvg"),$("#rightView").width(),$("#rightView").height());
//       var pos1 = {x:50,y:50,width:$("#rightView").width()-100,height:$("#rightView").height()-100}

//             topicProjection = new TopicPanel("rightViewSvg",pos1,groupColorSet)
//             topicProjection.updateDocument(tw_matrixs, function(){});


// return;

//             topUser = extractDataByUser(gData)[1]
//             root = mergeSecurityTree(topUser[0].value.data)

//             // topCluster = extractDataByCluster(gData,userClusterIndex)[1]
//             // root = mergeSecurityTree(topCluster[0].value.data)

//             // root = mergeSecurityTree(gData)

//             var pos = {x:50,y:50,width:$("#topViewSvg").width()-100,height:$("#topViewSvg").height()-100,svgName:"topViewSvg"};
//             eventVis = new CircleView(d3.select("#topViewSvg").append("g"),pos,"",0,actionColorSet);
//             eventVis.updateData(root);



//     })    
// }

$(document).ready(function() {

    globalSelectedTopics = []

    // gSlider = $("#ex2").slider({}).data('slider')
    gSlider1 = $("#ex1").slider({}).data('slider')


    $("#thresholdButton").on("click",function(){
        var value = gSlider1.getValue();
        topicProjection.extendingThreshold = value
    })

    // $("#filterButton").on("click",function(){
    //     var values = gSlider.getValue();

    //     var selectedTopics = topicProjection.highlightTopicsByRange(values)

    //     if(values[0]==values[1]){
    //         var setIndex = calculateDocumentCategories(gData,selectedTopics,gLDADocTopicData)
    //         globalSelectedTopics = selectedTopics
    //         vennView.updateData(setIndex)

    //     }
    
    //     // resizeHexMap(gSlider.getValue()[0],gSlider.getValue()[1])
    // })

    $("#medoidButton").on("click",function(){
        topicProjection.selectMedoidsAll()


    })

    $("#colorSelectButton").on("click", function() {
        colorLabel.operation = "select"
        matrixView.operation = "select"
        $("#colorSelectButton").addClass("active")
        $("#colorDeselectButton").removeClass("active")
    })   
    $("#colorDeselectButton").on("click", function() {
        colorLabel.operation = "deselect"
        matrixView.operation = "deselect"
        $("#colorSelectButton").removeClass("active")
        $("#colorDeselectButton").addClass("active")
    })   
    $("#colorResetButton").on("click",function(){
        colorLabel.reset()

    })


    // readUserCluster(initJson)

    // readTopicModelingResults(initJson)
    readMultipleLDAResults(initJsonMultiple)

    // return;


    function _syncLoad1(data) {
        console.log("text", data)

        returnWords = deriveKeywords(data)
        keywordObj = deriveKeywordsWeibos(returnWords.wordList, gData.nodes)

        timeSlot = calculateKeywordsFrequenceyByTime(gData.nodes, returnWords.wordIndex, keywordObj.wordCount)
        mergedKeywordsInfo = mergeKeywordsTimeSlot(timeSlot, returnWords.wordIndex, keywordObj.wordList, showAll)

        mergedKeywords = mergedKeywordsInfo.word;
        selectedNodes = mergedKeywordsInfo.nodes;

        globalSizeMapping = mergedKeywordsInfo.sizeMapping

        mapView = new MapView(globalSizeMapping)

		checkUniqness(keywordAttributesMapping)

        mapGlyph = new MapGlyph('glyph')
            // $("#glyphView").css('display', 'block')
        mapGlyph.show(selectedNodes)

        keywordGraph = constructKeywordGraph(mergedKeywords, data, gData.nodes)

        console.log("finish graph construction",selectedNodes.length)

        weiboTable = new WeiboTableView("weiboTable", true)
        weiboTable.updateData(selectedNodes)



        keyPlayerTable = new KeyPlayerTableView("keyplayerTable", true)
        keyPlayerTable.updateData(selectedNodes)

        // KeyPlayerTableView


        timeViz = new TimePanel("bottomView")
            // timeViz.updateData({events:keywordObj.wordList,nodes:gData.nodes})
        timeViz.updateData({ events: mergedKeywords, nodes: gData.nodes })


        var pos1 = { x: 5, y: 5, width: $("#topViewSvg").width() - 10, height: $("#topViewSvg").height() - 10 }
            // var sampleTree = createTree(gData.events[1],{width:pos1.width,height:pos1.height})

        // gData.events = mergeEvents(gData.events)
        // gData.events = mergeEvents([gData.events[1]])

        // pTrees = createProjectedTrees(gData.events,{width:pos1.width,height:pos1.height})

        graphViz = new GraphView("topViewSvg", pos1)
        // $('#topViewSvg').click(function(e) {
        //         var posX = $(this).offset().left,
        //             posY = $(this).offset().top;
        //         alert((e.pageX - posX) + ' , ' + (e.pageY - posY));
        // })
            // // graphViz.updateData1({graph:sampleTree});
            // graphViz.updateData1({graph:pTrees});
            // graphViz.updateData2({graph:keywordGraph})
        graphViz.updateData3({ graph: keywordGraph })

    }

    function _syncLoad(data) {
        console.log('fake', data)

        result = filterNodeLinks(gData)
        console.log(result)

        var pos1 = { x: 5, y: 5, width: $("#topViewSvg").width() - 150, height: $("#topViewSvg").height() - 130 }

        graphViz = new GraphView("topViewSvg", pos1)
        graphViz.updateData(result.graph, result.nodeIndex, result.eventIndex, data);

    }

})

function updateUser(topUser,count){
    root = mergeSecurityTree(topUser[count].value.data)

    // root = mergeSecurityTree(gData)

    eventVis.updateData(root);

}

function notifyTimeSelection(timeRange) {
    // mapView.filterTimeRange(timeRange)
    mapView.filterGraphByTime(timeRange)
        // graphViz.highlightTimeRange(timeRange)
}

function clickVennNode(set,dataIndex){
    var length = set.length;
    if(length!=1){
        return;
    }
    var setValue = set[0];
    if(setValue=="Others"){
        var returnTopics = extractDocumentTopic(dataIndex,mergedMatrix,gLDADocTopicData)
        topicProjection.highlightTopicsByTopics(returnTopics)
    }else{
        removeSelectedMedoid(set)
    }   
}

function removeSelectedMedoid(set){
    var length = set.length;
    if(length!=1){
        return;
    }
    var setValue = set[0];

    var reg = /\d+/g

    var result = setValue.match(reg)
    var ldaIndex = result[0]
    var topicIndex = result[1]

    topicProjection.removeMedoid(ldaIndex,topicIndex)
    topicProjection.selectMedoidsAll()

    updatevennView()

    // var setIndex = calculateDocumentCategories(gData,topicProjection.medoids,gLDADocTopicData)
    // globalSelectedTopics = topicProjection.medoids
    // vennView.updateData(setIndex)

}

function notifyDataFiltering(groupData){
    var flag = topicProjection.editCurrentMedoids(groupData)
    return flag;
}

//current use --- security
function notifyDataSelection(data, matrixFlag) {
    // // console.log('brush data select', data, nameIndex)
    // weiboTable.updateData(data)
    // keyPlayerTable.updateData(data, nameIndex)
    //     // $("#glyphView").css('display', 'block')
    //     // mapGlyph.merge = true
    // mapGlyph.show(data)

    matrixView.updateData(data,matrixFlag);
    matrixView.highlightData(topicProjection.medoids)


    updatevennView()

    // var resultSessions = filterSessionByTopic(gData,mergedMatrixIndex,data)

    // var length = resultSessions.length
    // var groupSessions = []
    // for(var i=0;i<length;i++){
    //     root = mergeSecurityTree(resultSessions[i])
    //     root.id = i
    //     groupSessions.push(root)
    // }

    // gridEvents.updateData(groupSessions)




}

function notifyGlyphByKeyPlayer(data) {
    mapGlyph.show(data)
}

function notifyKeyPlayer(keyPlayerIndex, allFlag) {
    mapView.updateTrajectoriesByKeyPlayers(keyPlayerIndex, allFlag)
    weiboTable.highlightTable(keyPlayerIndex)
}

function notifyWeibo(data, point) {
    weiboTable.highlightTableByWeibo(data)
}

function showSnap(point) {
    console.log(point)
    var cx = point[0], cy = point[1], color = point[2], nameKey = point[3].key, name='', add = point[4];
    if(add == false) {
        $('#span'+nameKey).click()
        return ;
    }
    var weiboData = point[3].value.weiboData
    var text = ''
    for(var i =0; i<weiboData.length-1;i++) {
        var tmpT = 'Date '+ weiboData[i].dateTime.Format("yyyy-MM-dd") + '\n'
        tmpT += weiboData[i].data.text + '\n\n'
        text += tmpT
        name += weiboData[i].data.name +', '
    }
    var tmpT = 'Date '+ weiboData[weiboData.length-1].dateTime.Format("yyyy-MM-dd") + '\n'
        tmpT += weiboData[weiboData.length-1].data.text + '\n\n'
    text += tmpT
    name += weiboData[weiboData.length-1].data.name
    color = 'rgba('+ color.split('(')[1].split(')')[0] + ',0.5)'
    console.log(cx, cy, color, name, nameKey, text)
    createTag(cx, cy, color, name, nameKey, text)
}
Date.prototype.Format = function (fmt) { //author: meizz 
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "h+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}
function drawGraphTest(nodes) {

}

function notifyMessageSelection(mid) {
    mapView.notifyMessageSelection(mid)
}

function setButtons() {
    $("#buttonDensity").on("click", function() {
        if (mapView.physViewHeight == "city") {
            mapView.physViewHeight = null
            $("#buttonDensity").removeClass("active")
        } else {
            mapView.physViewHeight = "city"
            $("#buttonDensity").addClass("active")
        }
        mapView.redraw()
    })
    $("#buttonCity").on("click", function() {
        if (mapView.physViewCity) {
            mapView.physViewCity = false
            $("#buttonCity").removeClass("active")
        } else {
            mapView.physViewCity = true
            $("#buttonCity").addClass("active")
        }
        mapView.redraw()
    })
    $("#buttonTown").on("click", function() {
        if (mapView.physViewTown) {
            mapView.toggleViewTown(false)
            $("#buttonTown").removeClass("active")
        } else {
            mapView.toggleViewTown(true)
            $("#buttonTown").addClass("active")
        }
        // mapView.redraw()
    })
    $("#buttonRiver").on("click", function() {
        if (mapView.physViewRivers) {
            mapView.physViewRivers = false
            $("#buttonRiver").removeClass("active")
        } else {
            mapView.physViewRivers = true
            $("#buttonRiver").addClass("active")
        }
        mapView.redraw()
    })
    $("#buttonBoundaries").on("click", function() {
        if (mapView.physViewBoarder) {
            mapView.physViewBoarder = false
            $("#buttonBoundaries").removeClass("active")
        } else {
            mapView.physViewBoarder = true
            $("#buttonBoundaries").addClass("active")
        }
        mapView.redraw()
    })
    // $("#buttonContour").on("click", function() {
    //     if (mapView.physViewContour) {
    //         mapView.physViewContour = false
    //         $("#buttonContour").removeClass("active")
    //     } else {
    //         mapView.physViewContour = true
    //         $("#buttonContour").addClass("active")
    //     }
    //     mapView.redraw()
    // })
    $("#buttonAggregation").on("click", function() {
        mapView.aggregationFlag = true;
        $("#buttonIndividual").removeClass("active")
        $("#buttonAggregation").addClass("active")
        mapView.redraw()
    })
    $("#buttonIndividual").on("click", function() {
        mapView.aggregationFlag = false;
        $("#buttonAggregation").removeClass("active")
        $("#buttonIndividual").addClass("active")
        mapView.redraw()
    })

    $("#buttonNavigation").on("click", function() {
        mapView.toggleInteractionMode("navigation");
        $("#buttonLasso").removeClass("active")
        $("#buttonNavigation").addClass("active")
    })
    $("#buttonLasso").on("click", function() {
        mapView.toggleInteractionMode("lasso");
        $("#buttonNavigation").removeClass("active")
        $("#buttonLasso").addClass("active")
    })



    gSlider1 = $("#repostingControl").slider({}).data('slider')
    gSlider1.setValue(1)
    gSlider2 = $("#trajectoryControl").slider({}).data('slider')
    gSlider2.setValue(1)

    $("#resizeButton").on("click", function() {
        mapView.setThresholdControl(gSlider1.getValue(), gSlider2.getValue());
        mapGlyph.topRate = gSlider1.getValue()
        mapGlyph.redraw()
    })


    // resizeHexMapSingle(gSlider.getValue());
}


function checkUniqness(mapping){
	var dataIndex = {}
	var flag = 0
	for(var i in mapping){
		var weiboData = mapping[i].filteredWeiboData
		for(var j=0;j<weiboData.length;j++){
			var mid = weiboData[j].data.mid;
			if(!dataIndex[mid]){
				dataIndex[mid] = {mid:mid,keywords:[]}
			}else{
				flag++
			}
			dataIndex[mid].keywords.push(i)
		}
	}
	console.log("uni",flag,dataIndex)
}
