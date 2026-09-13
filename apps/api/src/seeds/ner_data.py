# Seed dataset for North Eastern Region (NER) logistics and accessibility intelligence

DISTRICTS_DATA = [
    # Assam
    {"name": "Kamrup Metropolitan", "state": "Assam", "code": "AS-KM", "latitude": 26.1445, "longitude": 91.7362, "terrain_type": "Floodplain / Riverine", "elevation_avg_m": 55, "vulnerability": 0.45},
    {"name": "Cachar", "state": "Assam", "code": "AS-CA", "latitude": 24.8333, "longitude": 92.7789, "terrain_type": "Valley / Floodplain", "elevation_avg_m": 35, "vulnerability": 0.78},
    {"name": "Sonitpur", "state": "Assam", "code": "AS-SO", "latitude": 26.6528, "longitude": 92.7926, "terrain_type": "Plains / Foothills", "elevation_avg_m": 72, "vulnerability": 0.35},
    {"name": "Dima Hasao", "state": "Assam", "code": "AS-DH", "latitude": 25.1764, "longitude": 93.0189, "terrain_type": "Hilly / Mountainous", "elevation_avg_m": 650, "vulnerability": 0.85},
    {"name": "Dibrugarh", "state": "Assam", "code": "AS-DB", "latitude": 27.4728, "longitude": 94.9120, "terrain_type": "Riverine Alluvial", "elevation_avg_m": 108, "vulnerability": 0.40},
    
    # Meghalaya
    {"name": "East Khasi Hills", "state": "Meghalaya", "code": "ML-EK", "latitude": 25.5788, "longitude": 91.8933, "terrain_type": "High Plateau / Ridges", "elevation_avg_m": 1525, "vulnerability": 0.70},
    {"name": "Ri-Bhoi", "state": "Meghalaya", "code": "ML-RB", "latitude": 25.9038, "longitude": 91.8794, "terrain_type": "Foothills / Rolling Valleys", "elevation_avg_m": 480, "vulnerability": 0.50},
    {"name": "East Jaintia Hills", "state": "Meghalaya", "code": "ML-EJ", "latitude": 25.3370, "longitude": 92.3667, "terrain_type": "High Rainfall Karst Slopes", "elevation_avg_m": 1200, "vulnerability": 0.88},
    
    # Manipur
    {"name": "Imphal West", "state": "Manipur", "code": "MN-IW", "latitude": 24.8170, "longitude": 93.9368, "terrain_type": "Intermontane Valley", "elevation_avg_m": 786, "vulnerability": 0.60},
    {"name": "Noney", "state": "Manipur", "code": "MN-NN", "latitude": 24.7892, "longitude": 93.5971, "terrain_type": "Rugged Mountain Slopes", "elevation_avg_m": 920, "vulnerability": 0.92},
    {"name": "Senapati", "state": "Manipur", "code": "MN-SN", "latitude": 25.2678, "longitude": 94.0195, "terrain_type": "Steep Hill Terrain", "elevation_avg_m": 1150, "vulnerability": 0.75},
    
    # Nagaland
    {"name": "Kohima", "state": "Nagaland", "code": "NL-KH", "latitude": 25.6751, "longitude": 94.1086, "terrain_type": "High Ridge Mountain", "elevation_avg_m": 1444, "vulnerability": 0.78},
    {"name": "Dimapur", "state": "Nagaland", "code": "NL-DM", "latitude": 25.9068, "longitude": 93.7270, "terrain_type": "Valley Gateway", "elevation_avg_m": 195, "vulnerability": 0.30},
    
    # Mizoram
    {"name": "Aizawl", "state": "Mizoram", "code": "MZ-AZ", "latitude": 23.7307, "longitude": 92.7173, "terrain_type": "Steep North-South Ridges", "elevation_avg_m": 1132, "vulnerability": 0.82},
    {"name": "Kolasib", "state": "Mizoram", "code": "MZ-KL", "latitude": 24.2250, "longitude": 92.6780, "terrain_type": "Hilly Corridor", "elevation_avg_m": 610, "vulnerability": 0.68},
    
    # Tripura
    {"name": "West Tripura", "state": "Tripura", "code": "TR-WT", "latitude": 23.8315, "longitude": 91.2868, "terrain_type": "Plains / Low Rolling Hills", "elevation_avg_m": 42, "vulnerability": 0.40},
    {"name": "Dhalai", "state": "Tripura", "code": "TR-DH", "latitude": 24.0167, "longitude": 91.8500, "terrain_type": "Forested Ridges & Valleys", "elevation_avg_m": 180, "vulnerability": 0.55},
    
    # Arunachal Pradesh
    {"name": "Papum Pare", "state": "Arunachal Pradesh", "code": "AR-PP", "latitude": 27.0844, "longitude": 93.6053, "terrain_type": "Sub-Himalayan Foothills", "elevation_avg_m": 320, "vulnerability": 0.65},
    {"name": "Tawang", "state": "Arunachal Pradesh", "code": "AR-TW", "latitude": 27.5861, "longitude": 91.8594, "terrain_type": "High Alpine Himalayas", "elevation_avg_m": 3048, "vulnerability": 0.90},
    
    # Sikkim
    {"name": "East Sikkim", "state": "Sikkim", "code": "SK-ES", "latitude": 27.3314, "longitude": 88.6138, "terrain_type": "Steep Himalayan Valleys", "elevation_avg_m": 1650, "vulnerability": 0.85}
]

