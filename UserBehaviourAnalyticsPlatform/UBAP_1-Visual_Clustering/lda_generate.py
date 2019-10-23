import numpy as np
import lda
import json
import csv

#with open('lss-asm-live-jsessions-anonymous.json','r') as f:
with open("asm-data.json","r") as f:
    data = json.load(f)
    
    newData = []
    for i in range(0,len(data)):
        if 'actionsQueue' not in data[i]:
            continue;
        actionsQueue = data[i]['actionsQueue']
        if len(actionsQueue)==0:
            continue
        newData.append(data[i])
    print(len(newData))                

    data = newData
    
    actionList = {}
    for i in range(0,len(data)):
        actionsQueue = data[i]['actionsQueue']
        for j in range(0,len(actionsQueue)):
            action = actionsQueue[j]
            if action not in actionList:
                actionList[action] = 0
            actionList[action] = actionList[action] + 1
            
    
    actionArray = []
    actionIndex = {}
    count = 0 
    
    for i in actionList:
        actionIndex[i] = count
        count+=1
        actionArray.append(i)    
        
    actions = np.array(actionArray) 
    
    
    
    wordDoc = np.zeros((len(data),len(actions),),dtype=np.int)
    for i in range(0,len(data)):
        actionsQueue = data[i]['actionsQueue']
    #     print(actionsQueue)
        for j in range(0,len(actionsQueue)):
            action = actionsQueue[j]
            wordIndex = actionIndex[action]
            wordDoc[i][wordIndex] = wordDoc[i][wordIndex]+1
    

maxNum = 11

topicWords = []
docTopics = []
for i in range(2,maxNum):
    model = lda.LDA(n_topics=i,n_iter=1500,random_state=1)
    model.fit(wordDoc)
    topicWord = topic_word = model.topic_word_
    topicWords.append(topicWord)
    docTopic = model.doc_topic_
    docTopics.append(docTopic)
    print("round",i)

actionList = actions.tolist()
arrayList = topicWords
len(arrayList)

docTopicHeads = []
for i in range(2,maxNum):
    for j in range(0,i):
        st = "LDA"+str(i)+"Topic"+str(j)
        docTopicHeads.append(st)

with open("lda_topic_word_final.csv","w") as fp:
    writer = csv.writer(fp, delimiter=',',quotechar='|',quoting=csv.QUOTE_MINIMAL)
    actionList.append("LDA")
    writer.writerow(actionList)
    for i in range(0,len(arrayList)):
        temp = np.array([[i+2]]*len(arrayList[i]))
        mergedList = np.append(arrayList[i],temp,axis=1)
        writer.writerows(mergedList)

with open("lda_doc_topic_final.csv","w") as fp:
    writer = csv.writer(fp, delimiter=',',quotechar='|',quoting=csv.QUOTE_MINIMAL)
    writer.writerow(docTopicHeads)
    mergedList = docTopics[0]
    for i in range(1,len(docTopics)):
        mergedList = np.append(mergedList,docTopics[i],axis=1)
    writer.writerows(mergedList)
