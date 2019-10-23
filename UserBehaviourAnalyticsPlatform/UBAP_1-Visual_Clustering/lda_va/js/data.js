

function testPrediction(predictedData,actionIndex,categorizedTopics,sessionIndex){
  var count = 0;
  var correctedCount = 0;

  var resultSessions = []

  for(var i in predictedData){
    var fakeCount = 0

    var sessions = predictedData[i]
    for(var j=0;j<sessions.length;j++){
      var probabilityList = sessions[j].softmax
      var originSession = sessions[j].session.split(" ")

      maxValue = d3.max(probabilityList.map(function(d){
        return +d
      }))
      var predictedIndex = sessions[j].label;
      count++      
      if(probabilityList[predictedIndex] == maxValue){
        correctedCount++
        continue;
      }

      var topTenList = d3.entries(probabilityList)
      topTenList = topTenList.sort(function(a,b){
        return (+b.value) - (+a.value)
      }).slice(0,10)
      var newTopTenList = []
      for(var k=0;k<topTenList.length;k++){
        newTopTenList.push({action:actionIndex[topTenList[k].key],value:topTenList[k].value})
      }

      var seq = [];
      //last part is ' '?
      for(var k=0;k<originSession.length;k++){
        if(!actionIndex[originSession[k]]){
          console.log("undif")
          continue;
        }
        seq.push({
          action:actionIndex[originSession[k]],
          correct:true,
        })

      }
      seq.push({
        action:actionIndex[predictedIndex],
        correct:false,
        probabilityList:probabilityList,
        topTenProbabilityList:newTopTenList
      })

      //only use the not corrected data
      var sessionItem = sessionIndex[sessions[j].pfx]

      resultSessions.push({
        id:sessions[j].pfx,
        category:i,
        probabilitySequence:seq,
        anomalSeq:[{
          dateTime:sessionItem.actionsTimestampQueue[sessionItem.actionsTimestampQueue.length-1],
          action:actionIndex[predictedIndex],
          distance:maxValue - probabilityList[predictedIndex]
        }]
      })
    }
  }
  console.log("corrected ratio",correctedCount,count)

  return resultSessions
}

///for the old version of json
// function testPrediction(predictedData,actionIndex,categorizedTopics,sessionIndex){
//   var count = 0;
//   var correctedCount = 0;

//   var fakeSessions = {}
//   var resultSessions = []

//   for(var i in predictedData){
//     var fakeCount = 0

//     var sessions = predictedData[i].data
//     for(var j=0;j<sessions.length;j++){
//       var probabilityList = sessions[j].probability.split(" ")
//       var originSession = sessions[j].sequence.split(" ")

//       maxValue = d3.max(probabilityList.map(function(d){
//         return +d
//       }))
//       var predictedIndex = sessions[j].predictedData;
//       count++      
//       if(probabilityList[predictedIndex] == maxValue){
//         correctedCount++
//         continue;
//       }

//       var seq = [];
//       //last part is ' '?
//       for(var k=0;k<originSession.length;k++){
//         if(!actionIndex[originSession[k]]){
//           console.log("undif")
//           continue;
//         }
//         seq.push({
//           action:actionIndex[originSession[k]],
//           correct:true,
//         })

//       }
//       seq.push({
//         action:actionIndex[predictedIndex],
//         correct:false,
//         probabilityList:probabilityList
//       })

//       //only use the not corrected data
//       var sessionItem = sessionIndex[categorizedTopics[i].sessionPFXs[fakeCount++]]

//       resultSessions.push({
//         category:i,
//         probabilitySequence:seq,
//         anomalSeq:[{
//           dateTime:sessionItem.actionsTimestampQueue[sessionItem.actionsTimestampQueue.length-1],
//           action:actionIndex[predictedIndex],
//           distance:maxValue - probabilityList[predictedIndex]
//         }]
//       })
//     }
//   }
//   console.log("corrected ratio",correctedCount,count)

//   return resultSessions
// }

function filterSessionByTopic(session,topicMatrixs,selectedMatrixs){
  var threshold = 0.9;
  var results = []

  var thresholdLength = 24
  var length = d3.min([thresholdLength,selectedMatrixs.length])


  for(var i=0;i<length;i++){
    var ldaIndex = selectedMatrixs[i].ldaIndex;
    var topicIndex = selectedMatrixs[i].topicIndex;

    var currentMatrix = topicMatrixs[ldaIndex][topicIndex].doc
    var resultSessions = []
    var thresholdNum = d3.min([currentMatrix.length,100])

    for(var j=0;j<thresholdNum;j++){
      if(currentMatrix[j].value>threshold){
        resultSessions.push(session[currentMatrix[j].index])
      }else{
        break;
      }
    }
    results.push(resultSessions)
  }
  return results
}

function extractDocumentTopic(dataIndex,selectedTopics,doc_topic){
  var setThreshold = 0.3;

  var categoryIndex = {}

  var setIndex = {}
  var setThreshold = 0.3

  var returnTopics = {}

  for(var i=0;i<selectedTopics.length;i++){
    var lda = selectedTopics[i].ldaIndex
    var topic = selectedTopics[i].topicIndex
    var index = "LDA"+lda+"Topic"+topic

    selectedTopics[i].rawID = index;

    categoryIndex[index] = {category:index,sessionPFXs:[]}
  }

  for(var i=0;i<dataIndex.length;i++){
    var d = doc_topic[dataIndex[i]]

    var maxValue = 0
    var maxIndex = -1
    var maxArrayIndex = 0

    var candidateTopics = []

    if(d.maxTopics){
      candidateTopics = d.maxTopics
    }else{
      for(var j=0;j<selectedTopics.length;j++){
        var value = +doc_topic[i][selectedTopics[j].rawID]
        if(value>maxValue){
          maxValue = value;
          maxIndex = selectedTopics[j].rawID
          maxArrayIndex = j
        }

        if(value>setThreshold){
          candidateTopics.push(selectedTopics[j].rawID) 
        }

      }
      if(!candidateTopics.length){
        candidateTopics.push(selectedTopics[maxArrayIndex].rawID)
      }
      d.maxTopics = candidateTopics //no need for next time computation
    }

    for(var j=0;j<candidateTopics.length;j++){
      if(!returnTopics[candidateTopics[j]]){
        returnTopics[candidateTopics[j]] = 0
      }
      returnTopics[candidateTopics[j]]++;
    }

  }

  var sortedTopics = d3.entries(returnTopics)
    .sort(function(a,b){
      return b.value - a.value;
    })

  return sortedTopics

}

function unionOperation(setIndex){
  for(var i in setIndex){
    if(setIndex[i].sets.length==1){
      continue;
    }
    for(var j=0;j<setIndex[i].sets.length;j++){
      var cSet = setIndex[i].sets[j];
      setIndex[cSet].size+=setIndex[i].size
    }
  }
}

function assignRawID(topics){
  for(var i=0;i<topics.length;i++){
    var lda = topics[i].ldaIndex
    var topic = topics[i].topicIndex
    var index = "LDA"+lda+"Topic"+topic

    topics[i].rawID = index;

    topics[i].matrixIndex = i;

    topics[i].seriesId = {series:topics[i].ldaIndex,topic:topics[i].topicIndex}
    calculatingRepresentiveActionGroup(topics[i],actionGroupMapping)

  }


      //   for(var i=0;i<data.length;i++){
      //   data[i].matrixIndex = i;
      // }
}

