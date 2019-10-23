import codecs
import numpy as np

PAD_LENGTH = 100
MIN_LENGTH = 3
WINDOW_SIZE = 20
ACTIONS_FILE = "data/sc.txt"
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


def encoding_transform(sequence):
    vector_seq = []
    for action in sequence:
        if action is not None:
            vector_seq.append(ACTION_ENCODINGS[action])
        else:
            vector_seq.append(np.zeros((len(ACTIONS))))
    return vector_seq


def lstm_transform(session):
    # cut with window
    cut_sessions = []
    for i in range(MIN_LENGTH, len(session), WINDOW_SIZE):
        cut_sessions.append(session[:i + 1])
    # make of equal length
    sequences = []
    for s in cut_sessions:
        if len(s) > PAD_LENGTH:
            sequences.append(s[len(s) - PAD_LENGTH:])
        elif len(s) >= MIN_LENGTH:
            pad_seq = [None] * (PAD_LENGTH - len(s))
            pad_seq.extend(s)
            sequences.append(pad_seq)
    # transform into encoding
    session_data = []
    for s in sequences:
        session_data.append(encoding_transform(s))
    return session_data


def create_labels(sequences):
    x, y = [], []
    for seq in sequences:
        x.append(seq[:-1])
        y.append(seq[-1])
    return np.array(x), np.array(y)


def oc_svm_transform(session):
    if len(session) > PAD_LENGTH:
        session = session[:PAD_LENGTH]
    elif len(session) >= MIN_LENGTH:
        pad_seq = [None] * (PAD_LENGTH - len(session))
        session.extend(pad_seq)

    return np.array(encoding_transform(session)).flatten()
