// ---------------------------------------------------------------------------
// Citizen Module — i18n Internationalization Dictionary
// Languages: English ('en'), Marathi ('mr'), Hindi ('hi')
// ---------------------------------------------------------------------------

export type Language = 'en' | 'mr' | 'hi';

export interface Translations {
  portalTitle: string;
  portalSubtitle: string;
  wardBadge: string;
  tabs: {
    home: string;
    report: string;
    myReports: string;
    tracker: string;
    schedule: string;
    rewards: string;
    learn: string;
  };
  greeting: string;
  welcomeMessage: string;
  reportWasteNow: string;
  activeReports: string;
  resolvedIssues: string;
  greenPoints: string;
  dayStreak: string;
  nextPickup: string;
  todaysPickup: string;
  learnSegregation: string;
  recentReports: string;
  aiScanning: string;
  aiDetected: string;
  voiceNote: string;
  recordVoice: string;
  stopRecording: string;
  playAudio: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  en: {
    portalTitle: 'Nagpur SmartSanitation',
    portalSubtitle: 'Citizen Services & Grievance Portal',
    wardBadge: 'Ward 14 (Dharampeth)',
    tabs: {
      home: 'Home',
      report: 'Report Waste',
      myReports: 'My Complaints',
      tracker: 'Live Truck',
      schedule: 'Schedule',
      rewards: 'Rewards',
      learn: 'Segregation',
    },
    greeting: 'Namaste, Nagpur Citizen! 🙏',
    welcomeMessage: 'Welcome to Nagpur SmartSanitation. Report waste issues, track your pickup schedule, earn GreenPoints, and keep Nagpur clean.',
    reportWasteNow: 'Report Waste Now',
    activeReports: 'Active Reports',
    resolvedIssues: 'Resolved Issues',
    greenPoints: 'GreenPoints',
    dayStreak: 'Day Streak',
    nextPickup: 'Next Pickup',
    todaysPickup: "Today's Pickup",
    learnSegregation: 'Learn Waste Segregation',
    recentReports: 'Recent Waste Reports',
    aiScanning: 'AI Image Analyzer scanning...',
    aiDetected: 'AI Classification',
    voiceNote: 'Voice Note Audio Description',
    recordVoice: 'Record Audio Note',
    stopRecording: 'Stop Recording',
    playAudio: 'Play Audio Note',
  },
  mr: {
    portalTitle: 'नागपूर स्मार्ट-स्वच्छता',
    portalSubtitle: 'नागरी सेवा व तक्रार निवारण पोर्टल',
    wardBadge: 'प्रभाग १४ (धरमपेठ)',
    tabs: {
      home: 'मुख्य',
      report: 'कचरा नोंदवा',
      myReports: 'माझ्या तक्रारी',
      tracker: 'थेट गाडी',
      schedule: 'वेळापत्रक',
      rewards: 'बक्षीसे',
      learn: 'वर्गवारी',
    },
    greeting: 'नमस्ते, नागपूरकर नागरिक! 🙏',
    welcomeMessage: 'नागपूर स्मार्ट स्वच्छता पोर्टलवर आपले स्वागत आहे. कचऱ्याची तक्रार नोंदवा, गाड्यांचे वेळापत्रक पहा आणि ग्रीन पॉईंट्स मिळवा.',
    reportWasteNow: 'कचरा नोंदवा',
    activeReports: 'सक्रिय तक्रारी',
    resolvedIssues: 'सोडवलेल्या तक्रारी',
    greenPoints: 'ग्रीन पॉईंट्स',
    dayStreak: 'सततचे दिवस',
    nextPickup: 'पुढील संकलन',
    todaysPickup: 'आजचे संकलन',
    learnSegregation: 'कचरा वर्गवारी शिका',
    recentReports: 'नुकत्याच नोंदवलेल्या तक्रारी',
    aiScanning: 'AI द्वारे फोटोची तपासणी सुरू आहे...',
    aiDetected: 'AI वर्गीकरण निष्कर्ष',
    voiceNote: 'आवाज संदेश स्पष्टीकरण',
    recordVoice: 'आवाज रेकॉर्ड करा',
    stopRecording: 'रेकॉर्डिंग थांबवा',
    playAudio: 'आवाज संदेश ऐका',
  },
  hi: {
    portalTitle: 'नागपुर स्मार्ट-स्वच्छता',
    portalSubtitle: 'नागरिक सेवा व शिकायत निवारण पोर्टल',
    wardBadge: 'वार्ड 14 (धरमपेठ)',
    tabs: {
      home: 'मुख्य',
      report: 'कचरा रिपोर्ट करें',
      myReports: 'मेरी शिकायतें',
      tracker: 'लाइव ट्रक',
      schedule: 'समय सारणी',
      rewards: 'पुरस्कार',
      learn: 'वर्गीकरण',
    },
    greeting: 'नमस्ते, नागपुर नागरिक! 🙏',
    welcomeMessage: 'नागपुर स्मार्ट स्वच्छता पोर्टल में आपका स्वागत है। कचरे की शिकायत दर्ज करें, पिकअप शेड्यूल ट्रैक करें और ग्रीन पॉइंट्स अर्जित करें।',
    reportWasteNow: 'अभी कचरा रिपोर्ट करें',
    activeReports: 'सक्रिय शिकायतें',
    resolvedIssues: 'हल की गई शिकायतें',
    greenPoints: 'ग्रीन पॉइंट्स',
    dayStreak: 'लगातार दिन',
    nextPickup: 'अगला संकलन',
    todaysPickup: 'आज का संकलन',
    learnSegregation: 'कचरा पृथक्करण सीखें',
    recentReports: 'हाल की शिकायतें',
    aiScanning: 'AI द्वारा फोटो स्कैनिंग जारी है...',
    aiDetected: 'AI वर्गीकरण परिणाम',
    voiceNote: 'वॉयस नोट विवरण',
    recordVoice: 'वॉयस नोट रिकॉर्ड करें',
    stopRecording: 'रिकॉर्डिंग रोकें',
    playAudio: 'वॉयस नोट सुनें',
  },
};