ROADS_DATA = [
    {
        "name": "East-West Arterial Expressway (Guwahati – Nagaon – Jorhat – Dibrugarh)",
        "code": "NH-27",
        "highway_type": "National Expressway / AH-2",
        "state": "Assam",
        "total_length_km": 520.0,
        "start_point_name": "Guwahati (Khanapara)",
        "end_point_name": "Dibrugarh (Mohanbari)",
        "accessibility_status": "ACCESSIBLE",
        "criticality": "CRITICAL",
        "average_speed_kmh": 62.0,
        "current_risk_score": 0.18,
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [91.7362, 26.1445],
                [92.1500, 26.1800],
                [92.6800, 26.3500],
                [93.0500, 26.0200],
                [93.4500, 25.9500],
                [93.7500, 26.6000],
                [94.2037, 26.7509],
                [94.6300, 26.9800],
                [94.9120, 27.4728],
                [95.3600, 27.5000]
            ]
        }
    },
    {
        "name": "North Bank Brahmaputra Trunk Corridor (Baihata – Tezpur – Lakhimpur – Pasighat)",
        "code": "NH-15",
        "highway_type": "National Highway",
        "state": "Assam / Arunachal Pradesh",
        "total_length_km": 540.0,
        "start_point_name": "Baihata Chariali",
        "end_point_name": "Pasighat (Siang River)",
        "accessibility_status": "ACCESSIBLE",
        "criticality": "HIGH",
        "average_speed_kmh": 54.0,
        "current_risk_score": 0.24,
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [91.7100, 26.3400],
                [92.0300, 26.4300],
                [92.4800, 26.7000],
                [92.7926, 26.6528],
                [93.1800, 26.7300],
                [93.7600, 26.8700],
                [94.1000, 27.2300],
                [94.5800, 27.4800],
                [94.7300, 27.6000],
                [95.1600, 27.9800],
                [95.3300, 28.0660]
            ]
        }
    },
    {
        "name": "Guwahati – Shillong – Silchar Trans-Meghalaya Arterial",
        "code": "NH-6",
        "highway_type": "National Highway",
        "state": "Meghalaya / Assam",
        "total_length_km": 345.0,
        "start_point_name": "Guwahati (Jorabat)",
        "end_point_name": "Silchar (Rongpur Yard)",
        "accessibility_status": "RESTRICTED",
        "criticality": "CRITICAL",
        "average_speed_kmh": 34.0,
        "current_risk_score": 0.65,
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [91.7362, 26.1445],
                [91.8250, 26.1150],
                [91.8794, 25.9038],
                [91.8933, 25.5788],
                [92.2100, 25.4500],
                [92.3667, 25.3370],
                [92.4820, 25.1850],
                [92.5100, 25.1000],
                [92.5800, 24.8900],
                [92.7789, 24.8333],
                [92.3500, 24.8600]
            ]
        }
    },
    {
        "name": "Silchar – Jiribam – Noney – Imphal Lifeline Highway",
        "code": "NH-37",
        "highway_type": "National Highway",
        "state": "Assam / Manipur",
        "total_length_km": 255.0,
        "start_point_name": "Silchar",
        "end_point_name": "Imphal (Kangla)",
        "accessibility_status": "RESTRICTED",
        "criticality": "CRITICAL",
        "average_speed_kmh": 28.0,
        "current_risk_score": 0.72,
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [92.7789, 24.8333],
                [93.0100, 24.8100],
                [93.1200, 24.8000],
                [93.3800, 24.7600],
                [93.5971, 24.7892],
                [93.7500, 24.8050],
                [93.9368, 24.8170]
            ]
        }
    },
    {
        "name": "Dimapur – Kohima – Mao – Senapati – Imphal – Churachandpur Spine",
        "code": "NH-29 / NH-2",
        "highway_type": "National Highway",
        "state": "Nagaland / Manipur",
        "total_length_km": 310.0,
        "start_point_name": "Dimapur (Purana Bazar)",
        "end_point_name": "Churachandpur",
        "accessibility_status": "ACCESSIBLE",
        "criticality": "CRITICAL",
        "average_speed_kmh": 36.0,
        "current_risk_score": 0.38,
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [93.7270, 25.9068],
                [93.7800, 25.8400],
                [93.9500, 25.7500],
                [94.1086, 25.6751],
                [94.1200, 25.5300],
                [94.1200, 25.4500],
                [94.0195, 25.2678],
                [93.9700, 25.1500],
                [93.9368, 24.8170],
                [93.8100, 24.6300],
                [93.6800, 24.3300]
            ]
        }
    },
    {
        "name": "Imphal – Pallel – Tengnoupal – Moreh Asian Highway",
        "code": "NH-102",
        "highway_type": "Asian Highway 1 / International Trade Corridor",
        "state": "Manipur",
        "total_length_km": 110.0,
        "start_point_name": "Imphal (Kangla)",
        "end_point_name": "Moreh (Myanmar ICP Border)",
        "accessibility_status": "ACCESSIBLE",
        "criticality": "CRITICAL",
        "average_speed_kmh": 44.0,
        "current_risk_score": 0.30,
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [93.9368, 24.8170],
                [93.9900, 24.6400],
                [94.0100, 24.5000],
                [94.0300, 24.4700],
                [94.1500, 24.3700],
                [94.2800, 24.2800],
                [94.3000, 24.2450]
            ]
        }
    },
    {
        "name": "Silchar – Kolasib – Sairang – Aizawl – Lunglei Corridor",
        "code": "NH-306 / NH-54",
        "highway_type": "National Highway",
        "state": "Assam / Mizoram",
        "total_length_km": 325.0,
        "start_point_name": "Silchar",
        "end_point_name": "Lunglei",
        "accessibility_status": "ACCESSIBLE",
        "criticality": "HIGH",
        "average_speed_kmh": 32.0,
        "current_risk_score": 0.35,
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [92.7789, 24.8333],
                [92.7500, 24.5100],
                [92.7000, 24.3800],
                [92.6780, 24.2250],
                [92.6800, 24.0800],
                [92.6600, 23.8200],
                [92.7173, 23.7307],
                [92.8500, 23.3100],
                [92.7400, 22.8800]
            ]
        }
    },
    {
        "name": "Silchar – Churaibari – Agartala – Sabroom Corridor",
        "code": "NH-8",
        "highway_type": "National Highway / Port Link",
        "state": "Assam / Tripura",
        "total_length_km": 385.0,
        "start_point_name": "Silchar",
        "end_point_name": "Sabroom (Maitri Bridge)",
        "accessibility_status": "ACCESSIBLE",
        "criticality": "HIGH",
        "average_speed_kmh": 46.0,
        "current_risk_score": 0.22,
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [92.7789, 24.8333],
                [92.3500, 24.8600],
                [92.2300, 24.5100],
                [92.1700, 24.3700],
                [92.0300, 24.1600],
                [91.8500, 24.0167],
                [91.6000, 23.8400],
                [91.2868, 23.8315],
                [91.3000, 23.6800],
                [91.4800, 23.5300],
                [91.5600, 23.2800],
                [91.7000, 23.0000]
            ]
        }
    },
    {
        "name": "Siliguri – Sevoke – Teesta – Rangpo – Gangtok Lifeline",
        "code": "NH-10",
        "highway_type": "National Highway",
        "state": "West Bengal / Sikkim",
        "total_length_km": 115.0,
        "start_point_name": "Siliguri (Sevoke)",
        "end_point_name": "Gangtok (Ranipool)",
        "accessibility_status": "RESTRICTED",
        "criticality": "CRITICAL",
        "average_speed_kmh": 30.0,
        "current_risk_score": 0.70,
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [88.3953, 26.7271],
                [88.4800, 26.8800],
                [88.4700, 26.9600],
                [88.5200, 27.0500],
                [88.5300, 27.1800],
                [88.5800, 27.2400],
                [88.6138, 27.3314]
            ]
        }
    },
    {
        "name": "Gangtok – Tsomgo Lake – Sherathang – Nathu La Pass Border Highway",
        "code": "NH-710",
        "highway_type": "High Alpine Border Highway (14,140 ft)",
        "state": "Sikkim",
        "total_length_km": 56.0,
        "start_point_name": "Gangtok",
        "end_point_name": "Nathu La Pass (Indo-China Border)",
        "accessibility_status": "ACCESSIBLE",
        "criticality": "CRITICAL",
        "average_speed_kmh": 26.0,
        "current_risk_score": 0.52,
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [88.6138, 27.3314],
                [88.6600, 27.3500],
                [88.7200, 27.3700],
                [88.7600, 27.3900],
                [88.8100, 27.3800],
                [88.8500, 27.3860]
            ]
        }
    },
    {
        "name": "Tezpur – Bhalukpong – Sela Pass Tunnel – Tawang Highway",
        "code": "Bhalukpong-Tawang Road",
        "highway_type": "Border Strategic Highway",
        "state": "Arunachal Pradesh",
        "total_length_km": 320.0,
        "start_point_name": "Tezpur",
        "end_point_name": "Tawang",
        "accessibility_status": "BLOCKED",
        "criticality": "CRITICAL",
        "average_speed_kmh": 22.0,
        "current_risk_score": 0.88,
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [92.7926, 26.6528],
                [92.7700, 26.8200],
                [92.6500, 27.0100],
                [92.5600, 27.1500],
                [92.4200, 27.2600],
                [92.2500, 27.3600],
                [92.1000, 27.5000],
                [91.9800, 27.5600],
                [91.8594, 27.5861]
            ]
        }
    },
    {
        "name": "Trans-Arunachal Strategic Highway (Potin – Ziro – Daporijo – Along – Pasighat)",
        "code": "NH-13",
        "highway_type": "Strategic Trans-Himalayan Highway",
        "state": "Arunachal Pradesh",
        "total_length_km": 440.0,
        "start_point_name": "Potin (NH-15 Junction)",
        "end_point_name": "Pasighat",
        "accessibility_status": "ACCESSIBLE",
        "criticality": "HIGH",
        "average_speed_kmh": 35.0,
        "current_risk_score": 0.42,
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [93.6053, 27.0844],
                [93.7500, 27.3500],
                [93.8300, 27.5300],
                [94.0200, 27.7600],
                [94.2200, 27.9800],
                [94.5200, 28.1600],
                [94.8000, 28.1700],
                [95.0500, 28.1300],
                [95.3300, 28.0660]
            ]
        }
    },
    {
        "name": "Arunachal Capital Complex Expressway (Banderdewa – Naharlagun – Itanagar)",
        "code": "NH-415",
        "highway_type": "4-Lane Capital Expressway",
        "state": "Assam / Arunachal Pradesh",
        "total_length_km": 60.0,
        "start_point_name": "Banderdewa",
        "end_point_name": "Itanagar / Gohpur",
        "accessibility_status": "ACCESSIBLE",
        "criticality": "HIGH",
        "average_speed_kmh": 52.0,
        "current_risk_score": 0.15,
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [93.8200, 27.1200],
                [93.7200, 27.1100],
                [93.6800, 27.1000],
                [93.6053, 27.0844],
                [93.6100, 27.0200],
                [93.7600, 26.8700]
            ]
        }
    },
    {
        "name": "Bogibeel Rail-Road Brahmaputra Bridge Corridor (Dibrugarh – Silapathar)",
        "code": "NH-52B",
        "highway_type": "Mega Bridge Transhipment Link",
        "state": "Assam / Arunachal Pradesh",
        "total_length_km": 120.0,
        "start_point_name": "Dibrugarh",
        "end_point_name": "Aalo (Along)",
        "accessibility_status": "ACCESSIBLE",
        "criticality": "CRITICAL",
        "average_speed_kmh": 58.0,
        "current_risk_score": 0.20,
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [94.9120, 27.4728],
                [94.8600, 27.4800],
                [94.7500, 27.4200],
                [94.6800, 27.5500],
                [94.7300, 27.6000],
                [94.6500, 27.7800],
                [94.8000, 28.1700]
            ]
        }
    },
    {
        "name": "Western Meghalaya / Garo Hills Corridor (Guwahati – Nongstoin – Baghmara – Tura)",
        "code": "NH-106",
        "highway_type": "National Highway / Alternate Bypass",
        "state": "Meghalaya / Assam",
        "total_length_km": 360.0,
        "start_point_name": "Guwahati (Rani)",
        "end_point_name": "Tura (Garo Hills)",
        "accessibility_status": "ACCESSIBLE",
        "criticality": "MEDIUM",
        "average_speed_kmh": 40.0,
        "current_risk_score": 0.32,
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [91.7362, 26.1445],
                [91.2400, 25.9600],
                [91.2697, 25.5215],
                [91.4500, 25.3200],
                [91.2500, 25.1800],
                [90.6300, 25.2000],
                [90.6200, 25.6000],
                [90.2200, 25.5200]
            ]
        }
    },
    {
        "name": "Nagaland Interior Foothills Corridor (Kohima – Wokha – Mokokchung – Tuli – Amguri)",
        "code": "NH-702",
        "highway_type": "Inter-District Hill Highway",
        "state": "Nagaland / Assam",
        "total_length_km": 210.0,
        "start_point_name": "Kohima",
        "end_point_name": "Amguri / Jorhat",
        "accessibility_status": "ACCESSIBLE",
        "criticality": "HIGH",
        "average_speed_kmh": 35.0,
        "current_risk_score": 0.38,
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [94.1086, 25.6751],
                [94.2600, 26.0900],
                [94.5200, 26.3200],
                [94.6800, 26.5400],
                [94.6600, 26.6800],
                [94.5700, 26.8100],
                [94.2037, 26.7509]
            ]
        }
    },
    {
        "name": "Tripura Eastern Forest & Orange Ridge Corridor (Manu – Kanchanpur – Jampui)",
        "code": "NH-108A",
        "highway_type": "State / Border Buffer Highway",
        "state": "Tripura / Mizoram",
        "total_length_km": 135.0,
        "start_point_name": "Manu (NH-8 Junction)",
        "end_point_name": "Jampui Hills / Mizoram Border",
        "accessibility_status": "ACCESSIBLE",
        "criticality": "MEDIUM",
        "average_speed_kmh": 36.0,
        "current_risk_score": 0.28,
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [91.8500, 24.0167],
                [92.0500, 24.1200],
                [92.2200, 24.0300],
                [92.2700, 23.9200],
                [92.2800, 23.8100],
                [92.3500, 23.7000]
            ]
        }
    },
    {
        "name": "Lower Assam Gateway Corridor (Siliguri – Cooch Behar – Dhubri – Guwahati)",
        "code": "NH-127B",
        "highway_type": "National Highway / Gateway Corridor",
        "state": "West Bengal / Assam",
        "total_length_km": 410.0,
        "start_point_name": "Siliguri",
        "end_point_name": "Guwahati (Jalukbari)",
        "accessibility_status": "ACCESSIBLE",
        "criticality": "HIGH",
        "average_speed_kmh": 56.0,
        "current_risk_score": 0.20,
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [88.3953, 26.7271],
                [88.7200, 26.5200],
                [89.4500, 26.3200],
                [89.8200, 26.1500],
                [89.9800, 26.0200],
                [90.0400, 25.8800],
                [90.6200, 26.1700],
                [91.5000, 26.1200],
                [91.7362, 26.1445]
            ]
        }
    }
]

