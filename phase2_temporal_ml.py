import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix

# =========================
# LOAD DATA
# =========================
df = pd.read_csv("master_dataset.csv")

print("\n===== DATASET LOADED =====")
print(df.shape)

# =========================
# LABEL ENCODING
# =========================
label_encoder = LabelEncoder()
df["label_encoded"] = label_encoder.fit_transform(df["label"])

label_map = dict(zip(label_encoder.classes_,
                     label_encoder.transform(label_encoder.classes_)))
print("\nLabel Mapping:", label_map)

# =========================
# TEMPORAL FEATURE ENGINEERING
# =========================
WINDOW = 5

temporal_features = [
    "cpu_percent",
    "memory_percent",
    "disk_percent",
    "total_allocated",
    "total_need",
    "deadlock_risk"
]

for col in temporal_features:
    df[f"{col}_mean"] = df[col].rolling(WINDOW).mean()
    df[f"{col}_std"] = df[col].rolling(WINDOW).std()

df.dropna(inplace=True)

print("\n===== AFTER TEMPORAL FEATURES =====")
print(df.shape)

# =========================
# FEATURE MATRIX & TARGET
# =========================
feature_cols = [
    "num_processes",
    "cpu_percent",
    "memory_percent",
    "disk_percent",
    "total_allocated",
    "total_need",
    "deadlock_risk"
]

feature_cols += [f"{c}_mean" for c in temporal_features]
feature_cols += [f"{c}_std" for c in temporal_features]

X = df[feature_cols]
y = df["label_encoded"]

# =========================
# TRAIN–TEST SPLIT
# =========================
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.25,
    random_state=42,
    stratify=y
)

print("\n===== SPLIT INFO =====")
print("Train size:", X_train.shape)
print("Test size :", X_test.shape)

# =========================
# MODEL TRAINING
# =========================
model = RandomForestClassifier(
    n_estimators=300,
    max_depth=14,
    min_samples_split=5,
    class_weight="balanced",   # IMPORTANT for rare DEADLOCK
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)

print("\n✅ MODEL TRAINED")

# =========================
# EVALUATION (SAFE FOR RARE CLASSES)
# =========================
y_pred = model.predict(X_test)

present_labels = sorted(np.unique(y_test))
present_names = label_encoder.inverse_transform(present_labels)

print("\n===== CLASSIFICATION REPORT =====")
print(
    classification_report(
        y_test,
        y_pred,
        labels=present_labels,
        target_names=present_names,
        zero_division=0
    )
)

print("\n===== CONFUSION MATRIX =====")
print(confusion_matrix(y_test, y_pred, labels=present_labels))

# =========================
# FEATURE IMPORTANCE (COMPLEXITY BOOST)
# =========================
importances = pd.Series(
    model.feature_importances_,
    index=feature_cols
).sort_values(ascending=False)

print("\n===== TOP IMPORTANT FEATURES =====")
print(importances.head(12))

print("\n🎯 Phase 2 COMPLETE")
