/**
 * Multilingual Localization Engine for NE-ROUTE.
 * Supported Official Languages: English (en), Hindi (hi), Assamese (as), Bengali (bn).
 */

import { create } from "zustand";

export type LanguageCode = "en" | "hi" | "as" | "bn";

export interface TranslationDict {
  // Navigation
  nav_command_center: string;
  nav_live_map: string;
  nav_incidents: string;
  nav_fleet: string;
  nav_deliveries: string;
  nav_routes: string;
  nav_reports: string;
  nav_alerts: string;
  nav_analytics: string;
  nav_admin: string;
  nav_settings: string;

  // Status Labels
  status_accessible: string;
  status_restricted: string;
  status_blocked: string;
  status_in_transit: string;
  status_delayed: string;
  status_at_risk: string;
  status_delivered: string;

  // Header & Controls
  tagline: string;
  search_placeholder: string;
  btn_route_optimizer: string;
  btn_field_report: string;
  btn_calculate_route: string;
  btn_save_report: string;
  btn_sync_now: string;
  data_trust_live: string;
  data_trust_simulated: string;

  // Metric Cards
  metric_accessibility: string;
  metric_active_incidents: string;
  metric_fleet_transit: string;
  metric_deliveries_risk: string;
  metric_high_risk_corridors: string;

  // Incident & Field Form
  field_hazard_type: string;
  field_severity: string;
  field_title: string;
  field_description: string;
  field_photo: string;
  field_gps_lock: string;
  field_saved_offline: string;

  // Risk & Rationale
  why_this_route: string;
  disruption_risk: string;
  prediction_window: string;
  weather_impact: string;
}