INCIDENTS_DATA = [
    {
        "type": "landslide",
        "severity": "CRITICAL",
        "title": "Massive Rock & Mud Debris at Sela Pass Access (Km 284)",
        "description": "Continuous cloudburst triggered deep slope instability blocking both carriageways. 400m section buried under boulders. BRO equipment deployed.",
        "latitude": 27.5120,
        "longitude": 92.1240,
        "address": "Bhalukpong-Tawang Rd near Sela Tunnel North Portal",
        "road_code": "Bhalukpong-Tawang Road",
        "district_code": "AR-TW",
        "affected_traffic": "BOTH"
    },
    {
        "type": "flood",
        "severity": "HIGH",
        "title": "Flash Inundation & Silt Overwash on NH-6 Sonapur Sector",
        "description": "Heavy runoff from Jaintia hills submerged highway under 3.5ft rushing water near Sonapur Tunnel. Heavy trucks stranded along 6km queue.",
        "latitude": 25.1850,
        "longitude": 92.4820,
        "address": "NH-6 Km 142, Sonapur, East Jaintia Hills",
        "road_code": "NH-6",
        "district_code": "ML-EJ",
        "affected_traffic": "BOTH"
    },
    {
        "type": "road_damage",
        "severity": "HIGH",
        "title": "Subgrade Sinking & Fissures on NH-37 (Noney Sector)",
        "description": "Subsidence of hillside outer lane along 120m stretch. Single-lane alternating convoy operation enforced by Manipur Police and NHIDCL.",
        "latitude": 24.7892,
        "longitude": 93.5971,
        "address": "NH-37 Km 78, Noney Valley",
        "road_code": "NH-37",
        "district_code": "MN-NN",
        "affected_traffic": "SINGLE_LANE_ALTERNATING"
    },
    {
        "type": "bridge_damage",
        "severity": "MEDIUM",
        "title": "Bailey Bridge Approach Erosion near Haflong",
        "description": "Scour observed at eastern abutment following torrential hill stream surge. Load limit capped at 12 Tons; heavy multi-axle trucks diverted.",
        "latitude": 25.1764,
        "longitude": 93.0189,
        "address": "Dima Hasao Hill Link Rd, Km 32",
        "road_code": "NH-27",
        "district_code": "AS-DH",
        "affected_traffic": "RESTRICTED_WEIGHT"
    },
    {
        "type": "landslide",
        "severity": "HIGH",
        "title": "Active Mudflow on NH-10 Teesta Valley Sector (29th Mile)",
        "description": "Unstable mud cone actively discharging debris over roadway. Single lane opened intermittently during rain pauses.",
        "latitude": 27.0650,
        "longitude": 88.5230,
        "address": "NH-10 Km 48, Teesta Bazar Sector",
        "road_code": "NH-10",
        "district_code": "SK-ES",
        "affected_traffic": "SINGLE_LANE"
    },
    {
        "type": "traffic",
        "severity": "MEDIUM",
        "title": "Freight Bottleneck & Oil Spill at Jorabat Checkpoint",
        "description": "Minor tanker leakage cleared, but 4-hour commercial clearance backlog moving slowly into Meghalaya foothills.",
        "latitude": 26.1150,
        "longitude": 91.8250,
        "address": "Jorabat Inter-State Toll Plaza",
        "road_code": "NH-6",
        "district_code": "AS-KM",
        "affected_traffic": "SOUTHBOUND"
    }
]

