"""
Training Pipeline for SETU-ROUTE Transportation Disruption Risk Model.
Trains a Gradient Boosted Decision Tree classifier with feature importance attribution.
"""

import os
import sys
import json
import joblib
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

from ml.dataset import generate_ner_training_data
from ml.features import FEATURE_NAMES

ARTIFACTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "artifacts"))

def train_and_evaluate_model():
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    print("==================================================")
    print("  SETU-ROUTE ML TRAINING PIPELINE (SIH 2026)")
    print("  Training Disruption Risk Model on NER Corridors")
    print("==================================================")

    # 1. Generate / Load Data
    X, y = generate_ner_training_data(n_samples=4000, random_state=42)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)
    
    print(f"[+] Training samples: {len(X_train)} | Test samples: {len(X_test)}")
    print(f"[+] Target disruption rate: {y_train.mean():.2%}")

    # 2. Train Gradient Boosted Decision Tree
    model = GradientBoostingClassifier(
        n_estimators=120,
        learning_rate=0.08,
        max_depth=4,
        subsample=0.85,
        random_state=42
    )
    model.fit(X_train, y_train)

    # 3. Evaluate on unseen test data
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_prob)

    print("\n[+] --- Model Evaluation Metrics (Unseen Test Set) ---")
    print(f"    Accuracy:  {acc:.4f}")
    print(f"    Precision: {prec:.4f}")
    print(f"    Recall:    {rec:.4f}")
    print(f"    F1 Score:  {f1:.4f}")
    print(f"    ROC-AUC:   {auc:.4f}")

    # 4. Feature Importance Attribution
    importances = model.feature_importances_
    feat_imp = sorted(zip(FEATURE_NAMES, importances), key=lambda x: x[1], reverse=True)
    
    print("\n[+] --- Top Contributing Risk Features ---")
    for fname, imp in feat_imp[:6]:
        print(f"    - {fname:25s}: {imp:.4f} ({imp*100:.1f}%)")

    # 5. Serialize Artifacts
    model_path = os.path.join(ARTIFACTS_DIR, "disruption_model.joblib")
    joblib.dump(model, model_path)
    print(f"\n[+] Serialized model artifact saved to: {model_path}")

    metadata = {
        "model_name": "SETU-ROUTE Gradient Boosted Disruption Classifier",
        "model_version": "1.0.0-ner-monsoon",
        "algorithm": "GradientBoostingClassifier",
        "training_timestamp": datetime.now(timezone.utc).isoformat(),
        "n_samples": len(X),
        "features": FEATURE_NAMES,
        "metrics": {
            "accuracy": round(float(acc), 4),
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "f1_score": round(float(f1), 4),
            "roc_auc": round(float(auc), 4)
        },
        "feature_importances": {name: round(float(imp), 4) for name, imp in feat_imp},
        "notes": "Trained on calibrated NER geographical topography (Assam-Meghalaya-Manipur corridors)."
    }

    meta_path = os.path.join(ARTIFACTS_DIR, "metadata.json")
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"[+] Saved model metadata and explainability weights to: {meta_path}")
    print("==================================================\n")

    return model, metadata

if __name__ == "__main__":
    train_and_evaluate_model()