function calculateDocumentCategories_bak(session,selectedTopics,doc_topic){
  var categoryIndex = {}

  var setIndex = {}
  var setThreshold = 0.3

  var maxThreshold = 0

  for(var i=0;i<selectedTopics.length;i++){
    // var lda = selectedTopics[i].ldaIndex
    // var topic = selectedTopics[i].topicIndex
    // var index = "LDA"+lda+"Topic"+topic

    // selectedTopics[i].rawID = index;

    var index = selectedTopics[i].rawID

    categoryIndex[index] = {category:index,sessionPFXs:[]}
  }

  for(var i=0;i<doc_topic.length;i++){
    var maxValue = 0
    var maxIndex = -1
    var maxArrayIndex = 0

    var candidateTopics = []
    for(var j=0;j<selectedTopics.length;j++){
      var value = +doc_topic[i][selectedTopics[j].rawID]
      if(value>maxValue){
        maxValue = value;
        maxIndex = selectedTopics[j].rawID
        maxArrayIndex = j
      }

      if(value>setThreshold){
        candidateTopics.push(selectedTopics[j].rawID) 
      }
    }

    if(!setIndex[candidateTopics]){
      if(!candidateTopics.length){
        setIndex[candidateTopics] = {sets:["Others"],dataIndex:[],size:0,majorGroup:"Others",maxTopics:{}}
      }else{
        setIndex[candidateTopics] = {sets:candidateTopics,dataIndex:[],size:0,majorGroup:selectedTopics[maxArrayIndex].info.majorGroup}
      }
    }
    setIndex[candidateTopics].dataIndex.push(i)
    setIndex[candidateTopics].size++

    if(!candidateTopics.length){
      setIndex[candidateTopics].maxTopics[maxIndex] = true;
    }

    if(maxIndex!=-1 && (+doc_topic[i][maxIndex])>maxThreshold){
      categoryIndex[maxIndex].sessionPFXs.push(session[i].PFX)
    }
  }

  console.log("output",categoryIndex)
  console.log("output",setIndex)
  existingCategories = categoryIndex

  unionOperation(setIndex)

  console.log("output,sets",setIndex)

var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(categoryIndex));

$('<a href="data:' + data + '" download="data.json">download JSON</a>').appendTo('body');


  return setIndex
}

function calculateDocumentCategories(session,selectedTopics,doc_topic){
  var categoryIndex = {}

  var setIndex = {}
  var setThreshold = 0.3
  var outputThreshold = 0.3

  var outputMatrix = []

  var indexByID = {}

  for(var i=0;i<selectedTopics.length;i++){
    // var lda = selectedTopics[i].ldaIndex
    // var topic = selectedTopics[i].topicIndex
    // var index = "LDA"+lda+"Topic"+topic

    // selectedTopics[i].rawID = index;

    var index = selectedTopics[i].rawID

    indexByID[index] = i;
    categoryIndex[index] = {category:index,sessionPFXs:[],majorGroup:selectedTopics[i].info.majorGroup}

    outputMatrix[i] = []
    for(var j=0;j<selectedTopics.length+1;j++){
      outputMatrix[i][j] = 0;
    }
  }
  categoryIndex["Others"] = {category:"Others",sessionPFXs:[],majorGroup:"Others"}
  indexByID["Others"] = selectedTopics.length
    outputMatrix[selectedTopics.length] = []

  for(var j=0;j<selectedTopics.length+1;j++){
    outputMatrix[selectedTopics.length][j] = 0;
  }

  for(var i=0;i<doc_topic.length;i++){
    var maxValue = 0
    var maxIndex = -1
    var maxArrayIndex = 0

    var candidateTopics = []
    for(var j=0;j<selectedTopics.length;j++){
      var value = +doc_topic[i][selectedTopics[j].rawID]
      if(value>maxValue){
        maxValue = value;
        maxIndex = selectedTopics[j].rawID
        maxArrayIndex = j
      }

      if(value>setThreshold){
        candidateTopics.push(selectedTopics[j].rawID) 
      }
    }

    if(!setIndex[candidateTopics]){
      if(!candidateTopics.length){
        setIndex[candidateTopics] = {sets:["Others"],dataIndex:[],size:0,majorGroup:"Others",maxTopics:{}}
      }else{
        setIndex[candidateTopics] = {sets:candidateTopics,dataIndex:[],size:0,majorGroup:selectedTopics[maxArrayIndex].info.majorGroup}
      }
    }
    setIndex[candidateTopics].dataIndex.push(i)
    setIndex[candidateTopics].size++

    if(!candidateTopics.length){
      setIndex[candidateTopics].maxTopics[maxIndex] = true;
    }

    if(maxIndex!=-1 && (+doc_topic[i][maxIndex])>outputThreshold){
      categoryIndex[maxIndex].sessionPFXs.push(session[i].PFX)
      // categoryIndex[maxIndex].sessionPFXs.push(session[i].id)
    }else{
      categoryIndex["Others"].sessionPFXs.push(session[i].PFX)
    }
    session[i].newScore = maxValue
    session[i].belongTopic = maxIndex

    for(var j=0;j<candidateTopics.length;j++){
      for(var k=j;k<candidateTopics.length;k++){
        var index1 = indexByID[candidateTopics[j]]
        var index2 = indexByID[candidateTopics[k]]
        if(index1<=index2){
          outputMatrix[index1][index2]++
        }else{
          outputMatrix[index2][index1]++
        }
      }
    }
    if(!candidateTopics.length){
      outputMatrix[outputMatrix.length-1][outputMatrix.length-1]++
    }

  }

  for(var i=0;i<outputMatrix.length;i++){
    for(var j=0;j<i;j++){
      outputMatrix[i][j] = outputMatrix[j][i]
    }
  }

  console.log("output",categoryIndex)
  console.log("output",setIndex)

  console.log("matrix",outputMatrix)

  if(setIndex[""]){
    categoryIndex["Others"].dataIndex = setIndex[""].dataIndex
  }else{
    categoryIndex["Others"].dataIndex = []
  }

  globalChordData = {matrix:outputMatrix,category:categoryIndex}

  unionOperation(setIndex)

  console.log("output,sets",setIndex)

var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(categoryIndex));
d3.select("#tempDownload").remove()
$('<a id="tempDownload" href="data:' + data + '" download="data.json"> JSON</a>').appendTo('#download');


  testScores(session)
  outputTopics()

  return setIndex
}

function outputTopics(){
  var topics = defaultMedoids

  for(var i=0;i<topics.length;i++){
    var data = topics[i]
    data.sort(function(a,b){
      return b.value - a.value
    })
    var str = "Topic "+i+"- Major ActionGroup: "+topics[i].info.majorGroup+"; Major Actions: "
    for(var j=0;j<3;j++){
      str+=data[j].key+", "
    }
    console.log(str)
  }
}

function printScoreData1(sessions,k,minNum){
  var count = 0

  for(var i=0;i<sessions.length;i++){
    if(sessions[i].actionsQueue.length<minNum){
      continue
    }
    console.log(sessions[i].actionsQueue.toString())
    console.log(sessions[i].SCORE_GLOBAL,sessions[i].newScore)
    count++
    if(count>=k){
      break;
    }
  }
}

function printScoreData(sessions,k,minNum,topK,userGroupFlag){

  var groupByRawID = {}
  var indexByRawID = {}
  for(var i =0;i<defaultMedoids.length;i++){
    groupByRawID[defaultMedoids[i].rawID] = defaultMedoids[i].info.majorGroup
    indexByRawID[defaultMedoids[i].rawID] = i
  }

  var count = 0
  var fmt = d3.format(".2f")

  var myNames = []
  for(var i=0;i<sessions.length;i++){
    if(sessions[i].actionsQueue.length<minNum){
      continue
    }
    // console.log(sessions[i].actionsQueue.toString())

    var actionIndex = {}
    for(var j=0;j<sessions[i].actionsQueue.length;j++){
      var action = sessions[i].actionsQueue[j]
      if(!actionIndex[action]){
        actionIndex[action] = 0
      }
      actionIndex[action]++

    }


    var actionArray = d3.entries(actionIndex).sort(function(a,b){
      return b.value - a.value
    })
    var str = ""
    for(var j=0;j<d3.min([actionArray.length,topK]);j++){
      str += actionArray[j].key+":" + actionArray[j].value+ ","
    }
    console.log(str)

    var groupStr = ""
    if(userGroupFlag){
      groupStr = " to Topic " + indexByRawID[sessions[i].belongTopic] + " (" + groupByRawID[sessions[i].belongTopic] + ")"
    }

    console.log("ID: "+ sessions[i].PFX +",Score: ",sessions[i].SCORE_GLOBAL,"Certainty: "+fmt(sessions[i].newScore) + groupStr)
    count++
    myNames.push(sessions[i].PFX)
    if(count>=k){
      break;
    }
  }  
  for(var i=0;i<myNames.length;i++){
    console.log(myNames[i])
  }
}

