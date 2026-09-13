# SETU-ROUTE Multi-Criteria Graph Routing & ETA Engine

The routing system optimizes freight corridors across difficult mountainous topography, taking into account road status, incident hazard zones, terrain gradient, and severe monsoon precipitation.

---

## 1. Multi-Criteria Graph Solver

The regional transportation network is represented as an adjacency graph $G = (V, E)$ where:
- **Vertices ($V$)**: Strategic logistics hubs, junction points, border terminals, and valley intersections (Guwahati, Shillong, Silchar, Jowai, Haflong, Dimapur, Kohima, Imphal, Aizawl, Agartala, Gangtok).
- **Edges ($E$)**: Highway segments connecting adjacent nodes with length $L_e$, nominal speed $S_e$, elevation gain $\Delta h_e$, and surface condition $C_e$.

### Effective Cost Formulation:
$$Cost(e) = \text{Duration}(e) \times W_{time} + \text{RiskPenalty}(e) \times W_{risk} + \text{CargoPriorityMultiplier}(e)$$

### Dynamic Risk Penalties:
1. **Blocked Road ($\text{status} = \text{BLOCKED}$)**:
   $$\text{Penalty} = 50.0 \times L_e \quad (\text{Effectively impassable; solver diverts})$$
2. **Restricted Road ($\text{status} = \text{RESTRICTED}$)**:
   $$\text{Penalty} = 2.5 \times L_e$$
3. **Active Critical Incident within 15km**:
   $$\text{Penalty} = 20.0 \times L_e$$
4. **Monsoon Precipitation Penalty**:
   $$\text{Penalty} = \max(1.0, 1.0 + \frac{\text{Rainfall}_{1h}}{25.0})$$

---

## 2. 4 Candidate Route Strategies

When `/api/v1/routes/optimize` is called, the graph engine returns 4 structured routes:

1. **Recommended Route**:
   - Optimal trade-off between transit speed, safety buffer, and elevation strain.
   - Recommended for standard government convoys and essential supplies.
2. **Fastest Route**:
   - Minimizes total driving time; accepts moderate weather risk if roads remain open.
3. **Lowest-Risk Route**:
   - Maximizes safety coefficient; aggressively avoids high-precipitation valleys and active slope failure zones.
   - Prescribed for dangerous cargo (Petroleum tankers, hazardous chemicals).
4. **Alternative Bypass Route**:
   - Selects secondary state highways and border bypasses (e.g., Western Meghalaya SH detour avoiding NH-6 Sonapur).
   - Designed for contingency diversions during major landslides.

---

## 3. Physics-Aware ETA Calibration (`ETAEngine`)

Arrival times are calculated through physical and environmental calibration:

$$\text{EffectiveSpeed} = \text{BaseSpeed} \times M_{\text{surface}} \times M_{\text{rain}} \times M_{\text{grade}}$$

- **Base Speeds by Vehicle Class:**
  - Heavy Truck (16T): $45\text{ km/h}$
  - Medium Truck (10T): $50\text{ km/h}$
  - Light Commercial (3.5T): $55\text{ km/h}$
  - Refrigerated Medical: $52\text{ km/h}$
  - Tanker (Fuel): $42\text{ km/h}$
- **Surface Multiplier ($M_{\text{surface}}$):**
  - Good/Paved: $1.00$
  - Fair: $0.85$
  - Unpaved/Muddy: $0.65$
  - Waterlogged: $0.45$
- **Precipitation Multiplier ($M_{\text{rain}}$):**
  - $\le 10\text{ mm/h}$: $1.00$
  - $10 - 25\text{ mm/h}$: $0.80$
  - $> 25\text{ mm/h}$ (Cloudburst): $0.60$
- **Elevation Gradient Multiplier ($M_{\text{grade}}$):**
  $$M_{\text{grade}} = \max(0.65, 1.0 - \frac{\Delta h}{8000.0})$$
- **Bottleneck Delay:**
  $$\text{Delay}_{\text{bottleneck}} = N_{\text{bottlenecks}} \times 45\text{ minutes}$$
