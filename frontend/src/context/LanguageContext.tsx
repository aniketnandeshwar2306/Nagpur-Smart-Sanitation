import React, { createContext, useContext, useState, type ReactNode } from 'react';

export type Language = 'en' | 'hi' | 'mr';

export interface Translations {
  [key: string]: {
    en: string;
    hi: string;
    mr: string;
  };
}

export const DICTIONARY: Translations = {
  // Navigation & Brand
  app_name: { en: 'Nagpur SmartSanitation', hi: 'नागपूर स्मार्ट स्वच्छता', mr: 'नागपूर स्मार्ट स्वच्छता' },
  tagline: { en: 'Municipal Operations & Citizen Hub', hi: 'महापालिका कार्य आणि नागरिक केंद्र', mr: 'महानगरपालिका कामकाज व नागरिक केंद्र' },
  overview: { en: 'Overview', hi: 'अवलोकन', mr: 'एकंदर आढावा' },
  dashboard: { en: 'Dashboard', hi: 'डॅशबोर्ड', mr: 'डॅशबोर्ड' },
  analytics: { en: 'Analytics', hi: 'विश्लेषण', mr: 'आकडेवारी व विश्लेषण' },
  report_waste: { en: 'Report Waste', hi: 'कचरा तक्रार नोंदवा', mr: 'कचऱ्याची तक्रार नोंदवा' },
  my_reports: { en: 'My Grievances', hi: 'माझ्या तक्रारी', mr: 'माझ्या तक्रारी' },
  tracker: { en: 'Live GPS Radar', hi: 'थेट जीपीएस ट्रॅकर', mr: 'थेट जीपीएस ट्रॅकर' },
  schedule: { en: 'Pickup Timetable', hi: 'कचरा संकलन वेळापत्रक', mr: 'कचरा संकलन वेळापत्रक' },
  rewards: { en: 'GreenPoints & Rewards', hi: 'ग्रीनपॉइंट्स आणि रिवॉर्ड्स', mr: 'ग्रीनपॉइंट्स व बक्षिसे' },
  learn: { en: 'Segregation Guide & Quiz', hi: 'कचरा वर्गीकरण मार्गदर्शक', mr: 'कचरा वर्गीकरण नियम व प्रश्नमंजुषा' },
  admin_portal: { en: 'Admin Portal', hi: 'प्रशासक पोर्टल', mr: 'प्रशासक पोर्टल' },
  worker_portal: { en: 'Worker Portal', hi: 'कामगार पोर्टल', mr: 'कामगार पोर्टल' },
  citizen_portal: { en: 'Citizen Portal', hi: 'नागरिक पोर्टल', mr: 'नागरिक पोर्टल' },
  settings: { en: 'Settings', hi: 'सेटिंग्ज', mr: 'सेटिंग्ज' },
  logout: { en: 'Switch Role / Logout', hi: 'भूमिका बदला / लॉगआउट', mr: 'भूमिका बदला / लॉगआउट' },

  // Citizen Dashboard & Headers
  citizen_welcome: { en: 'Welcome, Citizen', hi: 'स्वागत आहे, नागरिक', mr: 'स्वागत आहे, नागरिक' },
  citizen_subtitle: { en: 'Nagpur Municipal Corporation ? Smart Cleanliness Initiative', hi: 'नागपूर महानगरपालिका • स्मार्ट स्वच्छता उपक्रम', mr: 'नागपूर महानगरपालिका • स्मार्ट स्वच्छता उपक्रम' },
  report_title: { en: 'Report Waste & Grievance', hi: 'कचरा व तक्रार नोंदणी', mr: 'कचरा व तक्रार नोंदणी' },
  report_desc: { en: 'Upload a photo or capture live waste. Nagpur SmartSanitation AI will analyze and dispatch inspectors.', hi: 'फोटो अपलोड करा किंवा थेट कॅमेरा वापरा. एआय तपासणी करून त्वरित कारवाई करेल.', mr: 'फोटो अपलोड करा किंवा थेट कॅमेऱ्याने फोटो काढा. एआय तपासणी करून त्वरित पथक पाठवेल.' },
  
  // AI & Upload
  ai_analyzing: { en: 'AI Scanning & Classifying Image...', hi: 'एआय फोटो तपासत आहे...', mr: 'एआय फोटो तपासत आहे...' },
  ai_verified: { en: 'AI Verified Waste Detected', hi: 'एआय प्रमाणित: कचरा आढळला', mr: 'एआय प्रमाणित: कचरा आढळला' },
  ai_warning: { en: 'AI Notice: Non-garbage photo detected. Please verify or re-upload a clear waste picture.', hi: 'एआय सूचना: कचरा आढळला नाही. कृपया स्पष्ट कचऱ्याचा फोटो निवडा.', mr: 'एआय सूचना: कचरा आढळला नाही. कृपया स्पष्ट कचऱ्याचा फोटो निवडा.' },
  category: { en: 'Waste Category', hi: 'कचरा प्रकार', mr: 'कचरा प्रकार' },
  wet_waste: { en: 'Wet Waste (Organic)', hi: 'ओला कचरा (जैविक)', mr: 'ओला कचरा (सेंद्रिय)' },
  dry_waste: { en: 'Dry Waste (Recyclable)', hi: 'सुका कचरा (पुनर्वापरयोग्य)', mr: 'सुका कचरा (पुनर्वापरयोग्य)' },
  hazardous_waste: { en: 'Hazardous Waste', hi: 'धोकादायक कचरा', mr: 'धोकादायक कचरा' },
  e_waste: { en: 'E-Waste', hi: 'ई-कचरा', mr: 'ई-कचरा' },
  mixed_waste: { en: 'Mixed Waste', hi: 'मिश्र कचरा', mr: 'मिश्र कचरा' },
  severity: { en: 'Severity Level', hi: 'गंभीरता पातळी', mr: 'तीव्रता पातळी' },
  description_placeholder: { en: 'Describe location landmark, smell, or issue details...', hi: 'जवळची खूण किंवा तक्रारीची माहिती लिहा...', mr: 'जवळची खूण किंवा तक्रारीची माहिती लिहा...' },
  submit_report: { en: 'Submit Waste Report', hi: 'तक्रार दाखल करा', mr: 'तक्रार दाखल करा' },
  submitting: { en: 'Submitting to NMC...', hi: 'दाखल होत आहे...', mr: 'दाखल होत आहे...' },
  retake_photo: { en: 'Retake Photo', hi: 'पुन्हा फोटो काढा', mr: 'पुन्हा फोटो काढा' },
  choose_gallery: { en: 'Choose from Gallery', hi: 'गॅलरीतून निवडा', mr: 'गॅलरीतून निवडा' },
  take_photo: { en: 'Take Live Photo', hi: 'थेट फोटो काढा', mr: 'थेट फोटो काढा' },

  // Grievance Tracking
  my_complaints_title: { en: 'Previous Complaints & Tracking', hi: 'मागील तक्रारी आणि स्थिती', mr: 'मागील तक्रारी व स्थिती' },
  ticket_id: { en: 'Ticket ID', hi: 'तक्रार क्रमांक', mr: 'तक्रार क्रमांक' },
  status: { en: 'Status', hi: 'स्थिती', mr: 'स्थिती' },
  status_submitted: { en: 'Submitted', hi: 'दाखल केली', mr: 'दाखल केली' },
  status_assigned: { en: 'Assigned', hi: 'नेमणूक झाली', mr: 'नेमणूक झाली' },
  status_in_progress: { en: 'In Progress', hi: 'प्रगतीपथावर', mr: 'प्रगतीपथावर' },
  status_resolved: { en: 'Resolved', hi: 'निवारण झाले', mr: 'निवारण झाले' },
  assigned_officer: { en: 'Assigned Municipal Authority', hi: 'नियुक्त महापालिका अधिकारी', mr: 'नियुक्त महानगरपालिका अधिकारी' },
  call: { en: 'Call', hi: 'कॉल करा', mr: 'कॉल करा' },
  email: { en: 'Email', hi: 'ईमेल करा', mr: 'ईमेल करा' },

  // Worker Portal
  worker_title: { en: 'Sanitation Worker Operations Hub', hi: 'स्वच्छता कामगार कार्य केंद्र', mr: 'स्वच्छता कामगार कामकाज केंद्र' },
  my_tasks: { en: 'My Daily Tasks', hi: 'माझी दैनिक कामे', mr: 'माझी दैनिक कामे' },
  route_map: { en: 'My Route Map', hi: 'माझा मार्ग नकाशा', mr: 'माझा मार्ग नकाशा' },
  bin_checklist: { en: 'Bin Checklist', hi: 'कचराकुंडी यादी', mr: 'कचराकुंडी यादी' },
  shift_history: { en: 'Shift History', hi: 'कामाचा इतिहास', mr: 'कामाचा इतिहास' },
  apply_leave: { en: 'Apply for Leave', hi: 'रजेसाठी अर्ज करा', mr: 'रजेसाठी अर्ज करा' },
  mark_collected: { en: 'Mark Collected', hi: 'संकलित झाले', mr: 'संकलित झाले' },

  // Admin Portal
  admin_title: { en: 'Admin Control Centre', hi: 'प्रशासक नियंत्रण कक्ष', mr: 'प्रशासक नियंत्रण कक्ष' },
  grievance_dispatch: { en: 'Grievance Dispatch', hi: 'तक्रार निवारण व वाटप', mr: 'तक्रार निवारण व वाटप' },
  fleet_management: { en: 'Fleet Management', hi: 'वाहन व्यवस्थापन', mr: 'वाहन व्यवस्थापन' },
  worker_registry: { en: 'Worker Registry', hi: 'कामगार नोंदणी वही', mr: 'कामगार नोंदणी वही' },
  zone_management: { en: 'Zone Management', hi: 'विभाग व्यवस्थापन', mr: 'प्रभाग व्यवस्थापन' },
  audit_reports: { en: 'Audit Reports', hi: 'ऑडिट अहवाल', mr: 'ऑडिट अहवाल' },
  assign: { en: 'Assign', hi: 'नियुक्त करा', mr: 'नियुक्त करा' },
  view_details: { en: 'View Details', hi: 'तपशील पहा', mr: 'तपशील पहा' },
  add_worker: { en: '+ Add Worker', hi: '+ नवीन कामगार जोडा', mr: '+ नवीन कामगार जोडा' },
  download_csv: { en: 'Download CSV', hi: 'CSV डाउनलोड करा', mr: 'CSV डाउनलोड करा' },
  print_report: { en: 'Print Report', hi: 'अहवाल मुद्रित करा', mr: 'अहवाल मुद्रित करा' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('nss_language');
    if (saved === 'hi' || saved === 'mr' || saved === 'en') return saved;
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('nss_language', lang);
  };

  const t = (key: string): string => {
    if (DICTIONARY[key]) {
      return DICTIONARY[key][language] || DICTIONARY[key]['en'] || key;
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