function testScores(sessions){
  sessions.sort(function(a,b){
    return (a.SCORE_GLOBAL - a.newScore) - (b.SCORE_GLOBAL - b.newScore)
  })
  // console.log("Low-High",sessions.slice(0,100))
  console.log("Low Score, High Certainty - Frequent Behaviors")
  printScoreData(sessions,10,5,10,true)  
  sessions.sort(function(a,b){
    return -(a.SCORE_GLOBAL - a.newScore) + (b.SCORE_GLOBAL - b.newScore)
  })
  // console.log("Low-Hight",sessions.slice(0,100))
  console.log("High Score, High Uncertainty - Confirmed Suspicious Behaviors")
  printScoreData(sessions,50,5,10)  


  sessions.sort(function(a,b){
    return (a.SCORE_GLOBAL + a.newScore) - (b.SCORE_GLOBAL + b.newScore)
  })
  // console.log("Low-low",sessions.slice(0,100))
  console.log("Low Score, High Uncertainty - False Negative")
  printScoreData(sessions,50,5,10)

  sessions.sort(function(a,b){
    return -(a.SCORE_GLOBAL + a.newScore) + (b.SCORE_GLOBAL + b.newScore)
  })
  // console.log("High-high",sessions.slice(0,100))
  console.log("High Score, High Certainty - False Positive")
  printScoreData(sessions,10,5,10,true)


  testUsers(sessions)

}

// function printUsers(userArray,topK){
//   var fmt = d3.format(".2f")

//   for(var i=0;i<userArray.length;i++){
//     var key = userArray[i].key
//     var score = userArray[i].value.score
//     var data = userArray[i].value.data

//     var actionIndex = {}
//     for(var j=0;j<data.length;j++){
//       for(var k=0;k<data[j].actionsQueue.length;k++){
//         var action = data[j].actionsQueue[k]
//         if(!actionIndex[action]){
//           actionIndex[action] = 0
//         }
//         actionIndex[action]++
//       }
//     }

//     var actionArray = d3.entries(actionIndex).sort(function(a,b){
//       return b.value - a.value
//     })
//     var str = ""
//     for(var j=0;j<d3.min([actionArray.length,topK]);j++){
//       str += actionArray[j].key+":" + actionArray[j].value+ ","
//     }
//     console.log("User: "+key, "Average Score: "+fmt(score))
//     console.log(str)
//   }
// }

function printUsers(userArray,topK){
  var fmt = d3.format(".2f")

  for(var i=0;i<userArray.length;i++){
    var key = userArray[i].key
    var score = userArray[i].value.score
    var data = userArray[i].value.data

    var actionIndex = {}
    for(var j=0;j<data.length;j++){
      for(var k=0;k<data[j].actionsQueue.length;k++){
        var action = data[j].actionsQueue[k]
        if(!actionIndex[action]){
          actionIndex[action] = 0
        }
        actionIndex[action]++
      }
    }

    var actionArray = d3.entries(actionIndex).sort(function(a,b){
      return b.value - a.value
    })
    var str = ""
    for(var j=0;j<d3.min([actionArray.length,topK]);j++){
      str += actionArray[j].key+":" + actionArray[j].value+ ","
    }
    var groupStr = ""
    var groupIndex = userArray[i].value.groupIndex
    for(var j in groupIndex){
      groupStr += "Topic: "+ groupIndex[j].index+groupIndex[j].group +" - Mean: " + fmt(groupIndex[j].mean) +"; Variance: " + fmt(groupIndex[j].variance) + "; Count: " + groupIndex[j].values.length + ";\n"
    }
    console.log("User: "+key, "- Average Score: "+fmt(score), "Variance: " + fmt(userArray[i].value.variance), "Group Info:")
    console.log(groupStr)
    console.log(str)
  }
}


function testUsers(data){

  var groupByRawID = {}
  var indexByRawID = {}
  for(var i =0;i<defaultMedoids.length;i++){
    groupByRawID[defaultMedoids[i].rawID] = defaultMedoids[i].info.majorGroup
    indexByRawID[defaultMedoids[i].rawID] = i
  }



  var userIndex = {}
  for(var i=0;i<data.length;i++){
    var user = data[i].userId;
    if(!userIndex[user]){
      userIndex[user] = {id:user,data:[]}
    }
    userIndex[user].data.push(data[i])
  }
  for(var i in userIndex){
    var val = 0
    var array = userIndex[i].data
    if(array.length<5){
      delete userIndex[i]
      continue
    }

    var groupIndex = {}
    var allValues = []
    for(var j=0;j<array.length;j++){
      val+=array[j].newScore
      allValues.push(array[j].newScore)
      var group = groupByRawID[array[j].belongTopic]
      var index = indexByRawID[array[j].belongTopic]
      if(!groupIndex[group]){
        groupIndex[group] = {index:index,group:group,values:[]}
      }
      groupIndex[group].values.push(array[j].newScore)
    }

    for(var j in groupIndex){
      var values = groupIndex[j].values
      groupIndex[j].min = d3.min(values)
      groupIndex[j].max = d3.max(values)
      groupIndex[j].mean = d3.mean(values)
      groupIndex[j].median = d3.median(values)
      groupIndex[j].variance = d3.variance(values)
      if(isNaN(groupIndex[j].variance)){
        groupIndex[j].variance = 0
      }
    }
    userIndex[i].groupIndex = groupIndex
    userIndex[i].score = val/array.length

    userIndex[i].max = d3.max(allValues)
    userIndex[i].min = d3.min(allValues)
    userIndex[i].groupCount = d3.entries(groupIndex).length
    userIndex[i].distance = userIndex[i].max - userIndex[i].min
    // userIndex[i].variance = d3.variance(allValues)

    var medianValues = []
    for(var j in groupIndex){
      medianValues.push(groupIndex[j].median)
    }
    userIndex[i].variance = d3.variance(medianValues)

    var diverseHigh = 0
    var diverseCount = 0
    for(var j in groupIndex){
      diverseHigh+=groupIndex[j].mean
      diverseCount+=groupIndex[j].values.length
    }
    diverseCount/=userIndex[i].groupCount
    userIndex[i].diverseHigh = diverseHigh/userIndex[i].groupCount
    userIndex[i].diverseHigh += diverseCount/100

      if(isNaN(userIndex[i].variance)){
        userIndex[i].variance = 0
      }


    userIndex[i].alwaysHigh = userIndex[i].max + userIndex[i].score + (1-userIndex[i].min)
    if(userIndex[i].groupCount==1){
      userIndex[i].focusingHigh = userIndex[i].alwaysHigh
    }else{
      userIndex[i].focusingHigh = 0
    }


    if(userIndex[i].groupCount>1){
      // userIndex[i].diverseHigh = userIndex[i].alwaysHigh
    }else{
      userIndex[i].diverseHigh = 0
    }
    // userIndex[i].difference = userIndex[i].distance + userIndex[i].variance
    userIndex[i].difference = userIndex[i].variance

  }
  var userArray = d3.entries(userIndex).sort(function(a,b){
    return b.value.focusingHigh - a.value.focusingHigh
  })
  // console.log("Routine Users",userArray.slice(0,100))
  console.log("Routine Users - High Certainties of Behaviors for Focusing")
  printUsers(userArray.slice(0,20),10)

  var userArray = d3.entries(userIndex).sort(function(a,b){
    return b.value.diverseHigh - a.value.diverseHigh
  })
  // console.log("Routine Users",userArray.slice(0,100))
  console.log("Routine Users - High Certainties of Behaviors for Diversity")
  printUsers(userArray.slice(0,20),10)

  var userArray = d3.entries(userIndex).sort(function(a,b){
    return -b.value.score + a.value.score
  })
  // console.log("Routine Users",userArray.slice(0,100))
  console.log("Random Users - Low Certainties of Behaviors")
  printUsers(userArray.slice(0,20),10)


  userArray.sort(function(a,b){
    return b.value.difference - a.value.difference
  })
  // console.log("Focusing Users",userArray.slice(0,100))
  console.log("Focusing Users - High Variance of Behaviors")
  printUsers(userArray.slice(0,20),10)




}
// function testUsers(data){
//   var userIndex = {}
//   for(var i=0;i<data.length;i++){
//     var user = data[i].userId;
//     if(!userIndex[user]){
//       userIndex[user] = {id:user,data:[]}
//     }
//     userIndex[user].data.push(data[i])
//   }
//   for(var i in userIndex){
//     var val = 0
//     var array = userIndex[i].data
//     if(array.length<5){
//       delete userIndex[i]
//       continue
//     }
//     for(var j=0;j<array.length;j++){
//       val+=array[j].newScore
//     }
//     userIndex[i].score = val/array.length
//   }
//   var userArray = d3.entries(userIndex).sort(function(a,b){
//     return b.value.score - a.value.score
//   })
//   // console.log("Routine Users",userArray.slice(0,100))
//   console.log("Routine Users - High Certainties of Behaviors")
//   printUsers(userArray.slice(0,10),10)

