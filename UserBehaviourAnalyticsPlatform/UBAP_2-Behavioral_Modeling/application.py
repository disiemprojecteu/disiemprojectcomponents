from __future__ import print_function

from keras.models import load_model

import numpy as np
import json
from tqdm import *
tqdm.monitor_interval = 0
import matplotlib.pyplot as plt
import joblib
import math
from sklearn.metrics import roc_curve, auc, precision_recall_fscore_support

import os
from utils import *
os.environ['CUDA_VISIBLE_DEVICES'] = "0,1,2,3"

DATA_FILE = "data/all_text_sessions.json"
CLUSTERS_FILE = "data/lda_assemblies.json"
ATTACKS_FILE = "data/attack_text_sessions.json"
PAD_LENGTH = 100
MIN_LENGTH = 3
WINDOW_SIZE = 20


def perplexity(probabilities):
    product = 1
    count = 0
    for p in probabilities:
        if math.isinf(product * (1.0 / p)):
            product = 1e+300
        else:
            product *= (1.0 / p)
        count += 1
    return product ** (1.0 / count)


if __name__ == "__main__":
    # reading in all the sessions from data file
    jsonObj = json.load(open(DATA_FILE, "r"))
    sessions = {}
    for s in jsonObj:
        sessions[s['id']] = s['actions']

    # reading in the clusters separation
    with open(CLUSTERS_FILE, "r") as f:
        data = json.load(f)
        cluster_names = list(data.keys())
        clusters = {}
        for cl_name in cluster_names:
            clusters[cl_name] = data[cl_name]['sessionPFXs']

    clusters_list = list(clusters.keys())

    train_ratio = 0.7
    all_lstm_test_data = []
    cluster_models = {}
    cluster_ocsvms = {}
    cluster_random_models = {}
    test_sessions = []
    print("===== Load models")
    for cluster in clusters:
        print(cluster)
        cluster_model = load_model('models/cluster_' + str(cluster) + '_model.h5')
        cluster_models[cluster] = cluster_model
        cluster_ocsvm = joblib.load('models/cluster_' + str(cluster) + '_ocsvm.joblib')
        cluster_ocsvms[cluster] = cluster_ocsvm

        train_amount = int(len(clusters[cluster]) * train_ratio)
        for ses_id in clusters[cluster][train_amount:]:
            test_sessions.append(sessions[ses_id])

    generic_model = load_model('models/generic_model.h5')

    jsonObj = json.load(open(ATTACKS_FILE, "r"))
    attack_sessions = []
    for s in jsonObj:
        attack_sessions.append(s['actions'])

    # collect labels for sessions - 0 is normal, 1 is attack
    labels = []
    generic_model_scores = []
    cluster_model_scores = []
    for i in tqdm(range((len(test_sessions + attack_sessions)))):
        session = (test_sessions + attack_sessions)[i]
        if i < len(test_sessions):
            labels.append(0)
        else:
            labels.append(1)
        generic_model_probabilities = MIN_LENGTH * [0]
        cluster_model_probabilities = MIN_LENGTH * [0]
        for j in range(MIN_LENGTH, len(session), WINDOW_SIZE):
            current_piece = session[:j]

            lstm_sequence = encoding_transform(current_piece)
            oc_svm_sequence = oc_svm_transform(current_piece)

            generic_model_pred = generic_model.predict(np.array([lstm_sequence[:-1]]))[0]
            # we are interested only in probability assigned to the action that was next in reality
            generic_model_probabilities.append(generic_model_pred[np.array(lstm_sequence[-1]).argmax()])

            # identify the OC-SVM that gives the largest score to get the related cluster
            max_score = -100
            max_cluster = clusters_list[0]
            for cl in clusters_list:
                cl_score = cluster_ocsvms[cl].decision_function(oc_svm_sequence.reshape(1, -1))[0][0]
                if cl_score > max_score:
                    max_score = cl_score
                    max_cluster = cl

            cluster_model_pred = cluster_models[max_cluster].predict(np.array([lstm_sequence[:-1]]))[0]
            cluster_model_probabilities.append(cluster_model_pred[np.array(lstm_sequence[-1]).argmax()])

        # perplexity of probabilities array is the score
        generic_model_scores.append(perplexity(generic_model_probabilities[MIN_LENGTH:]))
        cluster_model_scores.append(perplexity(generic_model_probabilities[MIN_LENGTH:]))

    # in case we do not want to recalculate it again
    #joblib.dump(generic_model_scores, "generic_model_scores.joblib")
    #joblib.dump(cluster_model_scores, "cluster_model_scores.joblib")
    #generic_model_scores = joblib.load("generic_model_scores.joblib")
    #cluster_model_scores = joblib.load("cluster_model_scores.joblib")

    fprs = []
    tprs = []
    roc_aucs = []

    for scores in [generic_model_scores, cluster_model_scores]:
        fpr, tpr, thresholds = roc_curve(labels, scores)
        fprs.append(fpr)
        tprs.append(tpr)
        roc_auc = auc(fpr, tpr)
        roc_aucs.append(roc_auc)

    colors = plt.cm.viridis(np.linspace(0.15, 0.85, 2))
    plt.figure()
    plt.plot(fprs[0], tprs[0], lw=2, c=colors[0], label='Generic model (area = %0.4f)' % roc_aucs[0])
    plt.plot(fprs[1], tprs[1], lw=2, c=colors[1], linestyle='-.', label='Cluster model (area = %0.4f)' % roc_aucs[1])
    plt.plot([0, 1], [0, 1], color='black', alpha=0.3, linestyle='-')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.0])
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.legend()
    plt.show()
