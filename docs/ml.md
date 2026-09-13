# NE-ROUTE Machine Learning Disruption Predictor

The ML subsystem predicts the probability of roadway disruptions (landslides, flash flooding, slope collapse) across North Eastern corridors using environmental, meteorological, and topographical indicators.

---

## 1. Model Architecture & Pipeline

- **Algorithm**: `GradientBoostingClassifier` (Scikit-Learn).
- **Ensemble Size**: 120 Estimators, Maximum Depth = 4, Learning Rate = 0.08.
- **Inference Latency**: $< 2.5\text{ ms}$ per segment lookup.
- **Serialization**: Joblib artifact (`ml/models/disruption_model.joblib`).

---

## 2. Feature Vectors

| Feature | Unit | Source | Description |
|---|---|---|---|
| `rainfall_1h_mm` | mm/h | IMD Weather Station | Immediate hourly precipitation rate |
| `rainfall_6h_mm` | mm | IMD Weather Station | Cumulative 6-hour monsoon saturation |
| `slope_deg` | degrees | SRTM Digital Elevation Model | Mountain hillside inclination angle |
| `elevation_m` | meters | Topographic Survey | Altitude above sea level |
| `active_incidents_count` | count | NE-ROUTE Incident Stream | Active minor slides within 20km |
| `accessibility_score` | 0-100 | Accessibility Engine | Current corridor health score |

---

## 3. Disruption Risk Categorization

The model outputs `disruption_probability` ($P \in [0.0, 1.0]$) and maps to operational levels:

- **$P < 0.25$ -> `LOW` (Green)**: Standard operations; normal convoy dispatch.
- **$0.25 \le P < 0.55$ -> `ELEVATED` (Yellow)**: Advise caution; monitor cloudburst radars.
- **$0.55 \le P < 0.75$ -> `HIGH` (Orange)**: Restrict heavy multi-axle freight; prepare bypass routes.
- **$P \ge 0.75$ -> `CRITICAL` (Red)**: Impending corridor failure; trigger proactive dynamic rerouting.

---

## 4. Operational Explainability (*"Why This Route?"*)

For each prediction, the engine identifies the top contributing features:
- *"Severe Torrential Downpour (48.5 mm/h) exceeds mountain subgrade saturation threshold."*
- *"Steep Mountain Slope (28.0°) combined with historical landslide vulnerability."*
- *"High-Altitude Pass (850m) vulnerable to flash mudslide accumulation."*

---

## 5. Training & Retraining Workflow

To retrain the model with updated regional incident logs:
```bash
python ml/train.py --dataset data/historical_ner_incidents.csv --output ml/models/disruption_model.joblib
```