//   userArray.sort(function(a,b){
//     return a.value.score - b.value.score
//   })
//   // console.log("Focusing Users",userArray.slice(0,100))
//   console.log("Focusing Users - High Uncertainties of Behaviors")
//   printUsers(userArray.slice(0,10),10)




// }

function processDocTopicData(session,topicMatrixs,doc_topic){
  console.log(session,doc_topic)

  var topicMatch = {}
  var testData = doc_topic[0]
    var reg = /\d+/g

  for(var i in testData){
    var result = i.match(reg)
    var ldaIndex = result[0]
    var topicIndex = result[1]

    topicMatch[i] = {ldaIndex:ldaIndex,topicIndex:topicIndex}
  }

  for(var i=0;i<doc_topic.length;i++){
    for(var j in doc_topic[i]){
      var id = topicMatch[j]
      topicMatrixs[id.ldaIndex][id.topicIndex].doc.push({index:i,value:+doc_topic[i][j]})
    }
  }

  for(var i in topicMatrixs){
    for(var j in topicMatrixs[i]){
      topicMatrixs[i][j].doc.sort(function(a,b){
        return b.value - a.value;
      })
    }
  }

  console.log("topicMatrixs,",topicMatrixs)
}

function filterNoSession(data){
  var newData = []
  for(var i=0;i<data.length;i++){
    if(!data[i].actionsQueue || !data[i].actionsQueue.length){
      continue;
    }
    newData.push(data[i])
  }
  return newData
}

function processTopicData(data){
    var newData = []

    for(var i=0;i<data.length;i++){
      for(var j in data[i]){
        data[i][j] = +data[i][j]
      }
      var newList = d3.entries(data[i])
      newData.push(newList)
    }

    return newData  
}


function extractDataByUser(data){
  var userIndex = {}
  for(var i=0;i<data.length;i++){
    var user = data[i].userId;
    if(!userIndex[user]){
      userIndex[user] = {id:user,data:[]}
    }
    userIndex[user].data.push(data[i])
  }
  var userArray = d3.entries(userIndex).sort(function(a,b){
    return b.value.data.length - a.value.data.length
  })
  return [userIndex,userArray]
}

function extractDataByCluster(data,userClusterIndex){
  // var userIndex = {}
  var clusterIndex = {}

  for(var i in userClusterIndex){
    clusterIndex[userClusterIndex[i]] = {id:userClusterIndex[i],data:[]}
  }

  for(var i=0;i<data.length;i++){
    var user = data[i].userId;
    if(!clusterIndex[userClusterIndex[user]]){
      console.log("error")
      continue;
      // userIndex[user] = {id:user,data:[]}
    }
    clusterIndex[userClusterIndex[user]].data.push(data[i])
  }
  var userArray = d3.entries(clusterIndex).sort(function(a,b){
    return b.value.data.length - a.value.data.length
  })
  return [clusterIndex,userArray]
}


function mergeSecurityTree(data){
  var actionIndex = {}
  var id = 0;
  var root = {"name":'root',childrenIndex:{},children:[],size:1,id:id++}
  var count = 0;
  for(var i=0;i<data.length;i++){
    var actions = data[i].actionsQueue
    var currentNode = root;
    if(!actions){
      continue;
    }
    count++
    for(var j=0;j<actions.length;j++){
      if(!currentNode.childrenIndex[actions[j]]){
        currentNode.childrenIndex[actions[j]] = currentNode.children.length+1;
        currentNode.children.push({name:actions[j],size:0,childrenIndex:{},children:[],id:id++})
      }
      var index = currentNode.childrenIndex[actions[j]] - 1;
      currentNode.children[index].size++;
      currentNode = currentNode.children[index];
    }
  }
  // root.size = count;

  travelDepth(root)


  console.log("root",root)
  var dRoot = d3.hierarchy(root)
  return dRoot;
}

function travelDepth(root){
  if(root.children && !root.children.length){
    root.leafSize = root.size;
  }
  for(var i=0;i<root.children.length;i++){
    travelDepth(root.children[i])
  }
}


//////////////////

function processMergeRoots(data,beforeTime,afterTime){
  var nodes = []
  var edges = []
  var events = []
  //data is vertual nodes
  for(var i=0;i<data.children.length;i++){
    var root = d3.hierarchy(data.children[i])
    // process1(root)
    var currentNodes = root.descendants();
    var currentEdges = []

    var filteredCurrentNodes = []
    for(var j=0;j<currentNodes.length;j++){
      currentNodes[j].data.file = i;
      currentNodes[j].file = i;
      // if(!currentNodes[j].data.t){
      //   currentNodes[j].data.t = 
      // }
      var t = +currentNodes[j].data.t
      if(beforeTime && t<beforeTime){
        continue;
      }     
      if(afterTime && t>afterTime){
        continue;
      } 
      currentNodes[j].id = currentNodes[j].id?currentNodes[j].id:currentNodes[j].data.mid;
      currentNodes[j].dateTime = new Date(+currentNodes[j].data.t*1000)
      currentNodes[j].data.timeStamp = currentNodes[j].dateTime.getLumpyString()
      currentNodes[j].data.degree = currentNodes[j].data.children.length;
      currentNodes[j].data.depth = currentNodes[j].depth
      currentNodes[j].data.parent = currentNodes[j].parent
      filteredCurrentNodes.push(currentNodes[j])
      if(j!=0){
        var edge = {source:currentNodes[j].parent.data.mid,
          target:currentNodes[j].data.mid}
        edges.push(edge)
        currentEdges.push(edge)
      }
      nodes.push(currentNodes[j])
    }
    currentNodes = filteredCurrentNodes

    var timeRange = d3.extent(currentNodes.map(function(d){
      return +d.data.t
    }))
    var timeLength = timeRange[1] - (+root.data.t)
    if(!timeLength){
      timeLength = 0
    }
    root.timeLength = timeLength;

    root.allNodes = currentNodes;
    root.allEdges = currentEdges

    if(!currentNodes.length){
      continue;
    }


    events.push(root)
  }
  return {nodes:nodes,
    edges:edges,events:events}
}

