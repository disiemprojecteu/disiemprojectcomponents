var K_TfIDF = (function(){
    CS = {}

    var gDocuments = [];
    var gWordCountMap = {};
    var gWordDocCountMap = {};
    var minWordFrequency = 0;
    var gDocNum = 0;

    CS.tfidf = function(data){
        // var maxDataSize = 5000;

        //load data
        // var gDocuments = [];
        // var gWordCountMap = {};
        // var gWordDocCountMap = {};
        // var minWordFrequency = 0;
        // var gDocNum = 0;

        // for (var i = 0; i < Math.min(maxDataSize, data.length); i++) {
        for (var i = 0; i <  data.length; i++) {
            gDocNum++;
            var d = data[i];
            var doc = {};
            doc.id = i;
            doc.text = d.content;
            doc.segments = d.segments;
            gDocuments.push(doc);
        }
        // console.log(gDocuments);
        getDF();
        getTFIDF(true);
        var disMatrix = getDistance();
        // console.log(disMatrix); 
        return disMatrix;       
    }

    CS.test = function(dataFile){
        // var dataFile = "data.json";
        var maxDataSize = 100;

        //load data

        $.getJSON(dataFile, function(data) {
            for (var i = 0; i < Math.min(maxDataSize, data.length); i++) {
                gDocNum++;
                var d = data[i];
                var doc = {};
                doc.id = i;
                doc.text = d.content;
                doc.segments = d.segments;
                gDocuments.push(doc);
            }
            console.log(gDocuments);
            getDF();
            getTFIDF();
            var disMatrix = getDistance();
            console.log(disMatrix);
        })
    }

    function getDF() {
        // 计算数据集中的词频（词频过滤）
        for (var i = 0; i < gDocuments.length; i++) {
            var doc = gDocuments[i];
            var segmentText = doc.segments;
            var segments = segmentText.split(" ");
            var wordCountMap = doc.wordCountMap = {};
            for (var j = 0; j < segments.length; j++) {
                var word = segments[j];
                if (word.length == 0)
                    continue;
                wordCountMap[word] = wordCountMap[word] == undefined ? 1 : wordCountMap[word] + 1;
                gWordCountMap[word] = gWordCountMap[word] == undefined ? 1 : gWordCountMap[word] + 1;
            }
        }    
   

        // 词频过滤，剔除低频词
        for (var word in gWordCountMap) {
            if (gWordCountMap[word] <= minWordFrequency)
                delete gWordCountMap[word];
        }

        for (var i = 0; i < gDocuments.length; i++) {
            var wordCountMap = gDocuments[i].wordCountMap;
            for (var word in wordCountMap) {
                if (gWordCountMap[word] == null) {
                    delete wordCountMap[word];
                }
                else {
                    // 计算DF.
                    gWordDocCountMap[word] = gWordDocCountMap[word] == null ? 1 : gWordDocCountMap[word] + 1;
                }
            }

            var wordCount = Object.keys(wordCountMap).length;
            // warn: 处理异常值
            if (wordCount == 0)
                wordCount++;
            gDocuments[i].wordCount = wordCount;            
        }
    }

    function getTFIDF(noIDF) {
        var keywordVector = Object.keys(gWordCountMap);
        // 计算单个文档的tfidf向量
        for (var i = 0; i < gDocuments.length; i++) {
            var doc = gDocuments[i];
            var wordCountMap = doc.wordCountMap;
            var vector = doc.tfidfVector = [];
            var tfidfSquareSum = 0;
            for (var j = 0; j < keywordVector.length; j++) {
                var word = keywordVector[j];
                var count = wordCountMap[word] == null ? 0 : wordCountMap[word];
                var tf = count / doc.wordCount;
                var idf = Math.log(gDocNum/(gWordDocCountMap[word]+1));
                var tfidf;
                if(noIDF){
                    tfidf = tf;
                }else{
                    tfidf = tf * idf;
                }
                vector.push(tfidf);
                tfidfSquareSum += tfidf * tfidf;
            }
            doc.tfidfSquareSum = tfidfSquareSum;
            // if (tfidfSquareSum == 0)
            //     doc.tfidfSquareSum = tfidfSquareSum + 0.0001;
        }        
    }

    function getDistance() {
        var disMatrix = [];
        for (var i = 0; i < gDocuments.length; i++) {
            disMatrix[i] = [];
            disMatrix[i][i] = 0;
        }   

        // TFIDF距离
        for (var i = 0; i < gDocuments.length; i++) {
            for (var j = i + 1; j < gDocuments.length; j++) {
                var d = getDocumentCosDistance(gDocuments[i], gDocuments[j]);
                disMatrix[i][j] = disMatrix[j][i] = d;
                // if (! (d > 0 && d <= 1)) {
                //     console.log("error: distance of ", i, j, "are equals " + d);
                // }
            }
        }
        return disMatrix;
    }


    function getDocumentCosDistance(doc1, doc2) {
        var vector1 = doc1["tfidfVector"];
        var vector2 = doc2["tfidfVector"];
        var tfidfSquareSum1 = doc1["tfidfSquareSum"];
        var tfidfSquareSum2 = doc2["tfidfSquareSum"];
        var productSum = 0;
        for (var i = 0; i < vector1.length; i++) {
            productSum += vector1[i] * vector2[i];
        }
        var similarity = productSum / Math.sqrt(tfidfSquareSum1 * tfidfSquareSum2);
        // if(Math.sqrt(tfidfSquareSum1 * tfidfSquareSum2)==0){
        //     console.log("no meaning")
        //     similarity = 0;
        // }
        if(tfidfSquareSum1==0 && tfidfSquareSum2==0){
            // console.log("no meaning1")
            similarity = 1;
        }else if(Math.sqrt(tfidfSquareSum1 * tfidfSquareSum2)==0){
            // console.log("no meaning")
            similarity = 0;
        }            

        return 1 - Math.sqrt(Math.sqrt(similarity));
    }

    return CS;

})()


