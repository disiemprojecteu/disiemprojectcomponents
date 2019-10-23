from __future__ import print_function

from keras.models import load_model

import numpy as np
import json
from tqdm import *
tqdm.monitor_interval = 0
import matplotlib.pyplot as plt
import joblib

import os
from utils import *
os.environ['CUDA_VISIBLE_DEVICES'] = "0,1,2,3"

DATA_FILE = "data/all_text_sessions.json"
CLUSTERS_FILE = "data/lda_assemblies.json"


def draw_from_results(clusters_list, test_losses, title):
    colors = plt.cm.viridis(np.linspace(0.15, 0.85, len(clusters_list) + 2))
    display_data = [[], []]
    for c in clusters_list:
        display_data.append([])
    for c in clusters_list:
        display_data[0].append(test_losses[c]['generic'])
        display_data[1].append(test_losses[c]['random'])
        i = 2
        for in_c in clusters_list:
            display_data[i].append(test_losses[c][in_c])
            i += 1
    ax = plt.subplot(111)
    x = np.arange(0, len(clusters_list)*3, 3)
    ax.bar(x - 0.6, display_data[0], width=0.2, color=colors[0], align='center', label='Generic model')
    ax.bar(x - 0.4, display_data[1], width=0.2, color=colors[1], align='center', label='Random model')
    cl_ind = 2
    step = 0
    for cluster in clusters_list:
        ax.bar(x - 0.2 + 0.2 * step, display_data[cl_ind], width=0.2,
               color=colors[cl_ind], align='center', label='Model ' + cluster)
        cl_ind += 1
        step += 1
    plt.xticks(x, clusters_list)
    plt.legend()
    plt.title(title)
    plt.show()

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

    train_ratio = 0.7
    all_lstm_test_data = []
    cluster_models = {}
    cluster_ocsvms = {}
    cluster_random_models = {}
    cluster_test_sets = {}
    print("===== Load models")
    for cluster in clusters:
        print(cluster)
        cluster_model = load_model('models/cluster_' + str(cluster) + '_model.h5')
        cluster_models[cluster] = cluster_model
        cluster_ocsvm = joblib.load('models/cluster_' + str(cluster) + '_ocsvm.joblib')
        cluster_ocsvms[cluster] = cluster_ocsvm
        cluster_random_model = load_model('models/random_subset_cluster_' + str(cluster) + '_model.h5')
        cluster_random_models[cluster] = cluster_random_model

        train_amount = int(len(clusters[cluster]) * train_ratio)
        test_session_ids = clusters[cluster][train_amount:]
        lstm_test_set = []
        for ses_id in test_session_ids:
            lstm_test_set += lstm_transform(sessions[ses_id])
        cluster_test_sets[cluster] = lstm_test_set

    generic_model = load_model('models/generic_model.h5')

    print("===== Compare models")
    test_losses = {}
    test_accuracies = {}
    for cluster in clusters:
        print(cluster)
        test_losses[cluster] = {}
        test_accuracies[cluster] = {}
        x_test, y_test = create_labels(cluster_test_sets[cluster])
        for cl in clusters:
            test_loss, test_accuracy = cluster_models[cl].evaluate(x_test, y_test, verbose=0)
            test_losses[cluster][cl] = test_loss
            test_accuracies[cluster][cl] = test_accuracy
        genric_test_loss, genric_test_accuracy = generic_model.evaluate(x_test, y_test, verbose=0)
        test_losses[cluster]['generic'] = genric_test_loss
        test_accuracies[cluster]['generic'] = genric_test_accuracy
        random_test_loss, random_test_accuracy = cluster_random_models[cluster].evaluate(x_test, y_test, verbose=0)
        test_losses[cluster]['random'] = random_test_loss
        test_accuracies[cluster]['random'] = random_test_accuracy

    # in case we do not want to recalculate it again
    #joblib.dump(test_losses, "evaluation_test_losses.joblib")
    #joblib.dump(test_accuracies, "evaluation_test_accuracies.joblib")
    #test_losses = joblib.load("evaluation_test_losses.joblib")
    #test_accuracies = joblib.load("evaluation_test_accuracies.joblib")

    clusters_list = list(clusters.keys())
    draw_from_results(clusters_list, test_losses, "Test losses")
    draw_from_results(clusters_list, test_accuracies, "Test accuracies")