function mergeKeywords(events){
    var M = events.length;
    var smData = events
    for(var i=0;i<M;i++){
      var text = ""
      for(var j=0;j<smData[i].allNodes.length;j++){
        if(smData[i].allNodes[j].data.text){
          text+= smData[i].allNodes[j].data.text;
          text+= " "
        }
      }
      // text+= smData[i].key;
      smData[i].textAggregation = text
    }
    return smData
}

// function fetchTexts(root,dataArray,threshold,rootFlag){
//   if(!root || !root.children){
//     return;
//   }
//   var texts = root.data.text + " ";
//   for(var i=0;i<root.children.length;i++){
//     fetchTexts(root.children[i],dataArray,threshold)
//     texts+=root.children[i].data.text;
//     texts+=" "
//   }
//   if(rootFlag || (root.children && root.children.length>=threshold)){
//     root.textAggregation = texts
//     dataArray.push(root)
//   }
// }

function fetchTexts(root,dataArray,threshold,rootFlag){
  if(!root || !root.children){
    return 1;
  }
  var texts = root.data.text + " ";
  var nodeNum = 0;
  for(var i=0;i<root.children.length;i++){
    var number = fetchTexts(root.children[i],dataArray,threshold)
    texts+=root.children[i].data.text;
    texts+=" "
    nodeNum+=number;
  }
  root.nodeNum = nodeNum+1
  if(rootFlag || (root.children && root.nodeNum>=threshold)){
    root.textAggregation = texts
    dataArray.push(root)
  }
  return root.nodeNum
}


function mergeKeywordsKeyPlayer(events){
    var totalNumber = 0;
    for(var i=0;i<events.length;i++){
      totalNumber+=events[i].allNodes.length;
    }
    // var threshold = Math.sqrt(totalNumber)/2.0
    var threshold = Math.sqrt(totalNumber)

    // threshold = 4

    var M = events.length
    var keyWeibos = []
    
    for(var i=0;i<M;i++){
      fetchTexts(events[i],keyWeibos,threshold,false)
    }
    console.log("large", keyWeibos)
    return keyWeibos
}

function mergeKeywordsTime(data){
    var timeBins = []
    var allNodes = data.nodes;

    var binNum = 10;
    
    var timeMapping = d3.scaleLinear().domain(d3.extent(allNodes.map(function(d){
      return d.dateTime
    }))).range([0,binNum-1])


    var fakeNodes = []
    var events = data.events;
    var fCount = 0

    for(var i=0;i<events.length;i++){
      events[i].timeNodes = []
      for(var k=0;k<binNum;k++){
        events[i].timeNodes.push({rawData:[],textAggregation:" ",eventIndex:i,
          stTime:timeMapping.invert(k),
          edTime:timeMapping.invert(k+1),
          data:{
            mid:"f"+(fCount++),
          }
        })
      }
      for(var j=0;j<events[i].allNodes.length;j++){
        if(events[i].allNodes[j].data.text){
          var timeIndex = parseInt(timeMapping(events[i].allNodes[j].dateTime))
          // var tt = events[i].timeNodes[timeIndex].texts;

          events[i].timeNodes[timeIndex].rawData.push(events[i].allNodes[j])
          events[i].timeNodes[timeIndex].textAggregation+= events[i].allNodes[j].data.text;
          events[i].timeNodes[timeIndex].textAggregation+= " "

        }

      }
      for(var k=0;k<binNum;k++){
        if(events[i].timeNodes[k].rawData.length){
          fakeNodes.push(events[i].timeNodes[k])
        }
      }
      // text+= smData[i].key;
      // events[i].textAggregation = text
    }
    console.log(fakeNodes)

    return fakeNodes

}

function filterNodeLinks(data){
        // eventMatrix = processEvents(data.events,data.nodes.length)

        var nodes = data.nodes;
        var edges = data.edges;
        var N = nodes.length;
        // N = 2000
        // nodes = nodes.slice(0,N)
        var nodeIndex = {}
        newNodes = []

        var eventIndex = {}

        peopleIndex = {}
        for(var i=0;i<N;i++){
            // nodes[i].id = nodes[i].name
            if(nodes[i].data.degree<1){
                continue;
            }
            ////add time filter
            var t = +nodes[i].data.t
            if(t<1451577600){
              continue;
            }
          if(nodeIndex[nodes[i].data.mid]){
            console.log("exist")
            continue;
          }
          newNodes.push(nodes[i])

          nodeIndex[nodes[i].data.mid] = newNodes.length-1

        }
        nodes = newNodes
        nodesWithEdge = {}
        var newEdges = []
        for(var i=0;i<edges.length;i++){
            if(!nodeIndex[edges[i].source] || !nodeIndex[edges[i].target]){
                // console.log('eee')
                continue
            }
            if(nodes[nodeIndex[edges[i].source]].file != nodes[nodeIndex[edges[i].target]].file){
              console.log("why not match")
              continue
            }
            nodesWithEdge[edges[i].source] = true;
            nodesWithEdge[edges[i].target] = true;
            newEdges.push(edges[i])
            // newEdges.push({
            //     source:nodeIndex[edges[i].source],
            //     target:nodeIndex[edges[i].target],
            //     type:"link"
            // })
        }
        edges = newEdges

        //again filter the nodes
        newNodes = [];
        nodeIndex = {}
        count = 0;
        for(var i=0;i<nodes.length;i++){
          if(nodesWithEdge[nodes[i].data.mid] && !nodeIndex[nodes[i].data.mid]){
            newNodes.push(nodes[i])
          }else{
            continue;
          }
          count++
          nodeIndex[nodes[i].data.mid] = newNodes.length-1

         if(!eventIndex[nodes[i].data.file]){
            eventIndex[nodes[i].data.file] = []
          }
          eventIndex[nodes[i].data.file].push(nodes[i])


          uid = nodes[i].data.uid
          if(!peopleIndex[uid]){
              peopleIndex[uid] = {nodes:[],name:uid}
          }
          peopleIndex[uid].nodes.push(nodes[i])


        }
        nodes = newNodes;
        console.log(count)

        //add additional edges

        peopleEdge = []
        for(var uid in peopleIndex){
            var connectedNodes = peopleIndex[uid].nodes;
            for(var i=0;i<connectedNodes.length-1;i++){
                peopleEdge.push({
                    source:nodeIndex[connectedNodes[i].name],
                    target:nodeIndex[connectedNodes[i+1].name],
                    type:"people"
                })
            }
        }
        console.log(peopleEdge)

        graph = {
          nodes:nodes,
          links:edges
        }  

        return {graph:graph,nodeIndex:nodeIndex,eventIndex}
}

function mergeEvents(events){
   return binningSource(events)
}

