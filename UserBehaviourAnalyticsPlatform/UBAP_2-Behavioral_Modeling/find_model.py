from __future__ import print_function

from keras.models import Sequential
from keras.layers import Dense, Activation, Dropout
from keras.layers import LSTM
from keras.optimizers import Adam

from hyperopt import Trials, STATUS_OK, tpe
from hyperas import optim
from hyperas.distributions import choice, uniform, conditional

import numpy as np
import codecs
import json

import os
os.environ['CUDA_VISIBLE_DEVICES'] = "0,1,2,3"

def generic_data():
    # all external definitions should be inside - requirements of hyperas library
    train_percent = 0.7
    val_percent = 0.15
    PAD_LENGTH = 100
    MIN_LENGTH = 3
    WINDOW_SIZE = 20
    DATA_FILE = "all_text_sessions.json"
    ACTIONS_FILE = "sc.txt"
    # read action names
    ACTIONS = []
    for l in codecs.open(ACTIONS_FILE, "r").readlines():
        ACTIONS.append(l.split("\t")[1].replace("\n", "").replace("\r", ""))
    # create dictionaries with actions and their indexing for further transformation to
    # one-hot-encoding and back
    ACTION_INDICES = dict((c, i) for i, c in enumerate(ACTIONS))

    def make_labeled_categorical_data(sequences):
        input_seqs = []
        next_acts = []
        for seq in sequences:
            if len(seq) > PAD_LENGTH:
                input_seqs.append(seq[len(seq) - PAD_LENGTH:-1])
                next_acts.append(seq[-1])
            if len(seq) <= PAD_LENGTH and len(seq) > MIN_LENGTH:
                pad_len = PAD_LENGTH - len(seq)
                pad_seq = [None] * pad_len
                pad_seq.extend(seq[:-1])
                input_seqs.append(pad_seq)
                next_acts.append(seq[-1])

        # transform sequences and labels to one-hot-encoding vectors
        x = []
        y = []
        for i, inp in enumerate(input_seqs):
            vector_seq = np.zeros((len(inp), len(ACTIONS)))
            for t, action in enumerate(inp):
                if action is not None:
                    vector_seq[t, ACTION_INDICES[action]] = 1
            x.append(vector_seq)
            vector_label = np.zeros((len(ACTIONS)))
            vector_label[ACTION_INDICES[next_acts[i]]] = 1
            y.append(vector_label)

        return np.asarray(x), np.asarray(y)

    # read sessions data
    jsonObj = json.load(open(DATA_FILE, "r"))
    seqs = []
    for s in jsonObj:
        seqs.append(s['actions'])

    # cut the sessions with window, to obtain training data
    sequences = []
    for seq in seqs:
        for i in range(MIN_LENGTH, len(seq), WINDOW_SIZE):
            sequence = seq[:i + 1]
            sequences.append(sequence)

    x, y = make_labeled_categorical_data(sequences)

    # separate into training, val and testing parts
    train_size = int(round(len(x) * train_percent))
    val_size = int(round(len(x) * (train_percent + val_percent)))
    x_train = x[:train_size]
    y_train = y[:train_size]
    x_val = x[train_size:val_size]
    y_val = y[train_size:val_size]
    x_test = x[val_size:]
    y_test = y[val_size:]

    return x_train, y_train, x_val, y_val, x_test, y_test

def create_model(x_train, y_train, x_val, y_val, x_test, y_test):
    ACTIONS_FILE = "sc.txt"
    # read action names
    ACTIONS = []
    for l in codecs.open(ACTIONS_FILE, "r").readlines():
        ACTIONS.append(l.split("\t")[1].replace("\n", "").replace("\r", ""))

    model = Sequential()
    # have several parameters to choose with meta-parametrization optimization
    model.add(LSTM({{choice([128, 256, 512])}}, input_shape=(None, len(ACTIONS))))
    model.add(Dropout({{uniform(0, 1)}}))
    model.add(Dense(len(ACTIONS)))
    model.add(Activation('softmax'))
    optimizer = Adam(lr={{uniform(0.001, 0.01)}})

    model.compile(loss='categorical_crossentropy', metrics=['accuracy'], optimizer=optimizer)

    result = model.fit(x_train, y_train,
                       batch_size={{choice([16, 32, 64])}},
                       epochs=10,
                       verbose=2,
                       shuffle=True,
                       validation_data=(x_val, y_val))
    # get the highest validation accuracy of the training epochs
    validation_acc = np.amax(result.history['val_acc'])
    print('Best validation acc of epoch:', validation_acc)
    return {'loss': -validation_acc, 'status': STATUS_OK, 'model': model}


if __name__ == "__main__":
    best_run, best_model = optim.minimize(model=create_model, data=generic_data, algo=tpe.suggest,
                                          max_evals=5, trials=Trials())

    print("Best performing model chosen hyper-parameters:")
    print(best_run)
    print(best_model.summary())
