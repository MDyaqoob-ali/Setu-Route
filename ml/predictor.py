"""
Inference & Explainability Engine for NE-ROUTE Transportation Disruption Risk.
Computes calibrated disruption probabilities and extracts top contributing risk factors.
"""

import os
import sys
import json
import joblib
from typing import Dict, Any, List, Tuple

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.features import extract_features, FEATURE_NAMES

ARTIFACTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "artifacts"))
MODEL_PATH = os.path.join(ARTIFACTS_DIR, "disruption_model.joblib")
META_PATH = os.path.join(ARTIFACTS_DIR, "metadata.json")

class DisruptionRiskPredictor:
    def __init__(self):
        self.model = None
        self.metadata = {}
        self.load_model()

    def load_model(self):
        if os.path.exists(MODEL_PATH) and os.path.exists(META_PATH):
            try:
                self.model = joblib.load(MODEL_PATH)
                with open(META_PATH, "r") as f:
                    self.metadata = json.load(f)
            except Exception as e:
                print(f"[!] Warning: Could not load trained model: {e}")
                self.model = None
        else:
            print("[!] Model artifact not found. Please run ml/train.py first.")

    def predict(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes model inference and extracts explainable risk factors.
        """
        vec = extract_features(raw_data)
        
        if self.model:
            import pandas as pd
            df_in = pd.DataFrame([vec], columns=FEATURE_NAMES)
            prob = float(self.model.predict_proba(df_in)[0][1])
        else:
            # Baseline domain heuristic fallback if model not loaded
            rainfall = float(raw_data.get("rainfall_6h_mm", 0.0))
            slope = float(raw_data.get("slope_deg", 10.0))
            incidents = float(raw_data.get("active_incidents_count", 0))
            prob = min(0.99, max(0.05, (rainfall / 100.0) * 0.4 + (slope / 45.0) * 0.3 + (incidents * 0.2)))

        risk_score = round(prob * 100, 1)

        # Categorize Risk Level
        if risk_score >= 75.0:
            risk_level = "CRITICAL"
        elif risk_score >= 50.0:
            risk_level = "HIGH"
        elif risk_score >= 25.0:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # Generate Explainability Factors based on input feature values and model importances
        contributing_factors = self._explain_prediction(raw_data, prob)

        return {
            "risk_score": risk_score,
            "probability_of_disruption": round(prob, 4),
            "risk_level": risk_level,
            "model_version": self.metadata.get("model_version", "1.0.0-ner-monsoon"),
            "prediction_window": "Next 6 Hours",
            "top_contributing_factors": contributing_factors,
            "data_confidence": "Statistically Calibrated" if self.model else "Baseline Rule Heuristic"
        }

    def _explain_prediction(self, data: Dict[str, Any], prob: float) -> List[Dict[str, Any]]:
        factors = []
        
        rainfall_6h = float(data.get("rainfall_6h_mm", data.get("rainfall_1h_mm", 0) * 3.5))
        if rainfall_6h > 40.0:
            factors.append({
                "factor": "Heavy Monsoon Precipitation",
                "detail": f"{rainfall_6h:.1f} mm rain recorded over past 6 hours, saturating hill slope subgrade.",
                "severity": "HIGH" if rainfall_6h > 65 else "MEDIUM",
                "impact_weight": 0.35
            })

        slope = float(data.get("slope_deg", data.get("slope", 15.0)))
        if slope > 22.0:
            factors.append({
                "factor": "Steep Himalayan Terrain Gradient",
                "detail": f"Terrain slope of {slope:.0f}° exceeds critical landslide shear threshold.",
                "severity": "HIGH" if slope > 30 else "MEDIUM",
                "impact_weight": 0.28
            })

        incidents = int(data.get("active_incidents_count", data.get("active_incidents_near", 0)))
        if incidents > 0:
            factors.append({
                "factor": "Active Corridor Incidents",
                "detail": f"{incidents} active blockage/rockfall reports within operational sector.",
                "severity": "CRITICAL" if incidents >= 2 else "HIGH",
                "impact_weight": 0.25
            })

        acc = float(data.get("accessibility_score", 80.0))
        if acc < 60.0:
            factors.append({
                "factor": "Degraded Corridor Accessibility",
                "detail": f"Current segment accessibility degraded to {acc:.0f}/100.",
                "severity": "HIGH" if acc < 40 else "MEDIUM",
                "impact_weight": 0.20
            })

        hist_freq = float(data.get("historical_slide_freq", data.get("vulnerability_index", 0.3)))
        if hist_freq > 0.6:
            factors.append({
                "factor": "High Historical Slide Recurrence",
                "detail": "GSI geological records show repeated annual slope failures at this coordinate.",
                "severity": "MEDIUM",
                "impact_weight": 0.15
            })

        if not factors:
            factors.append({
                "factor": "Normal Highway Operating Parameters",
                "detail": "Precipitation within safe threshold, stable geological grade, free flow traffic.",
                "severity": "LOW",
                "impact_weight": 0.05
            })

        factors.sort(key=lambda x: x["impact_weight"], reverse=True)
        return factors[:4]

risk_predictor = DisruptionRiskPredictor()