function binningSource(events,binNum){
  if(!binNum){
    binNum = 10;
  }


  var xScale = d3.scaleLinear().domain(d3.extent(events.map(function(d){
    return d.projPos[0]
  }))).range([0,binNum])

  var yScale = d3.scaleLinear().domain(d3.extent(events.map(function(d){
    return d.projPos[1]
  }))).range([0,binNum])

  var newEvents = {};
  for(var i=0;i<events.length;i++){
    var x = parseInt(xScale(events[i].projPos[0]))
    var y = parseInt(yScale(events[i].projPos[1]))

    var key = x+','+y
    if(!newEvents[key]){
      newEvents[key] = {allNodes:[],allEdges:[],children:[],parent:null,projPos:[0,0],totalChildren:0}
    }
    newEvents[key].children.push(events[i])
    newEvents[key].allNodes = newEvents[key].allNodes.concat(events[i].allNodes)
    newEvents[key].allEdges = newEvents[key].allEdges.concat(events[i].allEdges)
    newEvents[key].projPos[0]+=events[i].projPos[0];
    newEvents[key].projPos[1]+=events[i].projPos[1];
    newEvents[key].totalChildren += events[i].data.totalChildren
  }
  var resultEvents = []
  for(var i in newEvents){
    if(newEvents[i].children>1){
      newEvents[i].projPos[0] = newEvents[i].projPos[0]/newEvents[i].children.length;
      newEvents[i].projPos[1] = newEvents[i].projPos[1]/newEvents[i].children.length;
    }
    resultEvents.push(d3.hierarchy(newEvents[i]))
  }
  for(var i=0;i<resultEvents.length;i++){
    resultEvents[i].projPos = resultEvents[i].data.projPos;
    resultEvents[i].allNodes = resultEvents[i].data.allNodes;
    resultEvents[i].allEdges = resultEvents[i].data.allEdges;
  }
  return resultEvents

}

function createProjectedTrees(events,extent){
  var radius = extent.width>extent.height?extent.height:extent.width;

  var timeExtents;

  // var radiusMapping = d3.scaleLinear().domain(d3.extent(events.map(function(d){
  //   return d.allNodes.length;
  // }))).range([radius/10.0,radius/1.0])

  var radiusMapping = d3.scaleLinear().domain(d3.extent(events.map(function(d){
    return d.timeLength;
  }))).range([radius/10.0,radius/1.0])

  var xScale = d3.scaleLinear().domain(d3.extent(events.map(function(d){
    return d.projPos[0]
  }))).range([0,extent.width])

  var yScale = d3.scaleLinear().domain(d3.extent(events.map(function(d){
    return d.projPos[1]
  }))).range([0,extent.height])

  var allNodes = []
  var allLinks = []
  var allOriNodes = []

  for(var i=0;i<events.length;i++){
    // var eData = createTree(events[i],radiusMapping(events[i].allNodes.length),i)
    var eData = createTree(events[i],radiusMapping(events[i].timeLength),i)
    var centerPos = [xScale(events[i].projPos[0]),yScale(events[i].projPos[1])]
    for(var k=0;k<eData.nodes.length;k++){
      eData.nodes[k].data.loc[0] += centerPos[0];
      eData.nodes[k].data.loc[1] += centerPos[1];
      allNodes.push(eData.nodes[k])
    }
    for(var k=0;k<eData.oriNodes.length;k++){
      allOriNodes.push(eData.oriNodes[k])
    }
    for(var k=0;k<eData.links.length;k++){
      allLinks.push(eData.links[k])
    }
  }
  return {oriNodes:allOriNodes,nodes:allNodes,links:allLinks}


}



// function createTree(event,radius,number){

//   var tree = d3.tree()
//     .size([360,radius/2.0])
//     .separation(function(a,b){
//       return (a.parent == b.parent?1:2)/a.depth
//     })

//   function project(x,y){
//     var angle = (x-90)/180*Math.PI;
//     var radius = y;
//     return [radius*Math.cos(angle),radius*Math.sin(angle)];
//   }

//   var eventTree = tree(event)

//   var nodes = eventTree.descendants();
//   for(var i=0;i<nodes.length;i++){
//     nodes[i].data.loc = project(nodes[i].x,nodes[i].y)
//   }

//   var oriNodesFiltered = []
//   if(nodes.length){
//     nodes[0].id = number+","+0;
//     oriNodesFiltered.push(nodes[0])
//   }

//   var links = []

//   var linkNodes = []

//   var k = 0;
//   var tempSVG = d3.select("body").append("svg").attr("id","tempSvg")
//   for(var i=1;i<nodes.length;i++){
//     var target = nodes[i];
//     var source = nodes[i].parent;

//     /////***...
//     // if(nodes[i].data.data){
//     //   nodes[i].data = nodes[i].data.data
//     // }
//     ////**

//     var path = tempSVG.append("path")
//       .attr("d",function(d){
//         return "M" + source.data.loc +
//           "C" + [source.data.loc[0],(source.data.loc[1]+target.data.loc[1])/2.0]
//           + " " + [target.data.loc[0],(source.data.loc[1]+target.data.loc[1])/2.0]
//           + " " + target.data.loc
//         // return "M"+source.data.loc+"L"+target.data.loc;
//       })
//     if(target.data.totalChildren<2){
//       continue;
//     }


//     var nodesAlongPath = [];
//     path = path.node()
//     var l = path.getTotalLength()
//     var sNum = 20;
//     for(var j=0;j<=sNum;j++){
//       var p = path.getPointAtLength(1.0*j/sNum*l)
//       var newNode = {id:number+","+k,depth:source.depth+1.0*j/sNum,data:{loc:[p.x,p.y],totalChildren:source.data.totalChildren}}
//       nodesAlongPath.push(newNode)
//       linkNodes.push(newNode)
//       // linkNodes.push({id:number+","+k,depth:source.depth+1.0*j/sNum,data:{loc:[p.x,p.y],totalChildren:source.data.totalChildren}})
//       k++;
//     }
//     links.push({source:source,target:target,nodesAlongPath:nodesAlongPath})

//     target.id = linkNodes[linkNodes.length-1].id;
//     oriNodesFiltered.push(target)

//   }
//   d3.select("#tempSvg").remove();

//   return {oriNodes:oriNodesFiltered,nodes:linkNodes,links:links,tree:eventTree}

// }


function createTree(event,radius,number){

  var root = event;
  root.x = 0;
  root.y = 0;
  root.data.loc = [root.x,root.y]
  root.id = number +"," +0
  var oriNodesFiltered = []

  oriNodesFiltered.push(root)

  var quant = d3.quantile(root.allNodes.map(function(d){
    return +d.data.t
  }),0.75)
  var ratio = 0.8;
  var timeLengthQuant = quant - (+root.data.t)
  if(!timeLengthQuant){
    timeLengthQuant = 0 
  }
  var radiusMapping = d3.scaleLinear().domain([0,timeLengthQuant,event.timeLength])
    .range([0,radius/2.0*ratio,radius/2.0])

///directly use the original time mapping
  // var radiusMapping = d3.scaleLinear().domain([0,event.timeLength])
  //   .range([0,radius/2.0])

  var nodes = event.allNodes

///use the filtered tnodes' time mapping
  // var nodes = [];
  // for(var i=0;i<event.allNodes.length;i++){
  //   if(!event.allNodes[i].textAggregation){
  //     continue;
  //   }
  //   nodes.push(event.allNodes[i])
  // }
  // var timeExtent = d3.extent(nodes.map(function(d){
  //   return +d.data.t
  // }))
  // var newTimeLength = timeExtent[1]-timeExtent[0]
  // if(!newTimeLength){
  //   newTimeLength = 0
  // }
  // var radiusMapping = d3.scaleLinear().domain([0,newTimeLength])
  //   .range([0,radius/2.0])

  var links = []

  var linkNodes = []

  var k = 0;
  var tempSVG = d3.select("body").append("svg").attr("id","tempSvg")
  for(var i=1;i<nodes.length;i++){
    var target = nodes[i];
    var source = nodes[i].parent;

    if(!nodes[i].textAggregation){
      continue;
    }
    var timeLength = (+nodes[i].data.t) - (+root.data.t)
    var currentRadius = radiusMapping(timeLength)
    if(!source.projPos || !target.projPos){
      console.log("err no proj")
      continue
    }
    var relativeX = target.projPos[0] - root.projPos[0];
    var relativeY = target.projPos[1] - root.projPos[1];
    var dis = Math.sqrt(relativeX*relativeX + relativeY*relativeY)
    var x = relativeX * (currentRadius/dis)
    var y = relativeY * (currentRadius/dis)

    target.data.loc = [x,y]



    if(source.data.loc[0]!=0 && !source.data.loc[0]){
      console.log("err")
    }

    var path = tempSVG.append("path")
      .attr("d",function(d){
        return "M" + source.data.loc +
          "C" + [source.data.loc[0],(source.data.loc[1]+target.data.loc[1])/2.0]
          + " " + [target.data.loc[0],(source.data.loc[1]+target.data.loc[1])/2.0]
          + " " + target.data.loc
        // return "M"+source.data.loc+"L"+target.data.loc;
      })


    // if(target.data.totalChildren<2){
    //   continue;
    // }
    // console.log(path)


    var nodesAlongPath = [];
    path = path.node()
    var l = path.getTotalLength()
    var sNum = 20;
    for(var j=0;j<=sNum;j++){
      var p = path.getPointAtLength(1.0*j/sNum*l)
      var newNode = {id:number+","+k,depth:source.depth+1.0*j/sNum,data:{loc:[p.x,p.y],totalChildren:source.data.totalChildren}}
      nodesAlongPath.push(newNode)
      linkNodes.push(newNode)
      // linkNodes.push({id:number+","+k,depth:source.depth+1.0*j/sNum,data:{loc:[p.x,p.y],totalChildren:source.data.totalChildren}})
      k++;
    }
    links.push({source:source,target:target,nodesAlongPath:nodesAlongPath})

    target.id = linkNodes[linkNodes.length-1].id;
    oriNodesFiltered.push(target)

  }
  d3.select("#tempSvg").remove();

  return {oriNodes:oriNodesFiltered,nodes:linkNodes,links:links,tree:event}

}