VEHICLES_DATA = [
    {"reg": "AS-01-GB-4012", "type": "Heavy Truck (16T)", "driver": "Biren Das", "phone": "+91 94350 11223", "status": "MOVING", "lat": 26.1445, "lng": 91.7362, "speed": 52.0, "dest": "Dimapur", "fuel": 82.0},
    {"reg": "AS-01-HC-9821", "type": "Refrigerated Medical", "driver": "Pradip Bora", "phone": "+91 98640 44556", "status": "MOVING", "lat": 25.9038, "lng": 91.8794, "speed": 44.0, "dest": "Shillong Civil Hospital", "fuel": 91.0},
    {"reg": "ML-05-D-8821", "type": "Medium Truck (10T)", "driver": "Womshing Lyngdoh", "phone": "+91 98560 33211", "status": "DELAYED", "lat": 25.1850, "lng": 92.4820, "speed": 0.0, "dest": "Silchar FCI Depot", "fuel": 64.0},
    {"reg": "MN-01-A-3390", "type": "Heavy Truck (16T)", "driver": "Thoiba Singh", "phone": "+91 97740 77889", "status": "DELAYED", "lat": 24.7892, "lng": 93.5971, "speed": 8.0, "dest": "Imphal Wholesale Market", "fuel": 55.0},
    {"reg": "NL-07-C-1945", "type": "Tanker (Fuel)", "driver": "Kevichusa Angami", "phone": "+91 94360 88122", "status": "MOVING", "lat": 25.7500, "lng": 93.9500, "speed": 38.0, "dest": "Kohima IOCL Depot", "fuel": 78.0},
    {"reg": "MZ-01-K-7712", "type": "Medium Truck (10T)", "driver": "Lalthanpuia Sailo", "phone": "+91 94361 99233", "status": "MOVING", "lat": 24.2250, "lng": 92.6780, "speed": 32.0, "dest": "Aizawl Supply Godown", "fuel": 70.0},
    {"reg": "TR-01-H-6654", "type": "Heavy Truck (16T)", "driver": "Subrata Debnath", "phone": "+91 94364 55432", "status": "MOVING", "lat": 24.0167, "lng": 91.8500, "speed": 48.0, "dest": "Agartala Food Corporation", "fuel": 85.0},
    {"reg": "AR-01-E-2201", "type": "4x4 Emergency Supply", "driver": "Dorjee Khandu", "phone": "+91 94360 11990", "status": "STOPPED", "lat": 27.2800, "lng": 92.4200, "speed": 0.0, "dest": "Tawang Military & Civil Hospital", "fuel": 60.0},
    {"reg": "SK-01-T-9011", "type": "Light Commercial (3.5T)", "driver": "Pemba Bhutia", "phone": "+91 98320 66778", "status": "DELAYED", "lat": 27.0650, "lng": 88.5230, "speed": 12.0, "dest": "Gangtok STNM Hospital", "fuel": 73.0},
    {"reg": "AS-11-BC-5520", "type": "Heavy Truck (16T)", "driver": "Anowar Hussain", "phone": "+91 94351 88442", "status": "MOVING", "lat": 24.8333, "lng": 92.7789, "speed": 40.0, "dest": "Jiribam Railhead", "fuel": 88.0}
]

