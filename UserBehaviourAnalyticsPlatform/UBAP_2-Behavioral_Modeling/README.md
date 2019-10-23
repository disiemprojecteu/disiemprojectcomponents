# UBAP-2: Cluster-based User Modelling Component

The cluster-based user modelling component (UBAP-2) builds a model for approximating the behaviour of an average user in one specific cluster. This is performed for each of the clusters identified by the topic modelling tool. 

The following is the short description of each of the scripts:

1. find_model.py - describes the process of finding the best LSTM model configuration for modeling the data

2. model_clusters.py - main training script that serves for building a model for each of the clusters, also one class SVM for cluster identification and one generic model trained on the data from all the clusters

3. evaluation.py - allows to build a plot comparing the performance of different models on each of the clusters testing sets

4. application.py - applies saved models for producing scores of the sessions, both normal and attacks and builds the ROC curve

Data folder includes json files with training data and attacks data, also the file describing the clusters separation produced by UBAP-1.
Models folder will contain all the models created after running model_clusters.py script.