function deriveKeywords(textData){
  var wordIndex = {}
  for(var i=0;i<textData.length;i++){
    var words = textData[i].words;
    var num = textData.length;

    for(var j=0;j<words.length;j++){
      var word = words[j][0];
      var freq = words[j][1];
      if(!wordIndex[word]){
        wordIndex[word] = {
          word:word,
          data:[],
          ratio:0,
          count:0
        }
      }
      wordIndex[word].data.push(textData[i])
      wordIndex[word].ratio+= freq*num;
    }
  }
  var wordList = d3.entries(wordIndex);
  wordList.sort(function(a,b){
    return b.value.ratio - a.value.ratio;
  })
  console.log('word',wordList)
  return {wordIndex:wordIndex,wordList:wordList}
}

function deriveKeywordsWeibos(wordList,dataList){

  console.time("derive keywords")

  for(var i=0;i<dataList.length;i++){
    dataList[i].keywords = []
  }
  wordCount = 0

  //filter the non important keywords
  var wordThreshold = 500

  wordList = wordList.slice(0,wordThreshold)


  // for(var i=0;i<wordList.length;i++){
  for(var i=0;i<wordList.length;i++){    
    var word = wordList[i].key;
    var allNodes = []
    for(var j=0;j<dataList.length;j++){
      var text = dataList[j].data.text
      if(text.indexOf(word)!=-1){
        allNodes.push(dataList[j])
        dataList[j].keywords.push(word)
        wordList[i].value.count++
        wordCount++
      }
    }
    wordList[i].allNodes = allNodes;
    wordList[i].data = {name:word}
  }

  console.timeEnd("derive keywords")
  console.log("total Word Count", wordCount)

  return {wordList:wordList,wordCount:wordCount};
}

function calculateKeywordsFrequenceyByTime(dataList,wordIndex,wordCount,idf){

  var timeRange = d3.extent(dataList.map(function(d){
    return d.dateTime
  }))

  var binNum = 10;
  var timeMapping = d3.scaleLinear().domain(timeRange)
    .range([0,binNum])

  var timeSlot = {}


  for(var i=0;i<dataList.length;i++){
    var timeIndex = parseInt(timeMapping(dataList[i].dateTime))
    if(timeIndex==binNum){
      timeIndex = binNum-1
    }
    if(!timeSlot[timeIndex]){
      timeSlot[timeIndex] = {
        stTime:timeMapping.invert(timeIndex),
        edTime:timeMapping.invert(timeIndex+1),
        keywordIndex:{},
        allNodes:[]
      }
    }
    timeSlot[timeIndex].allNodes.push(dataList[i])
    var kIndex = timeSlot[timeIndex].keywordIndex
    var keywords = dataList[i].keywords;
    for(var j=0;j<keywords.length;j++){
      var word = keywords[j];
      if(!kIndex[word]){
        kIndex[word] = {count:0,tf:0,idf:0,tfidf:0}
      }
      kIndex[word].count++
    }
  }
  for(var i in timeSlot){
    var kIndex = timeSlot[i].keywordIndex;
    for(var j in kIndex){
      kIndex[j].tf = 2*kIndex[j].count/wordCount;
      kIndex[j].idf = Math.log(wordCount/(wordIndex[j].data.length+1))
      kIndex[j].tfidf = kIndex[j].tf*kIndex[j].idf
    }

    var keywords = d3.entries(kIndex)
    // keywords.sort(function(a,b){
    //   return b.value.count - a.value.count
    // })
    keywords.sort(function(a,b){
      return b.value.tfidf - a.value.tfidf
    })

    timeSlot[i].keywords = keywords
  }
  console.log("timeSlot",timeSlot)
  return timeSlot
}

function mergeKeywordsTimeSlot(timeSlot,wordIndex,allWordList,showAll){
  var threshold = 5

  var nodes = []

  var selectedKeywordIndex = {}
  // for(var i=0;i<timeSlot.length;i++){
  for(var i in timeSlot){
    var keyword = timeSlot[i].keywords;
    var count = 0;
    for(var j=0;j<keyword.length;j++){
      var word = keyword[j];
      if(!selectedKeywordIndex[word.key]){
        count++
        selectedKeywordIndex[word.key] = {value:wordIndex[word.key],timeSlot:[],slotIndex:i}
      }
      selectedKeywordIndex[word.key].timeSlot.push(timeSlot[i])
      if(count>threshold){
        break;
      }
    }
  }

  var selectedWordList = []

  // for(var i in selectedKeywordIndex){
  //   var keyword = selectedKeywordIndex[i].value;
  //   for(var j=0;j<keyword.data.length;j++){
  //     nodes.push(keyword.data[j])
  //   }
  //   selectedKeywordIndex[i].value.timeSlot = selectedKeywordIndex[i].timeSlot;
  //   selectedWordList.push({key:i,value:selectedKeywordIndex[i].value})
  // }

  for(var i=0;i<allWordList.length;i++){
    var keyword = allWordList[i].key;
    if(selectedKeywordIndex[keyword]){
      allWordList[i].timeSlot = selectedKeywordIndex[keyword].timeSlot
      allWordList[i].slotIndex = selectedKeywordIndex[keyword].slotIndex

      selectedWordList.push(allWordList[i])
    }
  }
  selectedWordList.sort(function(a,b){
    return a.slotIndex - b.slotIndex
  })


  var mappedVals = []
  for(var i=0;i<selectedWordList.length;i++){
      mappedVals.push(+selectedWordList[i].slotIndex)
  }
  var mappingVal = d3.scaleLinear().domain(d3.extent(mappedVals))
    .range([0,0.9])

  // var sizeMapping = d3.scaleLinear().domain(d3.extent(selectedWordList.map(function(d){
  //   return d.value.count
  // }))).range([3,10])
var sizeMapping = d3.scaleLinear().domain([0,1,d3.max(selectedWordList.map(function(d){
    return d.value.count
  }))]).range([0,4,10])


  var ratioMapping = d3.scaleLinear().domain(d3.extent(selectedWordList.map(function(d){
    return d.value.ratio
  }))).range([3,10])

//there is a wired parameter

  keywordAttributesMapping = {}
  var selectedAllNodes = []
  for(var i=0;i<selectedWordList.length;i++){
      var weiboData = []
      for(var j=0;j<selectedWordList[i].allNodes.length;j++){
        if(showAll || (selectedWordList[i].allNodes[j].data.children && selectedWordList[i].allNodes[j].data.children.length)){
          weiboData.push(selectedWordList[i].allNodes[j])
          selectedAllNodes.push(selectedWordList[i].allNodes[j])
        }
      }

      var tSeq = mappingVal(selectedWordList[i].slotIndex)
      selectedWordList[i].color = d3.interpolateInferno(tSeq)
      keywordAttributesMapping[selectedWordList[i].key] = {color:selectedWordList[i].color,
        size:sizeMapping(selectedWordList[i].value.count),
        timeSequence:tSeq,
        count:selectedWordList[i].value.count,
        weiboDataAll:weiboData,
        filteredWeiboData:weiboData}

      selectedWordList[i].filteredNodes = weiboData
  }


  console.log("keyword",keywordAttributesMapping)

  var filteredAllNodes = matchNodesToWords(selectedWordList)
  //allNodes > selectedAllnodes > filteredAllNodes
  // return {word:selectedWordList,nodes:selectedAllNodes}
  return {word:selectedWordList,nodes:filteredAllNodes,sizeMapping:sizeMapping}

}

