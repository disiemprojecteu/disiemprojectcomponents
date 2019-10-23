// importScripts("../lib/tsne.js")

var opt = {epsilon: 10};
var tSNE = new tsnejs.tSNE(opt);
var _distanceMatrix;

var iterTimer;
var dView;

postMessage = function(data,finishFlag){
    // console.log("postResults",data);
    dView.updateData(data,finishFlag);
}
onmessage = function(event) {
    var distanceMatrix = event.data.distance;
    console.log("cmd", event.data.cmd);
    dView = event.obj;
    clearInterval(iterTimer);
    if (event.data.cmd == "init") {
        tSNE.setDataDist(distanceMatrix, true);
        start(distanceMatrix, 200);
    } else if (event.data.cmd == "update") {
        tSNE.setDataDist(distanceMatrix, false);
        start(distanceMatrix, 200);
    }
    
};

function start(distanceMatrix, iter) {
    var count = 0;
    var flag = false;
    iterTimer = setInterval(function() {
        count++;
        if (count > iter) {
            flag = true;
            clearInterval(iterTimer);
        }
        tSNE.step();
        postMessage(tSNE.getSolution(),flag);        
    }, 10)
    // for (var i = 0; i < iter; i++) {
    //  if (workTimestamp != messageTimestamp) {
    //      console.log("break");
    //      break;
    //  }
    //  tSNE.step();
    //  postMessage(tSNE.getSolution());    
    // }
    // postMessage(tSNE.getSolution());
}