DELIVERIES_DATA = [
    {
        "title": "Life-Saving Vaccines & Emergency Pharmaceuticals",
        "category": "Medical Supplies",
        "desc": "Cold-chain insulin, neonatal vaccines, anti-venom and surgical trauma supplies.",
        "weight": 2.8,
        "priority": "CRITICAL",
        "status": "IN_TRANSIT",
        "orig_name": "Guwahati Central Medical Store", "orig_lat": 26.1445, "orig_lng": 91.7362,
        "dest_name": "Shillong Civil Hospital", "dest_lat": 25.5788, "dest_lng": 91.8933,
        "veh_reg": "AS-01-HC-9821",
        "delay": 0,
        "risk": "LOW"
    },
    {
        "title": "Essential Rice Buffer Stock (FCI Allotment)",
        "category": "Essential Food Grains",
        "desc": "100 quintals Fortified Rice for Public Distribution System (PDS) godowns.",
        "weight": 14.5,
        "priority": "HIGH",
        "status": "AT_RISK",
        "orig_name": "Guwahati Food Stockyard", "orig_lat": 26.1445, "orig_lng": 91.7362,
        "dest_name": "Silchar FCI Depot", "dest_lat": 24.8333, "dest_lng": 92.7789,
        "veh_reg": "ML-05-D-8821",
        "delay": 185,
        "risk": "HIGH",
        "reason": "Trapped in Sonapur NH-6 inundation queue."
    },
    {
        "title": "Medical Oxygen Cylinders & Surgical Kits",
        "category": "Medical Supplies",
        "desc": "40 D-type High Pressure Medical Oxygen cylinders for district ICUs.",
        "weight": 3.2,
        "priority": "CRITICAL",
        "status": "AT_RISK",
        "orig_name": "Tezpur Oxygen Refilling Plant", "orig_lat": 26.6528, "orig_lng": 92.7926,
        "dest_name": "Tawang District Hospital", "dest_lat": 27.5861, "dest_lng": 91.8594,
        "veh_reg": "AR-01-E-2201",
        "delay": 320,
        "risk": "SEVERE",
        "reason": "Sela Pass road completely blocked by landslide debris."
    },
    {
        "title": "Bulk Diesel & Aviation Turbine Fuel",
        "category": "Petroleum/Fuel",
        "desc": "18,000 Litres High-Speed Diesel for regional emergency power generators.",
        "weight": 16.0,
        "priority": "HIGH",
        "status": "IN_TRANSIT",
        "orig_name": "Numaligarh Refinery Ltd", "orig_lat": 26.6000, "orig_lng": 93.7500,
        "dest_name": "Kohima IOCL Depot", "dest_lat": 25.6751, "dest_lng": 94.1086,
        "veh_reg": "NL-07-C-1945",
        "delay": 20,
        "risk": "LOW"
    },
    {
        "title": "Disaster Relief Tarpaulins, Water Purifiers & Rations",
        "category": "Disaster Relief",
        "desc": "Emergency SDRF flood relief packages containing water purification tablets and solar lamps.",
        "weight": 8.5,
        "priority": "CRITICAL",
        "status": "DELAYED",
        "orig_name": "Silchar Flood Relief Center", "orig_lat": 24.8333, "orig_lng": 92.7789,
        "dest_name": "Imphal Relief Coordination Hub", "dest_lat": 24.8170, "dest_lng": 93.9368,
        "veh_reg": "MN-01-A-3390",
        "delay": 140,
        "risk": "HIGH",
        "reason": "NH-37 Noney single-lane restriction causing multi-hour crawl."
    },
    {
        "title": "Baby Food, Infant Formula & Essential Medicines",
        "category": "Medical Supplies",
        "desc": "Nutritional kits and infant healthcare supplies for isolated rural primary healthcare centres.",
        "weight": 4.0,
        "priority": "HIGH",
        "status": "IN_TRANSIT",
        "orig_name": "Silchar Logistics Hub", "orig_lat": 24.8333, "orig_lng": 92.7789,
        "dest_name": "Aizawl Supply Godown", "dest_lat": 23.7307, "dest_lng": 92.7173,
        "veh_reg": "MZ-01-K-7712",
        "delay": 0,
        "risk": "LOW"
    }
]

