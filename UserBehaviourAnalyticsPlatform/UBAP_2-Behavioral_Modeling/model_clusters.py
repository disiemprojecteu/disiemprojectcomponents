from __future__ import print_function

import keras.backend as K
from keras.models import Sequential
from keras.layers import Dense, Activation, Dropout
from keras.callbacks import EarlyStopping
from keras.layers import LSTM
from keras.optimizers import Adam

import os
import codecs
import numpy as np
import json
from sklearn.svm import OneClassSVM
from joblib import dump
from utils import *
from tqdm import *
tqdm.monitor_interval = 0

os.environ['CUDA_VISIBLE_DEVICES'] = "0,1,2,3"

np.random.seed(42)
K.tf.set_random_seed(42)

PAD_LENGTH = 100
MIN_LENGTH = 3
WINDOW_SIZE = 20
DATA_FILE = "data/all_text_sessions.json"
ACTIONS_FILE = "data/sc.txt"
CLUSTERS_FILE = "data/lda_assemblies.json"
# best model after running find_model.py
LSTM_CELLS = 256
DROPOUT = 0.4
LR = 0.001
BS = 32
EPOCHS_NUM = 1
NU = 0.01
GAMMA = 0.001

ACTIONS = []
for l in codecs.open(ACTIONS_FILE, "r").readlines():
    ACTIONS.append(l.split("\t")[1].replace("\n", "").replace("\r", ""))
# create dictionaries with actions and their indexing for further transformation to
# one-hot-encoding and back
print('Actions number:', len(ACTIONS))
action_indices = dict((c, i) for i, c in enumerate(ACTIONS))
ACTION_ENCODINGS = {}
for a in action_indices:
    vector = np.zeros((len(ACTIONS)))
    vector[action_indices[a]] = 1
    ACTION_ENCODINGS[a] = vector


def lstm_model():
    model = Sequential()
    model.add(LSTM(LSTM_CELLS, input_shape=(None, len(ACTIONS))))
    model.add(Dropout(DROPOUT))
    model.add(Dense(len(ACTIONS)))
    model.add(Activation('softmax'))
    optimizer = Adam(lr=LR)
    model.compile(loss='categorical_crossentropy', metrics=['accuracy'], optimizer=optimizer)
    return model


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
    all_lstm_train_data = []
    all_lstm_test_data = []
    # might be different from overall session_ids, so collect separately
    all_cluster_session_ids = []
    print("===== Cluster models")
    for cluster in clusters:
        print(cluster)
        all_cluster_session_ids += clusters[cluster]

        train_amount = int(len(clusters[cluster])*train_ratio)
        train_session_ids = clusters[cluster][:train_amount]
        lstm_train_set = []
        for ses_id in train_session_ids:
            lstm_train_set += lstm_transform(sessions[ses_id])
        x, y = create_labels(lstm_train_set)

        cluster_model = lstm_model()
        stopping = EarlyStopping(monitor='val_loss', min_delta=0.001, patience=5, verbose=1, mode='auto')
        history = cluster_model.fit(x=x, y=y, batch_size=BS, epochs=EPOCHS_NUM, verbose=1, callbacks=[stopping],
                                    validation_split=0.2, shuffle=True)
        # assemble data for generic model
        all_lstm_train_data += lstm_train_set

        test_session_ids = clusters[cluster][train_amount:]
        lstm_test_set = []
        for ses_id in test_session_ids:
            lstm_test_set += lstm_transform(sessions[ses_id])
        x_test, y_test = create_labels(lstm_test_set)
        print("Cluster model test accuracy:", cluster_model.evaluate(x_test, y_test, verbose=1))
        cluster_model.save('models/cluster_' + str(cluster) + '_model.h5')
        # assemble data for generic model
        all_lstm_test_data += lstm_test_set

        oc_svm_train_set = []
        for ses_id in train_session_ids:
            oc_svm_train_set.append(oc_svm_transform(sessions[ses_id]))
        cluster_svm = OneClassSVM(nu=NU, kernel='rbf', gamma=GAMMA)
        cluster_svm.fit(oc_svm_train_set)

        oc_svm_test_set = []
        for ses_id in test_session_ids:
            oc_svm_test_set.append(oc_svm_transform(sessions[ses_id]))
        preds = cluster_svm.predict(oc_svm_test_set)
        print("Accuracy of cluster identification with SVM: ",
              "{:.2%}".format(len(np.where(preds == 1)[0]) * 1.0 / len(preds)))
        dump(cluster_svm, 'models/cluster_' + str(cluster) + '_ocsvm.joblib')

    print("===== Generic model")
    x, y = create_labels(all_lstm_train_data)
    generic_model = lstm_model()
    stopping = EarlyStopping(monitor='val_loss', min_delta=0.001, patience=5, verbose=1, mode='auto')
    history = generic_model.fit(x=x, y=y, batch_size=BS, epochs=EPOCHS_NUM, verbose=1, callbacks=[stopping],
                                validation_split=0.2, shuffle=True)

    x_test, y_test = create_labels(all_lstm_test_data)
    print("Generic model test accuracy:", generic_model.evaluate(x_test, y_test, verbose=1))
    generic_model.save('models/generic_model.h5')

    print("===== Random subset models")
    all_cluster_session_ids = np.array(all_cluster_session_ids)
    for cluster in clusters:
        print(cluster)
        train_amount = int(len(clusters[cluster])*train_ratio)
        idx = np.random.randint(len(all_cluster_session_ids), size=train_amount)
        train_session_ids = all_cluster_session_ids[idx]
        lstm_train_set = []
        for ses_id in train_session_ids:
            lstm_train_set += lstm_transform(sessions[ses_id])
        x, y = create_labels(lstm_train_set)

        random_cluster_model = lstm_model()
        stopping = EarlyStopping(monitor='val_loss', min_delta=0.001, patience=5, verbose=1, mode='auto')
        history = random_cluster_model.fit(x=x, y=y, batch_size=BS, epochs=EPOCHS_NUM, verbose=1,
                                           callbacks=[stopping], validation_split=0.2, shuffle=True)

        test_session_ids = clusters[cluster][train_amount:]
        lstm_test_set = []
        for ses_id in test_session_ids:
            lstm_test_set += lstm_transform(sessions[ses_id])
        x_test, y_test = create_labels(lstm_test_set)
        print("Random subset model test accuracy:", random_cluster_model.evaluate(x_test, y_test, verbose=1))
        random_cluster_model.save('models/random_subset_cluster_' + str(cluster) + '_model.h5')