export const translations: Record<LanguageCode, TranslationDict> = {
  en: {
    nav_command_center: "Command Center",
    nav_live_map: "Live GIS Map",
    nav_incidents: "Incidents Triage",
    nav_fleet: "Fleet Tracking",
    nav_deliveries: "Deliveries",
    nav_routes: "Route Optimizer",
    nav_reports: "Field Reporting",
    nav_alerts: "Alert Feed",
    nav_analytics: "Analytics",
    nav_admin: "Administration",
    nav_settings: "Settings",

    status_accessible: "Accessible",
    status_restricted: "Restricted",
    status_blocked: "Blocked",
    status_in_transit: "In Transit",
    status_delayed: "Delayed",
    status_at_risk: "At Risk",
    status_delivered: "Delivered",

    tagline: "See the road before you send the vehicle.",
    search_placeholder: "Search roads, vehicles, consignments, incidents (Ctrl+K)...",
    btn_route_optimizer: "Route Optimizer",
    btn_field_report: "Field Report",
    btn_calculate_route: "Compute Optimal Routes",
    btn_save_report: "Save & Transmit Report",
    btn_sync_now: "Sync Now",
    data_trust_live: "DATA TRUST: LIVE TELEMETRY",
    data_trust_simulated: "DATA TRUST: SIMULATION MODE",

    metric_accessibility: "Network Accessibility",
    metric_active_incidents: "Active Incidents",
    metric_fleet_transit: "Fleet in Transit",
    metric_deliveries_risk: "Deliveries at Risk",
    metric_high_risk_corridors: "High-Risk Corridors",

    field_hazard_type: "Hazard Type",
    field_severity: "Hazard Severity",
    field_title: "Incident Title",
    field_description: "Field Observations & Damage Extent",
    field_photo: "Photographic Evidence",
    field_gps_lock: "GPS Location Lock",
    field_saved_offline: "Report saved locally in offline outbox.",

    why_this_route: "Why This Route? — AI Operational Rationale",
    disruption_risk: "Disruption Risk",
    prediction_window: "Prediction Window: Next 6 Hours",
    weather_impact: "Weather Impact",
  },

  hi: {
    nav_command_center: "कमांड सेंटर",
    nav_live_map: "लाइव जीआईएस मानचित्र",
    nav_incidents: "घटना प्रबंधन",
    nav_fleet: "वाहन ट्रैकिंग",
    nav_deliveries: "आपूर्ति वितरण",
    nav_routes: "मार्ग अनुकूलक",
    nav_reports: "फ़ील्ड रिपोर्टिंग",
    nav_alerts: "सतर्कता सूचनाएं",
    nav_analytics: "विश्लेषिकी",
    nav_admin: "प्रशासन",
    nav_settings: "सेटिंग्स",

    status_accessible: "सुगम / खुला",
    status_restricted: "प्रतिबंधित",
    status_blocked: "अवरुद्ध / बंद",
    status_in_transit: "मार्ग में",
    status_delayed: "विलंबित",
    status_at_risk: "जोखिम में",
    status_delivered: "सफलतापूर्वक वितरित",

    tagline: "वाहन भेजने से पहले सड़क की स्थिति जांचें।",
    search_placeholder: "सड़क, वाहन, खेप या घटना खोजें (Ctrl+K)...",
    btn_route_optimizer: "मार्ग अनुकूलक",
    btn_field_report: "फ़ील्ड रिपोर्ट",
    btn_calculate_route: "सर्वोत्तम मार्ग की गणना करें",
    btn_save_report: "रिपोर्ट सहेजें और भेजें",
    btn_sync_now: "अभी सिंक करें",
    data_trust_live: "डेटा विश्वास: लाइव टेलीमेट्री",
    data_trust_simulated: "डेटा विश्वास: सिमुलेशन मोड",

    metric_accessibility: "नेटवर्क सुगमता",
    metric_active_incidents: "सक्रिय घटनाएं",
    metric_fleet_transit: "मार्ग में वाहन",
    metric_deliveries_risk: "जोखिम में आपूर्ति",
    metric_high_risk_corridors: "उच्च जोखिम वाले गलियारे",

    field_hazard_type: "आपदा का प्रकार",
    field_severity: "गंभीरता स्तर",
    field_title: "घटना का शीर्षक",
    field_description: "क्षेत्रीय विवरण और क्षति",
    field_photo: "फोटो साक्ष्य",
    field_gps_lock: "जीपीएस स्थान लॉक",
    field_saved_offline: "रिपोर्ट ऑफ़लाइन सुरक्षित सहेजी गई।",

    why_this_route: "यह मार्ग क्यों? — एआई परिचालन तर्क",
    disruption_risk: "बाधा जोखिम",
    prediction_window: "पूर्वानुमान विंडो: अगले 6 घंटे",
    weather_impact: "मौसम का प्रभाव",
  },

  as: {
    nav_command_center: "কমাণ্ড চেণ্টাৰ",
    nav_live_map: "লাইভ জিআইএছ মানচিত্ৰ",
    nav_incidents: "দুৰ্ঘটনা পৰিচালনা",
    nav_fleet: "যান-বাহন ট্ৰেকিং",
    nav_deliveries: "যোগান বিতৰণ",
    nav_routes: "পথ অনুকূলকাৰক",
    nav_reports: "ক্ষেত্ৰ প্ৰতিবেদন",
    nav_alerts: "সতৰ্কবাৰ্তা",
    nav_analytics: "পৰিসংখ্যা",
    nav_admin: "প্ৰশাসন",
    nav_settings: "ছেটিংছ",

    status_accessible: "সুচল / খোলা",
    status_restricted: "সীমিত চলাচল",
    status_blocked: "বন্ধ / অৱৰুদ্ধ",
    status_in_transit: "পথত আছে",
    status_delayed: "পলম হৈছে",
    status_at_risk: "বিপদসংকুল",
    status_delivered: "বিতৰণ সম্পন্ন",

    tagline: "বাহন পঠোৱাৰ আগতে পথৰ অৱস্থা চাওক।",
    search_placeholder: "পথ, বাহন, চালান বা ঘটনা সন্ধান কৰক (Ctrl+K)...",
    btn_route_optimizer: "পথ অনুকূলকাৰক",
    btn_field_report: "ক্ষেত্ৰ প্ৰতিবেদন",
    btn_calculate_route: "উপযুক্ত পথ নিৰ্ণয় কৰক",
    btn_save_report: "প্ৰতিবেদন সংৰক্ষণ আৰু প্ৰেৰণ",
    btn_sync_now: "এতিয়াই ছিঙ্ক কৰক",
    data_trust_live: "তথ্য বিশ্বাস: লাইভ টেলিমেট্ৰি",
    data_trust_simulated: "তথ্য বিশ্বাস: ছিমুলেচন মোড",

    metric_accessibility: "নেটৱৰ্ক সুচলতা",
    metric_active_incidents: "সক্ৰিয় ঘটনা",
    metric_fleet_transit: "পথত থকা বাহন",
    metric_deliveries_risk: "বিপদত থকা চালান",
    metric_high_risk_corridors: "উচ্চ বিপদাশংকাযুক্ত পথ",

    field_hazard_type: "বিপদৰ প্ৰকাৰ",
    field_severity: "তীব্ৰতা",
    field_title: "ঘটনাৰ শিৰোনাম",
    field_description: "ক্ষেত্ৰভিত্তিক ক্ষয়-ক্ষতিৰ বিৱৰণ",
    field_photo: "ফটোগ্ৰাফীক প্ৰমাণ",
    field_gps_lock: "জি পি এছ স্থানাংক",
    field_saved_offline: "প্ৰতিবেদন অফলাইনত সংৰক্ষিত কৰা হ'ল।",

    why_this_route: "এই পথ কিয়? — এআই কাৰ্য্যকৰী যুক্তি",
    disruption_risk: "বিঘিনিৰ সম্ভাৱনা",
    prediction_window: "ভৱিষ্যদ্বাণী: অহা ৬ ঘণ্টা",
    weather_impact: "বতৰৰ প্ৰভাৱ",
  },

  bn: {
    nav_command_center: "কমান্ড সেন্টার",
    nav_live_map: "লাইভ জিআইএস মানচিত্র",
    nav_incidents: "ঘটনা পর্যবেক্ষণ",
    nav_fleet: "যানবাহন ট্র্যাকিং",
    nav_deliveries: "পণ্য সরবরাহ",
    nav_routes: "রুট অপ্টিমাইজার",
    nav_reports: "ফিল্ড রিপোর্টিং",
    nav_alerts: "সতর্কবার্তা",
    nav_analytics: "পরিসংখ্যান",
    nav_admin: "প্রশাসন",
    nav_settings: "সেটিংস",

    status_accessible: "চলাচলযোগ্য",
    status_restricted: "সীমিত",
    status_blocked: "অবরুদ্ধ",
    status_in_transit: "যাত্রাপথে",
    status_delayed: "বিলম্বিত",
    status_at_risk: "ঝুঁকিপূর্ণ",
    status_delivered: "বিতরণ সম্পন্ন",

    tagline: "গাড়ি পাঠানোর আগে রাস্তার অবস্থা দেখে নিন।",
    search_placeholder: "রাস্তা, যানবাহন, চালান বা ঘটনা অনুসন্ধান করুন (Ctrl+K)...",
    btn_route_optimizer: "রুট অপ্টিমাইজার",
    btn_field_report: "ফিল্ড রিপোর্ট",
    btn_calculate_route: "সেরা রুট গণনা করুন",
    btn_save_report: "রিপোর্ট সংরক্ষণ করুন",
    btn_sync_now: "এখনই সিঙ্ক করুন",
    data_trust_live: "ডেটা বিশ্বাস: লাইভ টেলিমেট্রি",
    data_trust_simulated: "ডেটা বিশ্বাস: সিমুলেশন মোড",

    metric_accessibility: "নেটওয়ার্ক চলাচলযোগ্যতা",
    metric_active_incidents: "সক্রিয় ঘটনা",
    metric_fleet_transit: "চলন্ত যানবাহন",
    metric_deliveries_risk: "ঝুঁকিপূর্ণ সরবরাহ",
    metric_high_risk_corridors: "উচ্চ ঝুঁকিপূর্ণ করিডোর",

    field_hazard_type: "বিপদের ধরণ",
    field_severity: "তীব্রতা",
    field_title: "ঘটনার শিরোনাম",
    field_description: "মাঠ পর্যায়ের পর্যবেক্ষণ ও ক্ষয়ক্ষতি",
    field_photo: "ছবি সংযুক্তি",
    field_gps_lock: "জিপিএস অবস্থান",
    field_saved_offline: "রিপোর্ট অফলাইনে সংরক্ষিত হয়েছে।",

    why_this_route: "এই রুট কেন? — এআই যুক্তি",
    disruption_risk: "বাধার ঝুঁকি",
    prediction_window: "পূর্বাভাস: আগামী ৬ ঘণ্টা",
    weather_impact: "আবহাওয়ার প্রভাব",
  },
};

interface LanguageStore {
  currentLanguage: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: keyof TranslationDict) => string;
}

export const useLanguageStore = create<LanguageStore>((set, get) => ({
  currentLanguage: "en",
  setLanguage: (lang: LanguageCode) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("neroute_lang", lang);
    }
    set({ currentLanguage: lang });
  },
  t: (key: keyof TranslationDict) => {
    const lang = get().currentLanguage;
    return translations[lang]?.[key] || translations.en[key] || key;
  },
}));