WEATHER_DATA = [
    {"district_code": "AS-KM", "station": "Guwahati Borjhar Met Station", "lat": 26.1060, "lng": 91.5859, "rain_3h": 4.2, "rain_24h": 18.0, "temp": 28.5, "wind": 11.0, "flood_lvl": "GREEN", "landslide_idx": 0.1},
    {"district_code": "ML-EK", "station": "Sohra (Cherrapunji) Automatic Weather Station", "lat": 25.2700, "lng": 91.7300, "rain_3h": 78.5, "rain_24h": 240.0, "temp": 18.2, "wind": 28.0, "flood_lvl": "ORANGE", "landslide_idx": 0.88},
    {"district_code": "ML-EJ", "station": "Khliehriat Slope Monitoring Station", "lat": 25.3500, "lng": 92.3800, "rain_3h": 62.0, "rain_24h": 195.0, "temp": 19.0, "wind": 22.0, "flood_lvl": "RED", "landslide_idx": 0.92},
    {"district_code": "MN-NN", "station": "Noney Hill Hydro Station", "lat": 24.7800, "lng": 93.6000, "rain_3h": 41.0, "rain_24h": 112.0, "temp": 22.4, "wind": 15.0, "flood_lvl": "ORANGE", "landslide_idx": 0.79},
    {"district_code": "AR-TW", "station": "Sela Ridge Met Tower (13,700 ft)", "lat": 27.5000, "lng": 92.1000, "rain_3h": 55.0, "rain_24h": 160.0, "temp": 6.5, "wind": 35.0, "flood_lvl": "RED", "landslide_idx": 0.95},
    {"district_code": "SK-ES", "station": "Teesta Basin Telemetry 4", "lat": 27.0800, "lng": 88.5400, "rain_3h": 36.0, "rain_24h": 98.0, "temp": 20.1, "wind": 18.0, "flood_lvl": "ORANGE", "landslide_idx": 0.72}
]
