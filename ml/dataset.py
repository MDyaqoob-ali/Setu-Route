"""
Dataset Generator for North Eastern Region Transportation Risk Modeling.
Grounded in empirical hill-slope physics and IMD monsoon precipitation patterns.
Explicitly labeled as development/baseline dataset for SIH 2026 platform.
"""

import os
import sys
import numpy as np
import pandas as pd
from typing import Tuple

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.features import FEATURE_NAMES

def generate_ner_training_data(n_samples: int = 3500, random_state: int = 42) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Generates realistic training data with physical causal relationships:
    - High precipitation (>50mm 6h) on steep slopes (>25 deg) + high elevation -> High Landslide Disruption Probability
    - High rainfall (>80mm 24h) in low elevation (<100m) riverine plains -> High Flood Inundation Probability
    - Poor road condition + active incidents -> High Traffic Stoppage Probability
    """
    np.random.seed(random_state)
    
    # 1. Physical environmental distributions
    rainfall_1h = np.random.exponential(scale=12.0, size=n_samples)
    rainfall_6h = rainfall_1h * np.random.uniform(2.5, 5.0, size=n_samples) + np.random.exponential(scale=15.0, size=n_samples)
    rainfall_24h = rainfall_6h * np.random.uniform(1.8, 3.5, size=n_samples) + np.random.exponential(scale=25.0, size=n_samples)
    
    # Elevation: bimodal (Valley/Plains: 40-150m, High Hill/Pass: 600-3200m)
    is_hill = np.random.binomial(1, 0.65, size=n_samples)
    elevation = np.where(
        is_hill == 1,
        np.random.uniform(500, 3200, size=n_samples),
        np.random.uniform(35, 200, size=n_samples)
    )
    
    # Slope: higher in mountainous sectors
    slope = np.where(
        is_hill == 1,
        np.random.beta(a=3, b=2, size=n_samples) * 40.0,
        np.random.beta(a=1, b=5, size=n_samples) * 8.0
    )
    
    temperature = np.clip(32.0 - (elevation / 180.0) + np.random.normal(0, 3, size=n_samples), 2.0, 38.0)
    visibility = np.clip(10.0 - (rainfall_1h * 0.25) - np.random.exponential(scale=1.5, size=n_samples), 0.5, 12.0)
    
    road_condition = np.random.choice([1.0, 1.8, 2.5, 3.4, 4.0], p=[0.45, 0.25, 0.15, 0.10, 0.05], size=n_samples)
    traffic_level = np.random.uniform(1.0, 3.8, size=n_samples)
    hist_freq = np.random.beta(a=2, b=3, size=n_samples)  # 0 to 1
    
    active_incidents = np.random.poisson(lam=0.6, size=n_samples)
    field_reports = np.random.poisson(lam=0.4, size=n_samples)
    
    # Current accessibility (0 to 100)
    current_acc = np.clip(
        100.0 - (active_incidents * 28.0) - (road_condition * 8.0) - (rainfall_1h * 0.8),
        0.0, 100.0
    )
    
    hours = np.random.uniform(0, 24, size=n_samples)
    hour_sin = np.sin(2 * np.pi * hours / 24.0)
    hour_cos = np.cos(2 * np.pi * hours / 24.0)

    # 2. Compute true physical Disruption Propensity (Log-odds score)
    # Hill Landslide component
    landslide_risk = (
        (slope / 30.0) * 1.8 +
        (rainfall_6h / 60.0) * 2.2 +
        (rainfall_24h / 150.0) * 1.5 +
        (hist_freq * 1.6) +
        (elevation / 2000.0) * 0.8
    )
    
    # Plain Inundation / Flooding component
    flood_risk = np.where(
        elevation < 200,
        (rainfall_24h / 120.0) * 2.5 + (road_condition * 0.6),
        0.0
    )
    
    # Obstruction / Traffic breakdown component
    road_breakdown = (
        (active_incidents * 1.9) +
        (field_reports * 1.2) +
        (road_condition >= 3.0) * 1.5 +
        (100.0 - current_acc) / 35.0
    )

    total_risk_latent = landslide_risk + flood_risk + road_breakdown - 4.2
    
    # Sigmoid to probability
    disruption_prob = 1.0 / (1.0 + np.exp(-total_risk_latent))
    # Binary disruption classification target (1 if disrupted, 0 if normal)
    target = (np.random.uniform(0, 1, size=n_samples) < disruption_prob).astype(int)

    df = pd.DataFrame({
        "rainfall_1h_mm": rainfall_1h,
        "rainfall_6h_mm": rainfall_6h,
        "rainfall_24h_mm": rainfall_24h,
        "temperature_c": temperature,
        "visibility_km": visibility,
        "road_condition_score": road_condition,
        "traffic_level_score": traffic_level,
        "slope_deg": slope,
        "elevation_m": elevation,
        "historical_slide_freq": hist_freq,
        "active_incidents_near": active_incidents,
        "recent_field_reports": field_reports,
        "current_accessibility": current_acc,
        "hour_sin": hour_sin,
        "hour_cos": hour_cos
    })
    
    return df, pd.Series(target, name="disruption_event")

if __name__ == "__main__":
    df, y = generate_ner_training_data()
    print(f"[+] Generated dataset: {df.shape[0]} samples, {df.shape[1]} features.")
    print(f"[+] Disruption class balance: {y.mean():.2%}")
