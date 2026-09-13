# SETU-ROUTE Machine Learning Risk Prediction Pipeline

**Model Name:** Gradient Boosted Transportation Disruption Classifier  
**Model Version:** `1.0.0-ner-monsoon`  
**Problem Scope:** Early prediction of road corridor blockages and severe transit disruptions across the North Eastern Region of India.

---

## 1. Problem Formulation & Target

- **Task:** Binary / Probabilistic Tabular Classification
- **Target Variable (`disruption_event`):**
  - `1`: Road corridor blocked or experiencing transit disruption (>4h delay) within next 6 hours.
  - `0`: Road corridor accessible / free flowing.

---

## 2. Feature Engineering Schema

| Feature | Type | Unit | Description |
|---|---|---|---|
| `rainfall_1h_mm` | Float | mm | Precipitation intensity over last 1 hour |
| `rainfall_6h_mm` | Float | mm | Cumulative 6-hour rainfall (saturation trigger) |
| `rainfall_24h_mm` | Float | mm | Cumulative 24-hour rainfall |
| `temperature_c` | Float | °C | Ambient temperature at road elevation |
| `visibility_km` | Float | km | Atmospheric visibility (fog / cloudburst) |
| `road_condition_score` | Float | 1.0 - 4.0 | Paved Good (1.0) to Waterlogged/Damaged (4.0) |
| `traffic_level_score` | Float | 1.0 - 4.0 | Free flow (1.0) to Severe Gridlock (4.0) |
| `slope_deg` | Float | degrees | Mountainous terrain incline (0° to 45°) |
| `elevation_m` | Float | meters | Altitude above sea level (35m to 3500m) |
| `historical_slide_freq` | Float | 0.0 - 1.0 | Geological survey landslide recurrence index |
| `active_incidents_near` | Integer | count | Active incident obstructions within 25km |
| `recent_field_reports` | Integer | count | Field officer reports filed in last 12h |
| `current_accessibility` | Float | 0 - 100 | Accessibility engine score |
| `hour_sin`, `hour_cos` | Float | radians | Cyclical diurnal time representations |

---

## 3. Training & Validation Strategy

- **Algorithm:** `GradientBoostingClassifier` (120 estimators, max depth 4, learning rate 0.08, subsample 0.85).
- **Validation Split:** 80% Train, 20% Stratified Test Holdout.
- **Explainability:** Feature importance extraction + rule-based physical factor attribution.

---

## 4. Operational Limitations & Data Trust

1. **Dataset Provenance:** Trained on calibrated baseline datasets reflecting IMD rainfall patterns and Geological Survey of India (GSI) slope vulnerability benchmarks in Assam, Meghalaya, and Manipur.
2. **Confidence Bounds:** For newly paved roads without historical telemetry, the model falls back to baseline domain heuristics.