function matchNodesToWords(wordList){
  var nodeIndex = {}
  for(var i=0;i<wordList.length;i++){
    var nodes = wordList[i].filteredNodes;
    wordList[i].matchedNodes = []
    for(var j=0;j<nodes.length;j++){
      var id = nodes[j].data.mid;
      if(!nodeIndex[id]){
        nodeIndex[id] = {id:id,data:nodes[j],keywordsIndex:[],rpKeyword:null}
      }
      nodeIndex[id].keywordsIndex.push(i)
    }
  }

  var nodeFlag = {}

  for(var i in nodeIndex){
    var wordIndex = nodeIndex[i].keywordsIndex

    //wired operation
    var direction = 1
    if(fileIndex && fileIndex==15){
      direction=-1
    }

    wordIndex.sort(function(a,b){
      var count1 = keywordAttributesMapping[wordList[a].key].count
      var count2 = keywordAttributesMapping[wordList[b].key].count
      return direction*(count2-count1);
    })



    nodeIndex[i].data.featuredKeyword = wordList[wordIndex[0]].key
    // if(nodeFlag[wordIndex[0]]){
    //   continue
    // }
    wordList[wordIndex[0]].matchedNodes.push(nodeIndex[i].data)
    // nodeFlag[wordIndex[0]] = true;
  }
  var filteredAllNodes = []
  for(var i=0;i<wordList.length;i++){
    var key = wordList[i].key
    keywordAttributesMapping[key].weiboData = wordList[i].matchedNodes
    keywordAttributesMapping[key].filteredWeiboData = wordList[i].matchedNodes

    // keywordAttributesMapping[key].weiboData = keywordAttributesMapping[key].weiboDataAll

    for(var j=0;j<wordList[i].matchedNodes.length;j++){
      filteredAllNodes.push(wordList[i].matchedNodes[j])
    }
    // if(fileIndex && fileIndex==15){

    //   if(!wordList[i].matchedNodes.length){
    //     delete keywordAttributesMapping[wordList[i].key]
    //     wordList.splice(i,1)
    //     i--;
    //     //remove the non-existing words?
    //   }
    // }
  }
  console.log("filteredAllNodes",filteredAllNodes)

  ///put the attributes mapping here 
  return filteredAllNodes
}

function constructKeywordGraph(keywordList,textNodes,allNodes){

  var nodeIndex = {}
  var keywordIndex = {}

  var linkIndex = {}

  console.time("create graph")
  for(var i=0;i<textNodes.length;i++){
    nodeIndex[textNodes[i].data.mid] = textNodes[i]
  }
  for(var i=0;i<keywordList.length;i++){
    keywordIndex[keywordList[i].key] = keywordList[i]
  }

  for(var i=0;i<allNodes.length;i++){
    var word = allNodes[i].keywords
    if(!allNodes[i].data.children.length){
      continue;
    }
    var children = allNodes[i].children;

    var sourceKeywords = {}
    var sourceKeywordsList = [];
    for(var j=0;j<word.length;j++){
      if(keywordIndex[word[j]]){
        sourceKeywords[word[j]] = word[j]
      }
    }
    for(var j in sourceKeywords){
      sourceKeywordsList.push(sourceKeywords[j])
    }
    var targetKeywords = {}
    var targetKeywordsList = []
    for(var j=0;j<children.length;j++){
      var tKeywords = children[j].keywords;
      if(!tKeywords){
        console.log("err no keywords or time")
        continue
      }
      for(var k=0;k<tKeywords.length;k++){
        if(keywordIndex[tKeywords[k]]){
          targetKeywords[tKeywords[k]] = tKeywords[k]
        }
      }
    }
    for(var j in targetKeywords){
      targetKeywordsList.push(targetKeywords[j])
    }

    for(var j=0;j<sourceKeywordsList.length;j++){
      for(var k=0;k<targetKeywordsList.length;k++){
        var key = sourceKeywordsList[j] + "," + targetKeywordsList[k];
        if(!linkIndex[key]){
          linkIndex[key] = {source:sourceKeywordsList[j],target:targetKeywordsList[k],count:0}
        }
        linkIndex[key].count++
      }
    }

  }

  console.timeEnd("create graph")

  console.log("link",linkIndex)

  var links = []
  var linkThreshold = 5
  for(var i in linkIndex){
    if(linkIndex[i].count>linkThreshold){
      links.push(linkIndex[i])
    }
  }
  links.sort(function(a,b){
    return b.count - a.count;
  })

  var mapping = d3.scaleLinear().domain([0,d3.max(links.map(function(d){
    return d.count
  }))]).range([0,1])

  for(var i=0;i<links.length;i++){
    links[i].countRatio = mapping(links[i].count)
  }

  var nodes = []
  for(var i=0;i<keywordList.length;i++){
    nodes.push(keywordList[i])
  }

  var returnGraph = {nodes:nodes,links:links}
  // return {nodes:keywordList,links:links}

  var mergedGraph = mergeKeywordWeiboGraph(returnGraph,keywordList,textNodes,allNodes)

  // return returnGraph
  return mergedGraph

}

function mergeKeywordWeiboGraph(graph,keywordList,textNodes,allNodes){

  var nodeIndex = {}
  var keywordIndex = {}

  var linkIndex = {}


  console.time("create graph")
  for(var i=0;i<textNodes.length;i++){
    nodeIndex[textNodes[i].data.mid] = textNodes[i]
  }
  for(var i=0;i<keywordList.length;i++){
    keywordIndex[keywordList[i].key] = keywordList[i]
  }

  var newLinks = []

  for(var i=0;i<textNodes.length;i++){
    textNodes[i].key = textNodes[i].data.mid;

    var keywords = textNodes[i].words;
    textNodes[i].type = "weibo"
    var nodeNum = textNodes[i].nodeNum
    textNodes[i].value = {count:nodeNum}


    var keywordFlag = false;
    for(var j=0;j<keywords.length;j++){
      var word = keywords[j][0];
      if(keywordIndex[word]){
        newLinks.push({source:word,target:textNodes[i].key,count:nodeNum*keywords[j][1],type:"weibo"})
        keywordFlag = true
        break;
        //here the break indicates we only use one keyword slot 
      }
    }
    if(keywordFlag){
      graph.nodes.push(textNodes[i])
    }

  }

  var mapping = d3.scaleLinear().domain([0,d3.max(newLinks.map(function(d){
    return d.count
  }))]).range([0,1])

  for(var i=0;i<newLinks.length;i++){
    newLinks[i].countRatio = mapping(newLinks[i].count)
    graph.links.push(newLinks[i])
  }

  return graph

}















