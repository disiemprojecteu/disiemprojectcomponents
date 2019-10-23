# UBAP-1: Topic Modelling-based User Behaviour Analysis Tool

The first sub-component – the topic modelling-based user behaviour analysis tool (UBAP-1) – is motivated by the first task above and responsible for visualizing the entirety of users’ behaviours and allowing to explore similarities between all the individual user’s sessions and to identify different behavioural patterns 

Running tutorial for LDA-Visualization:

1) Calculate the LDA ensembles: 
	python lda_calculate.py
	
2) Put the output files of step 2 (lda_doc_topic_final.csv and lda_topic_word_final.csv) to lda_va/data, and run a python server in that folder:
    python -m http.server
	
3) Interactively explore the LDA results, and generate the cateogry.json as output category
