import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import {
  signInWithGoogle,
  signUpWithEmail,
  loginWithEmail,
  savePatientToFirestore,
} from "./lib/firebase";
import { DoctorsDirectory } from "./components/DoctorsDirectory";

/* =========================
   ICONS & ACCESSIBILITY ASSETS
========================= */
const Ico = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={className} aria-hidden="true">
    {children}
  </span>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const MicIcon = ({ active }: { active?: boolean }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
    <rect x="8.5" y="2" width="7" height="12" rx="3.5" fill="currentColor" />
    <path d="M4.5 10.5v1a7.5 7.5 0 0 0 15 0v-1" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M12 19v3.5" fill="none" stroke="currentColor" strokeWidth="2" />
    {active && <circle cx="12" cy="8" r="2" fill="#fff" />}
  </svg>
);

const SpeakerIcon = ({ speaking }: { speaking?: boolean }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
    <path
      d="M15.54 8.46a5 5 0 0 1 0 7.07"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {speaking && (
      <path
        d="M19.07 4.93a10 10 0 0 1 0 14.14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    )}
  </svg>
);

const StopSpeechIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
    <rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor" />
  </svg>
);

const ClipIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
    <path
      d="M16.5 6.5v9a4.5 4.5 0 0 1-9 0V6a3 3 0 0 1 6 0v9a1.5 1.5 0 0 1-3 0V7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const EyeIcon = ({ visible }: { visible: boolean }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
    <path
      d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
    {visible && <line x1="3" y1="21" x2="21" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
  </svg>
);

function DoctorTeamIcon() {
  return (
    <svg viewBox="0 0 64 64" width="34" height="34" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="32" cy="11.5" rx="5.6" ry="7" />
        <path d="M17.5 35c.6-5.5 4.2-9 9.5-11" />
        <path d="M46.5 35c-.6-5.5-4.2-9-9.5-11" />
        <path d="M25.6 26c-1.2 3.4-.5 6.6 1.9 8" />
        <circle cx="29.6" cy="35" r="1.4" />
        <path d="M40.2 29v5.6M37.4 31.8H43" />
        <circle cx="15" cy="45" r="4.6" />
        <path d="M6.5 61.5V61c0-5.5 3.8-9.5 8.5-9.5s8.5 4 8.5 9.5v.5" />
        <circle cx="49" cy="45" r="4.6" />
        <path d="M40.5 61.5V61c0-5.5 3.8-9.5 8.5-9.5s8.5 4 8.5 9.5v.5" />
        <circle cx="32" cy="50.2" r="3.3" />
        <path d="M25.6 61.5v-.3c0-3.9 2.8-6.6 6.4-6.6s6.4 2.7 6.4 6.6v.3" />
      </g>
      <path d="M26 10.5C25.4 5 28.4 2 32 2s6.6 3 6 8.5c-1.2-2.6-3.4-4-6-4s-4.8 1.4-6 4z" fill="currentColor" />
      <path d="M28.3 23.2 32 30l3.7-6.8z" fill="currentColor" />
    </svg>
  );
}

function PatientIcon() {
  const front = (
    <>
      <ellipse cx="24" cy="32" rx="9.5" ry="11.5" />
      <rect x="19.5" y="41" width="9" height="8" />
      <path d="M7 61v-2c0-8 6.5-12 17-12s17 4 17 12v2z" />
    </>
  );
  return (
    <svg viewBox="0 0 64 64" width="34" height="34" aria-hidden="true" focusable="false">
      <defs>
        <mask id="patient-icon-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
          <rect width="64" height="64" fill="#fff" />
          <g fill="#000" stroke="#000" strokeWidth="3.6" strokeLinejoin="round">{front}</g>
        </mask>
      </defs>
      <g fill="currentColor" mask="url(#patient-icon-cut)">
        <ellipse cx="40" cy="25" rx="8.5" ry="10.5" />
        <rect x="35.5" y="33" width="9" height="8" />
        <path d="M24 56v-2c0-8 6-12.5 16-12.5s16 4.5 16 12.5v2z" />
      </g>
      <g fill="currentColor">{front}</g>
      <path d="M52 4.5v10M47 9.5h10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function AssistantIcon() {
  return (
    <svg viewBox="0 0 64 64" width="34" height="34" aria-hidden="true" focusable="false" color="#0b3b8c">
      <circle cx="15" cy="42.5" r="5.4" fill="#fff" stroke="currentColor" strokeWidth="3" />
      <circle cx="49" cy="42.5" r="5.4" fill="#fff" stroke="currentColor" strokeWidth="3" />
      <line x1="32" y1="10" x2="32" y2="16.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="7.6" r="3" fill="#7fc4ff" stroke="currentColor" strokeWidth="2.4" />
      <rect x="12.5" y="16.5" width="39" height="35.5" rx="12" fill="#e7edf6" stroke="currentColor" strokeWidth="3.2" />
      <path
        d="M26.5 16.5v5.3a2.8 2.8 0 0 0 2.8 2.8h5.4a2.8 2.8 0 0 0 2.8-2.8v-5.3"
        fill="#5c6b85"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <rect x="18" y="22.8" width="28" height="23" rx="8" fill="#fff" stroke="currentColor" strokeWidth="3.2" />
      <ellipse cx="26.5" cy="34" rx="4.4" ry="5.2" fill="currentColor" />
      <ellipse cx="25.1" cy="31.9" rx="1.3" ry="1.7" fill="#fff" />
      <ellipse cx="37.5" cy="34" rx="4.4" ry="5.2" fill="currentColor" />
      <ellipse cx="36.1" cy="31.9" rx="1.3" ry="1.7" fill="#fff" />
      <path d="M26 41.8c1.7 2.8 8.3 2.8 12 0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* =========================
   DATA & CONFIG (Patient & Doctor only)
========================= */
const ROLES: Record<string, any> = {
  patient: {
    icon: "👤",
    Icon: PatientIcon,
    title: "Patient",
    sub: "Mobile + OTP / Email / Google Login",
    heading: "Patient Portal",
    tagline: "Access your medical records and Voice Health Copilot",
    badge: "👤 Patient",
    desc: "Manage your unified health information & voice copilot",
  },
  doctor: {
    icon: "👨‍⚕️",
    Icon: DoctorTeamIcon,
    title: "Doctor / Hospital Staff",
    sub: "Professional Login",
    heading: "Doctor / Hospital Staff",
    tagline: "Healthcare professional login",
    badge: "👨‍⚕️ Doctor / Staff",
    desc: "Access authorized patient healthcare information",
  },
};

const LOGIN_FIELDS: Record<string, [string, string, string][]> = {
  doctor: [
    ["pid", "Professional ID (HPR)", "text"],
    ["hid", "Hospital ID (HFR)", "text"],
    ["pin", "PIN", "password"],
  ],
};

const NAV: Record<string, [string, React.ReactNode, string][]> = {
  patient: [
    ["dashboard", "🏠", "Dashboard"],
    ["doctors", "👨‍⚕️", "Doctors Directory"],
    ["records", "📋", "Medical Records"],
    ["medications", "💊", "Medications"],
    ["consent", "🔐", "Consent Manager"],
    ["ai", "🤖", "AI Health Assistant"],
    ["profile", "👤", "Health Profile"],
  ],
  doctor: [
    ["dashboard", "🏠", "Dashboard"],
    ["doctors", "👨‍⚕️", "Doctors Network"],
    ["patients", "👥", "Patient Verification"],
    ["records", "📋", "Health Records"],
    ["emergencyRecords", "🚨", "Emergency & Unidentified Records"],
    ["encounter", "🩺", "New Encounter"],
    ["sharing", "🔐", "Secure Sharing"],
  ],
};

const GENERIC: Record<string, Record<string, [string, [string, string, string][]]>> = {
  patient: {
    records: [
      "Your complete healthcare record timeline.",
      [
        ["🧪", "Blood Test (CBC)", "Apollo Hospitals • 18 Sep 2026"],
        ["💊", "Prescription", "Apollo Hospitals • 15 Sep 2026"],
        ["🩻", "Chest Imaging", "Apollo Hospitals • 02 Sep 2026"],
        ["💉", "Vaccination", "Health Centre • 20 Aug 2026"],
      ],
    ],
    medications: [
      "Your active and recent medications.",
      [
        ["💊", "Azithromycin 500mg", "Once daily • 3 days remaining • Prescribed by Dr. A. Sharma, 15 Sep 2026"],
        ["💊", "Cetirizine 10mg", "Once at night • Ongoing, for seasonal allergy • Prescribed by Dr. A. Sharma, 15 Sep 2026"],
      ],
    ],
    ai: [
      "Understand your medical reports in simple language with voice guidance.",
      [
        ["🧪", "Hemoglobin: 11.5 g/dL", "Slightly below typical adult male range (13.0 - 17.0 g/dL)."],
        ["💡", "Gemini Health Copilot", "Speak your questions in English, Hindi or Telugu or attach a report photo."],
      ],
    ],
  },
  doctor: {
    records: [
      "Access records only after appropriate patient authorization.",
      [
        ["🧪", "Lab Reports", "Patient-authorized laboratory reports"],
        ["💊", "Prescriptions", "Current and previous prescriptions"],
        ["🩻", "Imaging", "Available diagnostic imaging"],
        ["💉", "Vaccinations", "Patient vaccination history"],
      ],
    ],
    encounter: [
      "Create a new patient medical encounter.",
      [
        ["📝", "Symptoms", "Record current patient symptoms"],
        ["❤️", "Vitals", "Record blood pressure, pulse and temperature"],
        ["💊", "Prescription", "Add a new prescription"],
        ["🧪", "Lab Test", "Order a laboratory test"],
      ],
    ],
    sharing: [
      "Share authorized health information securely.",
      [
        ["📋", "Medical History", "Select information to share"],
        ["🧪", "Lab Reports", "Choose laboratory records"],
        ["⏱", "Access Duration", "Set time-limited access"],
        ["🚫", "Revoke Access", "Remove access when required"],
      ],
    ],
  },
};

const PAGE_TEXT: Record<string, any> = {
  en: {
    dashboardWord: "Dashboard",
    logout: "Logout",
    footer: "SMART-MEDX • Built for India • Powered by Google Gemini AI with Multilingual Voice Copilot",
    nav: {
      patient: { dashboard: "Dashboard", doctors: "Find Doctors", records: "Medical Records", medications: "Medications", consent: "Consent Manager", ai: "AI Health Assistant", profile: "Health Profile" },
      doctor: { dashboard: "Dashboard", doctors: "Doctor Network", patients: "Patient Verification", records: "Health Records", emergencyRecords: "Emergency & Unidentified Records", encounter: "New Encounter", sharing: "Secure Sharing" },
    },
    locked: {
      title: "Patient approval needed",
      body: "Verify a patient with their mobile number and OTP first. Records stay locked until the patient approves access.",
      button: "Verify a patient",
    },
    common: {
      openRecords: "Open health records",
      startEncounter: "Start new encounter",
      verifyPatient: "Verify a patient",
      searchLabel: "Search by name or Health ID",
      showAll: (n: number) => `Show all ${n} patients`,
      showFewer: "Show fewer",
      noResult: (q: string) => `No patient found for "${q}".`,
    },
    patientDash: {
      welcomeBack: "Welcome back",
      healthIdLabel: "Unified Health ID",
      quickAccess: "Quick Access",
      voiceBannerTitle: "🎙️ Speak to your Gemini Health Copilot",
      voiceBannerSub: "Speak naturally in English, हिन्दी (Hindi), or తెలుగు (Telugu). Ask questions, attach reports, and hear answers read aloud.",
      recentRecord: "Recent Medical Record",
      currentMed: "Current Medication",
      allergyTitle: "⚠ Allergy Alert",
      allergyBody: "Penicillin allergy recorded in your health profile.",
    },
    doctorDash: {
      todaysOverview: "Today's Overview",
      verifyTitle: "📱 Verify via Patient Mobile OTP",
      verifyDesc: "Enter the patient's mobile number. An OTP is sent to the patient's mobile to approve access. Access is time-limited.",
      recentPatients: "Recent Patients",
      todaysPatients: (n: number) => `Today's Patients (${n} verified)`,
    },
  },
  hi: {
    dashboardWord: "डैशबोर्ड",
    logout: "लॉगआउट",
    footer: "SMART-MEDX • भारत के लिए निर्मित • Google Gemini AI बहुभाषी वॉयस कोपायलट",
    nav: {
      patient: { dashboard: "डैशबोर्ड", doctors: "डॉक्टर खोजें", records: "मेडिकल रिकॉर्ड", medications: "दवाइयां", consent: "सहमति प्रबंधक", ai: "AI स्वास्थ्य सहायक", profile: "स्वास्थ्य प्रोफ़ाइल" },
      doctor: { dashboard: "डैशबोर्ड", doctors: "डॉक्टर नेटवर्क", patients: "मरीज़ सत्यापन", records: "स्वास्थ्य रिकॉर्ड", emergencyRecords: "आपातकालीन और अज्ञात रिकॉर्ड", encounter: "नई एनकाउंटर", sharing: "सुरक्षित साझाकरण" },
    },
    locked: {
      title: "मरीज़ की स्वीकृति आवश्यक है",
      body: "पहले मरीज़ को उसके मोबाइल नंबर और OTP से सत्यापित करें। जब तक मरीज़ पहुंच स्वीकृत नहीं करता, रिकॉर्ड लॉक रहेंगे।",
      button: "मरीज़ को सत्यापित करें",
    },
    common: {
      openRecords: "स्वास्थ्य रिकॉर्ड खोलें",
      startEncounter: "नई एनकाउंटर शुरू करें",
      verifyPatient: "मरीज़ को सत्यापित करें",
      searchLabel: "नाम या हेल्थ ID से खोजें",
      showAll: (n: number) => `सभी ${n} मरीज़ दिखाएं`,
      showFewer: "कम दिखाएं",
      noResult: (q: string) => `"${q}" के लिए कोई मरीज़ नहीं मिला।`,
    },
    patientDash: {
      welcomeBack: "वापसी पर स्वागत है",
      healthIdLabel: "यूनिफाइड हेल्थ ID",
      quickAccess: "त्वरित पहुंच",
      voiceBannerTitle: "🎙️ अपने जेमिनी स्वास्थ्य कोपायलट से बात करें",
      voiceBannerSub: "अपनी मातृभाषा में बोलें: हिन्दी, తెలుగు या English। बोलकर प्रश्न पूछें और आवाज में उत्तर सुनें।",
      recentRecord: "हालिया मेडिकल रिकॉर्ड",
      currentMed: "मौजूदा दवा",
      allergyTitle: "⚠ एलर्जी चेतावनी",
      allergyBody: "आपकी स्वास्थ्य प्रोफ़ाइल में पेनिसिलिन से एलर्जी दर्ज है।",
    },
    doctorDash: {
      todaysOverview: "आज का अवलोकन",
      verifyTitle: "📱 मरीज़ मोबाइल OTP से सत्यापित करें",
      verifyDesc: "मरीज़ का 10 अंकों का मोबाइल नंबर दर्ज करें। OTP मरीज़ के फोन पर भेजा जाएगा। पहुंच समय-सीमित है।",
      recentPatients: "हाल के मरीज़",
      todaysPatients: (n: number) => `आज के मरीज़ (${n} सत्यापित)`,
    },
  },
  te: {
    dashboardWord: "డాష్‌బోర్డ్",
    logout: "లాగ్ అవుట్",
    footer: "SMART-MEDX • భారతదేశం కోసం రూపొందించబడింది • Google Gemini AI బహుభాషా వాయిస్ కోపైలట్",
    nav: {
      patient: { dashboard: "డాష్‌బోర్డ్", doctors: "వైద్యుల డైరెక్టరీ", records: "వైద్య రికార్డులు", medications: "మందులు", consent: "సమ్మతి నిర్వాహకుడు", ai: "AI ఆరోగ్య సహాయకుడు", profile: "ఆరోగ్య ప్రొఫైల్" },
      doctor: { dashboard: "డాష్‌బోర్డ్", doctors: "వైద్యుల నెట్‌వర్క్", patients: "రోగి ధృవీకరణ", records: "ఆరోగ్య రికార్డులు", emergencyRecords: "అత్యవసర & గుర్తించని రికార్డులు", encounter: "కొత్త ఎన్‌కౌంటర్", sharing: "సురక్షిత భాగస్వామ్యం" },
    },
    locked: {
      title: "రోగి ఆమోదం అవసరం",
      body: "మొదట రోగిని వారి మొబైల్ నంబర్ మరియు OTP తో ధృవీకరించండి. రోగి యాక్సెస్‌ను ఆమోదించే వరకు రికార్డులు లాక్‌గా ఉంటాయి.",
      button: "రోగిని ధృవీకరించండి",
    },
    common: {
      openRecords: "ఆరోగ్య రికార్డులు తెరవండి",
      startEncounter: "కొత్త ఎన్‌కౌంటర్ ప్రారంభించండి",
      verifyPatient: "రోగిని ధృవీకరించండి",
      searchLabel: "పేరు లేదా హెల్త్ ID ద్వారా వెతకండి",
      showAll: (n: number) => `మొత్తం ${n} మంది రోగులను చూపించు`,
      showFewer: "తక్కువగా చూపించు",
      noResult: (q: string) => `"${q}" కోసం ఏ రోగి కనుగొనబడలేదు.`,
    },
    patientDash: {
      welcomeBack: "తిరిగి స్వాగతం",
      healthIdLabel: "యూనిఫైడ్ హెల్త్ ID",
      quickAccess: "త్వరిత యాక్సెస్",
      voiceBannerTitle: "🎙️ మీ జెమిని హెల్త్ కోపైలట్‌తో మాట్లాడండి",
      voiceBannerSub: "మీ స్వంత భాషలో మాట్లాడండి: తెలుగు, हिन्दी లేదా English. మాట్లాడి అడగండి, తెలుగులోనే సమాధానాలు వినండి.",
      recentRecord: "ఇటీవలి వైద్య రికార్డ్",
      currentMed: "ప్రస్తుత మందు",
      allergyTitle: "⚠ అలర్జీ హెచ్చరిక",
      allergyBody: "మీ ఆరోగ్య ప్రొఫైల్‌లో పెన్సిలిన్ అలర్జీ నమోదు చేయబడింది.",
    },
    doctorDash: {
      todaysOverview: "నేటి అవలోకనం",
      verifyTitle: "📱 రోగి మొబైల్ OTP తో ధృవీకరించండి",
      verifyDesc: "రోగి మొబైల్ నంబర్ నమోదు చేయండి. OTP రోగి మొబైల్‌కు వెళుతుంది. యాక్సెస్ సమయ-పరిమితం.",
      recentPatients: "ఇటీవలి రోగులు",
      todaysPatients: (n: number) => `నేటి రోగులు (${n} ధృవీకరించబడ్డారు)`,
    },
  },
};

const AUTH_LANGS = [
  ["en", "English"],
  ["hi", "हिन्दी"],
  ["te", "తెలుగు"],
];

const AUTH_TEXT: Record<string, any> = {
  en: {
    welcome: "Welcome to SMART-MEDX",
    welcomeSub: "Select your role to continue",
    security: "Secure healthcare portal powered by SMART-MEDX & Google Gemini AI",
    back: "Back to role selection",
    roleTitle: { patient: "Patient", doctor: "Doctor / Hospital Staff" },
    roleSub: { patient: "Mobile OTP / Email / Google Sign-in", doctor: "Professional Login (HPR ID)" },
    heading: { patient: "Patient Access", doctor: "Doctor / Hospital Staff" },
    tagline: {
      patient: "Sign in or create account to manage records and voice assistant",
      doctor: "Healthcare professional login",
    },
    loginTab: "Log In",
    signupTab: "Sign Up / Register",
    viaMobile: "📱 Mobile & OTP",
    viaEmail: "✉️ Email & Password",
    orContinue: "or continue with",
    continueGoogle: "Continue with Google",
    mobileLabel: "Mobile Number",
    mobilePlaceholder: "10-digit mobile number",
    sendOtp: "Send OTP",
    enterOtp: "Enter 6-digit OTP",
    verifyLogin: "Verify OTP & Log In",
    verifySignup: "Verify OTP & Create Account",
    changeMobile: "Change mobile number",
    emailLabel: "Email Address",
    passwordLabel: "Password",
    nameLabel: "Full Name",
    confirmPasswordLabel: "Confirm Password",
    loginBtn: "Log In",
    createAccountBtn: "Create Patient Account",
    demoOtp: "Demo prototype: enter any 10-digit number; any 6-digit OTP works.",
    demoFields: "Demo prototype: enter any test credentials.",
    showPassword: "Show password",
    hidePassword: "Hide password",
    fields: { pid: "Professional ID (HPR)", hid: "Hospital ID (HFR)", pin: "PIN" },
    desc: {
      patient: "Manage your unified health information & voice assistant",
      doctor: "Access authorized patient healthcare information",
    },
  },
  hi: {
    welcome: "SMART-MEDX में आपका स्वागत है",
    welcomeSub: "जारी रखने के लिए अपनी भूमिका चुनें",
    security: "SMART-MEDX और Google Gemini AI द्वारा सुरक्षित स्वास्थ्य सेवा",
    back: "भूमिका चयन पर वापस जाएं",
    roleTitle: { patient: "मरीज़", doctor: "डॉक्टर / अस्पताल स्टाफ" },
    roleSub: { patient: "मोबाइल OTP / ईमेल / गूगल साइन-इन", doctor: "व्यावसायिक लॉगिन" },
    heading: { patient: "मरीज़ पोर्टल", doctor: "डॉक्टर / अस्पताल स्टाफ" },
    tagline: {
      patient: "स्वास्थ्य रिकॉर्ड और वॉयस कोपायलट के लिए लॉगिन या खाता बनाएं",
      doctor: "स्वास्थ्य सेवा पेशेवर लॉगिन",
    },
    loginTab: "लॉग इन",
    signupTab: "नया खाता बनाएं (साइन अप)",
    viaMobile: "📱 मोबाइल और OTP",
    viaEmail: "✉️ ईमेल और पासवर्ड",
    orContinue: "या इसके साथ जारी रखें",
    continueGoogle: "Google के साथ जारी रखें",
    mobileLabel: "मोबाइल नंबर",
    mobilePlaceholder: "10 अंकों का मोबाइल नंबर",
    sendOtp: "OTP भेजें",
    enterOtp: "6 अंकों का OTP दर्ज करें",
    verifyLogin: "OTP सत्यापित करें और लॉग इन करें",
    verifySignup: "OTP सत्यापित करें और खाता बनाएं",
    changeMobile: "मोबाइल नंबर बदलें",
    emailLabel: "ईमेल पता",
    passwordLabel: "पासवर्ड",
    nameLabel: "पूरा नाम",
    confirmPasswordLabel: "पासवर्ड की पुष्टि करें",
    loginBtn: "लॉग इन करें",
    createAccountBtn: "मरीज़ खाता बनाएं",
    demoOtp: "डेमो प्रोटोटाइप: कोई भी 10 अंकों का नंबर और 6 अंकों का OTP स्वीकार्य है।",
    demoFields: "डेमो प्रोटोटाइप: कोई भी मान दर्ज करें।",
    showPassword: "पासवर्ड दिखाएं",
    hidePassword: "पासवर्ड छिपाएं",
    fields: { pid: "व्यावसायिक ID (HPR)", hid: "अस्पताल ID (HFR)", pin: "पिन" },
    desc: {
      patient: "अपनी एकीकृत स्वास्थ्य जानकारी और वॉयस सहायक प्रबंधित करें",
      doctor: "अधिकृत मरीज़ स्वास्थ्य जानकारी तक पहुंचें",
    },
  },
  te: {
    welcome: "SMART-MEDX కు స్వాగతం",
    welcomeSub: "కొనసాగించడానికి మీ పాత్రను ఎంచుకోండి",
    security: "SMART-MEDX మరియు Google Gemini AI ద్వారా సురక్షిత ఆరోగ్య సేవ",
    back: "పాత్ర ఎంపికకు తిరిగి వెళ్ళండి",
    roleTitle: { patient: "రోగి", doctor: "డాక్టర్ / హాస్పిటల్ సిబ్బంది" },
    roleSub: { patient: "మొబైల్ OTP / ఈమెయిల్ / గూగుల్ లాగిన్", doctor: "ప్రొఫెషనల్ లాగిన్" },
    heading: { patient: "రోగి పోర్టల్", doctor: "డాక్టర్ / హాస్పిటల్ సిబ్బంది" },
    tagline: {
      patient: "వైద్య రికార్డులు మరియు వాయిస్ కోపైలట్ కోసం లాగిన్ అవ్వండి లేదా ఖాతా తెరవండి",
      doctor: "ఆరోగ్య సంరక్షణ నిపుణుల లాగిన్",
    },
    loginTab: "లాగిన్ అవ్వండి",
    signupTab: "ఖాతా సృష్టించండి (సైన్ అప్)",
    viaMobile: "📱 మొబైల్ & OTP",
    viaEmail: "✉️ ఈమెయిల్ & పాస్‌వర్డ్",
    orContinue: "లేదా దీనితో కొనసాగించండి",
    continueGoogle: "Google తో కొనసాగించండి",
    mobileLabel: "మొబైల్ నంబర్",
    mobilePlaceholder: "10 అంకెల మొబైల్ నంబర్",
    sendOtp: "OTP పంపండి",
    enterOtp: "6 అంకెల OTP నమోదు చేయండి",
    verifyLogin: "OTP ధృవీకరించి లాగిన్ అవ్వండి",
    verifySignup: "OTP ధృవీకరించి ఖాతా సృష్టించండి",
    changeMobile: "మొబైల్ నంబర్ మార్చండి",
    emailLabel: "ఈమెయిల్ చిరునామా",
    passwordLabel: "పాస్‌వర్డ్",
    nameLabel: "పూర్తి పేరు",
    confirmPasswordLabel: "పాస్‌వర్డ్ నిర్ధారణ",
    loginBtn: "లాగిన్",
    createAccountBtn: "ఖాతా సృష్టించండి",
    demoOtp: "డెమో ప్రోటోటైప్: ఏదైనా 10 అంకెల నంబర్ మరియు 6 అంకెల OTP పనిచేస్తుంది.",
    demoFields: "డెమో ప్రోటోటైప్: ఏవైనా వివరాలు నమోదు చేయవచ్చు.",
    showPassword: "పాస్‌వర్డ్ చూపించు",
    hidePassword: "పాస్‌వర్డ్ దాచు",
    fields: { pid: "ప్రొఫెషనల్ ID (HPR)", hid: "హాస్పిటల్ ID (HFR)", pin: "పిన్" },
    desc: {
      patient: "మీ యూనిఫైడ్ ఆరోగ్య సమాచారం మరియు వాయిస్ అసిస్టెంట్ నిర్వహించండి",
      doctor: "అధీకృత రోగి ఆరోగ్య సమాచారాన్ని యాక్సెస్ చేయండి",
    },
  },
};

function RoleIcon({ role }: { role: string }) {
  const r = ROLES[role];
  if (!r) return null;
  return r.Icon ? <r.Icon /> : <>{r.icon}</>;
}

function Logo() {
  return (
    <div className="logo">
      <Ico className="logo-icon">✚</Ico>
      <div>
        <strong className="logo-name">SMART-MEDX</strong>
        <p>National Public Health Portal &amp; AI Copilot</p>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  error,
  as: Tag = "input",
  showPasswordLabel = "Show password",
  hidePasswordLabel = "Hide password",
  ...props
}: any) {
  const [reveal, setReveal] = useState(false);
  const isPassword = props.type === "password";

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className={isPassword ? "field-with-toggle" : undefined}>
        <Tag
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          {...props}
          {...(isPassword ? { type: reveal ? "text" : "password" } : null)}
        />
        {isPassword && (
          <button
            type="button"
            className="pw-toggle"
            aria-label={reveal ? hidePasswordLabel : showPasswordLabel}
            aria-pressed={reveal}
            onClick={() => setReveal(!reveal)}
          >
            <EyeIcon visible={reveal} />
          </button>
        )}
      </div>
      {error && (
        <p className="field-error" id={`${id}-err`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function DigitBoxes({ id, label, groups, value, onChange, error, otp = false, autoFocus = false }: any) {
  const total = groups.reduce((a: number, b: number) => a + b, 0);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const focusBox = (i: number) => {
    const el = refs.current[Math.max(0, Math.min(i, total - 1))];
    if (el) el.focus();
  };

  useEffect(() => {
    if (autoFocus) focusBox(0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) return;
    const d = raw.length > 1 ? raw.replace(value[i] || "", "").slice(0, 1) || raw.slice(-1) : raw;
    const next = i < value.length ? value.slice(0, i) + d + value.slice(i + 1) : value + d;
    onChange(next.slice(0, total));
    focusBox(i + 1);
  };

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const t = i < value.length ? i : value.length - 1;
      if (t >= 0) {
        onChange(value.slice(0, t) + value.slice(t + 1));
        focusBox(t);
      }
    } else if (e.key === "Delete") {
      e.preventDefault();
      if (i < value.length) onChange(value.slice(0, i) + value.slice(i + 1));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusBox(i - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusBox(Math.min(i + 1, value.length));
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, total);
    if (!digits) return;
    onChange(digits);
    focusBox(digits.length);
  };

  let start = 0;
  return (
    <div className="digit-field">
      <span className="box-label" id={`${id}-label`}>{label}</span>

      <div
        className="digit-groups"
        role="group"
        aria-labelledby={`${id}-label`}
        aria-describedby={error ? `${id}-err` : undefined}
      >
        {groups.map((g: number, gi: number) => {
          const s = start;
          start += g;
          return (
            <div className="digit-group" key={gi}>
              {Array.from({ length: g }, (_, k) => {
                const i = s + k;
                return (
                  <input
                    key={i}
                    ref={(el) => {
                      refs.current[i] = el;
                    }}
                    className={value[i] ? "digit-box filled" : "digit-box"}
                    type="text"
                    inputMode="numeric"
                    autoComplete={otp && i === 0 ? "one-time-code" : "off"}
                    aria-label={`${label}, digit ${i + 1} of ${total}`}
                    aria-invalid={!!error}
                    value={value[i] || ""}
                    onChange={(e) => handleChange(i, e)}
                    onKeyDown={(e) => handleKey(i, e)}
                    onPaste={handlePaste}
                    onFocus={(e) => {
                      if (i > value.length) focusBox(value.length);
                      else e.target.select();
                    }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>

      {error && (
        <p className="field-error" id={`${id}-err`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function StatCard({ icon, title, text, onClick, active }: any) {
  const inner = (
    <>
      <Ico className="stat-icon">{icon}</Ico>
      <h3>{title}</h3>
      <p>{text}</p>
    </>
  );
  return onClick ? (
    <button
      type="button"
      className={active ? "stat-card clickable active" : "stat-card clickable"}
      aria-expanded={active === undefined ? undefined : active}
      onClick={onClick}
    >
      {inner}
    </button>
  ) : (
    <div className="stat-card">{inner}</div>
  );
}

function Banner({ variant, hello, name, meta, status }: any) {
  return (
    <section className={`welcome-banner ${variant || ""}`}>
      <div>
        <p>{hello}</p>
        <h2 className="banner-name">{name}</h2>
        <span>{meta}</span>
      </div>
      <div className="health-status">
        <Ico className="dot">●</Ico> {status}
      </div>
    </section>
  );
}

function GovStrip({ size, setSize, contrast, setContrast }: any) {
  const skip = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById("main");
    if (el) el.focus();
  };

  return (
    <>
      <a href="#main" className="skip-link" onClick={skip}>
        Skip to main content
      </a>
      <div className="gov-strip">
        <div className="gov-left">
          <Ico>🇮🇳</Ico>
          <span lang="hi">भारत सरकार</span>
          <span className="gov-sep">|</span>
          <span>Government of India</span>
          <span className="gov-ministry">Ministry of Health &amp; Family Welfare</span>
        </div>

        <div className="gov-tools" role="group" aria-label="Accessibility tools">
          <button
            type="button"
            aria-label="Decrease text size"
            disabled={size === 0}
            onClick={() => setSize(size - 1)}
          >
            A-
          </button>
          <button
            type="button"
            aria-label="Default text size"
            onClick={() => setSize(1)}
          >
            A
          </button>
          <button
            type="button"
            aria-label="Increase text size"
            disabled={size === 2}
            onClick={() => setSize(size + 1)}
          >
            A+
          </button>
          <button
            type="button"
            aria-pressed={contrast}
            onClick={() => setContrast(!contrast)}
          >
            ◐ Contrast
          </button>
        </div>
      </div>
    </>
  );
}

function LangBar({ lang, setLang }: { lang: string; setLang: (l: string) => void }) {
  return (
    <div className="lang-bar" role="group" aria-label="Choose language">
      {AUTH_LANGS.map(([code, label]) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={lang === code}
          className={lang === code ? "on" : ""}
          onClick={() => setLang(code)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function RoleSelection({ onSelect, lang, setLang }: any) {
  return (
    <div className="auth-page" id="main" tabIndex={-1}>
      <div className="auth-card role-card">
        <Logo />
        <LangBar lang={lang} setLang={setLang} />

        <div className="welcome">
          <h1>{AUTH_TEXT[lang].welcome}</h1>
          <p>{AUTH_TEXT[lang].welcomeSub}</p>
        </div>

        <div className="role-grid">
          {Object.keys(ROLES).map((key) => (
            <button
              key={key}
              type="button"
              className="role-option"
              onClick={() => onSelect(key)}
            >
              <Ico className={`role-icon ${key}-icon`}>
                <RoleIcon role={key} />
              </Ico>
              <div>
                <h2 lang={lang}>{AUTH_TEXT[lang].roleTitle[key]}</h2>
                <p lang={lang}>{AUTH_TEXT[lang].roleSub[key]}</p>
              </div>
              <Ico className="chev">›</Ico>
            </button>
          ))}
        </div>

        <div className="security-note" lang={lang}>
          <Ico>🔒</Ico> {AUTH_TEXT[lang].security}
        </div>
      </div>
    </div>
  );
}

function AuthShell({ role, onBack, lang, children }: any) {
  const t = AUTH_TEXT[lang];
  return (
    <div className="auth-page" id="main" tabIndex={-1}>
      <div className="auth-card login-card">
        <button type="button" className="back-btn" onClick={onBack}>
          ← {t.back}
        </button>

        <Logo />

        <div className="login-title" lang={lang}>
          <Ico className="big-role-icon">
            <RoleIcon role={role} />
          </Ico>
          <h1>{t.heading[role]}</h1>
          <p>{t.tagline[role]}</p>
        </div>

        {children}
      </div>
    </div>
  );
}

/* =========================
   PATIENT AUTH: Mobile + OTP, Email + Password & Google (Login & Sign Up)
========================= */
function PatientAuth({ onBack, onLogin, lang, setPatientProfile }: any) {
  const t = AUTH_TEXT[lang];
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [method, setMethod] = useState<"mobile" | "email">("mobile");

  // Mobile OTP state
  const [mobile, setMobile] = useState("");
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState("");

  // Email/Password state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");

  const resetMethod = (newMethod: "mobile" | "email") => {
    setMethod(newMethod);
    setOtpMode(false);
    setOtp("");
    setError("");
  };

  const syncPatientToBackend = async (data: any) => {
    try {
      await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      await savePatientToFirestore(data);
    } catch (err) {
      console.warn("Backend patient sync notice:", err);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setError("");
      const res = await signInWithGoogle();
      if (res?.user) {
        const googleUser = {
          uid: res.user.uid,
          id: res.user.uid,
          name: res.user.displayName || "E. Sai Charan",
          email: res.user.email || "esr272007@gmail.com",
          phone: res.user.phoneNumber || "9876543210",
          authMethod: "google",
          authProvider: "Google",
        };
        await syncPatientToBackend(googleUser);
        if (setPatientProfile) setPatientProfile(googleUser);
        onLogin(googleUser);
      } else if (res?.cancelled) {
        setError("Google sign-in was closed or cancelled. You can sign in with Mobile OTP, Email, or test Demo mode.");
      } else {
        // Fallback demo account for smooth preview testing
        const fallbackUser = {
          uid: "usr-google-demo",
          id: "usr-google-demo",
          name: "E. Sai Charan",
          email: "esr272007@gmail.com",
          phone: "9876543210",
          authMethod: "google",
          authProvider: "Google",
        };
        await syncPatientToBackend(fallbackUser);
        if (setPatientProfile) setPatientProfile(fallbackUser);
        onLogin(fallbackUser);
      }
    } catch (err: any) {
      console.warn("Firebase Google auth notice, falling back smoothly:", err);
      const fallbackUser = {
        uid: "usr-google-demo",
        id: "usr-google-demo",
        name: "E. Sai Charan",
        email: "esr272007@gmail.com",
        phone: "9876543210",
        authMethod: "google",
        authProvider: "Google",
      };
      await syncPatientToBackend(fallbackUser);
      if (setPatientProfile) setPatientProfile(fallbackUser);
      onLogin(fallbackUser);
    }
  };

  const handleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = mobile.replace(/\D/g, "");

    if (mode === "signup" && !name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!otpMode) {
      if (digits.length !== 10) {
        setError("Enter a valid 10-digit Indian mobile number.");
        return;
      }
      setError("");
      setOtpMode(true);
      return;
    }

    if (otp.length !== 6) {
      setError("Enter the 6-digit OTP sent to your phone (Demo: 123456).");
      return;
    }

    const patientData = {
      uid: `pt-mob-${digits}`,
      id: `pt-mob-${digits}`,
      name: name.trim() || "E. Sai Charan",
      phone: digits,
      authMethod: "mobile_otp",
      authProvider: "Mobile OTP",
    };
    await syncPatientToBackend(patientData);
    if (setPatientProfile) setPatientProfile(patientData);
    onLogin(patientData);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup" && !name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      if (mode === "signup") {
        await signUpWithEmail(email.trim(), password, name.trim()).catch(() => null);
      } else {
        await loginWithEmail(email.trim(), password).catch(() => null);
      }
    } catch (authErr) {
      console.warn("Firebase email auth notice:", authErr);
    }

    const patientData = {
      uid: `pt-em-${email.replace(/[^a-zA-Z0-9]/g, "_")}`,
      id: `pt-em-${email.replace(/[^a-zA-Z0-9]/g, "_")}`,
      name: name.trim() || email.split("@")[0],
      email: email.trim(),
      authMethod: "email",
      authProvider: "Email & Password",
    };
    await syncPatientToBackend(patientData);
    if (setPatientProfile) setPatientProfile(patientData);
    onLogin(patientData);
  };

  return (
    <AuthShell role="patient" onBack={onBack} lang={lang}>
      {/* Login vs Sign Up top toggle */}
      <div className="auth-mode-tabs" role="tablist" aria-label="Authentication Mode">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          className={`auth-mode-tab ${mode === "login" ? "active" : ""}`}
          onClick={() => {
            setMode("login");
            setOtpMode(false);
            setError("");
          }}
        >
          {t.loginTab}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          className={`auth-mode-tab ${mode === "signup" ? "active" : ""}`}
          onClick={() => {
            setMode("signup");
            setOtpMode(false);
            setError("");
          }}
        >
          {t.signupTab}
        </button>
      </div>

      {/* One-Tap Continue with Google */}
      <button
        type="button"
        className="google-auth-btn"
        onClick={handleGoogleAuth}
        title={mode === "login" ? "Sign in with Google" : "Sign up with Google"}
      >
        <GoogleIcon />
        <span>{mode === "login" ? t.continueGoogle : `Sign up with Google`}</span>
      </button>

      <div className="auth-divider">
        <span>{t.orContinue}</span>
      </div>

      {/* Method selector: Mobile OTP vs Email/Password */}
      <div className="auth-method-pills">
        <button
          type="button"
          className={`method-pill ${method === "mobile" ? "active" : ""}`}
          onClick={() => resetMethod("mobile")}
        >
          {t.viaMobile}
        </button>
        <button
          type="button"
          className={`method-pill ${method === "email" ? "active" : ""}`}
          onClick={() => resetMethod("email")}
        >
          {t.viaEmail}
        </button>
      </div>

      {/* Mobile Number + OTP Form */}
      {method === "mobile" && (
        <form onSubmit={handleMobileSubmit} noValidate>
          {mode === "signup" && !otpMode && (
            <Field
              id="patient-name"
              label={t.nameLabel}
              type="text"
              placeholder="e.g. Sai Charan"
              value={name}
              onChange={(e: any) => setName(e.target.value)}
            />
          )}

          {!otpMode ? (
            <Field
              id="patient-mobile"
              label={t.mobileLabel}
              type="text"
              inputMode="numeric"
              placeholder={t.mobilePlaceholder}
              maxLength={10}
              value={mobile}
              error={error}
              onChange={(e: any) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
            />
          ) : (
            <>
              <div className="otp-info" role="status">
                OTP sent to +91 {mobile}.
              </div>
              <DigitBoxes
                id="patient-otp"
                label={t.enterOtp}
                groups={[6]}
                otp
                autoFocus
                value={otp}
                onChange={setOtp}
                error={error}
              />
            </>
          )}

          <button className="primary-btn" type="submit">
            {otpMode
              ? mode === "login"
                ? t.verifyLogin
                : t.verifySignup
              : t.sendOtp}
          </button>

          {otpMode && (
            <button
              type="button"
              className="text-btn"
              onClick={() => {
                setOtpMode(false);
                setOtp("");
                setError("");
              }}
            >
              {t.changeMobile}
            </button>
          )}
        </form>
      )}

      {/* Email + Password Form */}
      {method === "email" && (
        <form onSubmit={handleEmailSubmit} noValidate>
          {mode === "signup" && (
            <Field
              id="email-name"
              label={t.nameLabel}
              type="text"
              placeholder="e.g. Sai Charan"
              value={name}
              onChange={(e: any) => setName(e.target.value)}
            />
          )}

          <Field
            id="patient-email"
            label={t.emailLabel}
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e: any) => setEmail(e.target.value)}
          />

          <Field
            id="patient-password"
            label={t.passwordLabel}
            type="password"
            placeholder="••••••••"
            value={password}
            showPasswordLabel={t.showPassword}
            hidePasswordLabel={t.hidePassword}
            onChange={(e: any) => setPassword(e.target.value)}
          />

          {mode === "signup" && (
            <Field
              id="patient-confirm-password"
              label={t.confirmPasswordLabel}
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              showPasswordLabel={t.showPassword}
              hidePasswordLabel={t.hidePassword}
              onChange={(e: any) => setConfirmPassword(e.target.value)}
            />
          )}

          {error && <p className="field-error" role="alert">{error}</p>}

          <button className="primary-btn" type="submit">
            {mode === "login" ? t.loginBtn : t.createAccountBtn}
          </button>
        </form>
      )}

      {/* Switch between Login and Sign Up */}
      <div style={{ marginTop: 16, textAlign: "center" }}>
        <button
          type="button"
          className="text-btn"
          style={{ marginTop: 0 }}
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setOtpMode(false);
            setOtp("");
            setError("");
          }}
        >
          {mode === "login"
            ? (lang === "te" ? "కొత్త రోగి ఖాతా కావాలా? ఇక్కడ సైన్ అప్ చేయండి" : lang === "hi" ? "नया मरीज़ खाता चाहिए? यहाँ साइन अप करें" : "New to SMART-MEDX? Create an account (Sign Up)")
            : (lang === "te" ? "ఇప్పటికే ఖాతా ఉందా? ఇక్కడ లాగిన్ అవ్వండి" : lang === "hi" ? "पहले से खाता है? यहाँ लॉग इन करें" : "Already have an account? Log In")}
        </button>
      </div>

      <p className="demo-note">
        {method === "mobile"
          ? (lang === "te"
              ? "💡 డెమో: ఏదైనా 10 అంకెల నంబర్ నమోదు చేయండి, OTP: 123456 వాడండి."
              : lang === "hi"
              ? "💡 डेमो: कोई भी 10 अंकों का नंबर और OTP: 123456 उपयोग करें।"
              : "💡 Demo: Enter any 10-digit number & use OTP: 123456 (or click 'Continue with Google')")
          : t.demoFields}
      </p>
    </AuthShell>
  );
}

function LoginForm({ role, onBack, onLogin, lang }: any) {
  const t = AUTH_TEXT[lang];
  const fields = LOGIN_FIELDS[role];
  const [vals, setVals] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    fields.forEach(([key, label]) => {
      if (!(vals[key] || "").trim()) err[key] = `${t.fields[key] || label} is required.`;
    });
    setErrors(err);
    if (!Object.keys(err).length) onLogin();
  };

  return (
    <AuthShell role={role} onBack={onBack} lang={lang}>
      <form onSubmit={submit} noValidate>
        {fields.map(([key, label, type]) => {
          const shownLabel = t.fields[key] || label;
          return (
            <Field
              key={key}
              id={`${role}-${key}`}
              label={shownLabel}
              type={type}
              placeholder={`Enter ${shownLabel}`}
              value={vals[key] || ""}
              error={errors[key]}
              showPasswordLabel={t.showPassword}
              hidePasswordLabel={t.hidePassword}
              onChange={(e: any) => setVals({ ...vals, [key]: e.target.value })}
            />
          );
        })}

        <button className="primary-btn" type="submit" lang={lang}>
          {t.login}
        </button>
      </form>

      <p className="demo-note" lang={lang}>{t.demoFields}</p>
    </AuthShell>
  );
}

function Sidebar({ role, page, setPage, logout, open, onClose, lang }: any) {
  return (
    <>
      {open && <div className="overlay" onClick={onClose} aria-hidden="true" />}

      <aside className={open ? "sidebar open" : "sidebar"}>
        <Logo />

        <div className="role-badge">
          <Ico className="badge-icon">
            <RoleIcon role={role} />
          </Ico>
          {ROLES[role].badge.replace(/^\S+\s/, "")}
        </div>

        <nav aria-label="Main navigation">
          {NAV[role].map(([id, icon]) => (
            <button
              key={id}
              type="button"
              className={page === id ? "nav-item active" : "nav-item"}
              aria-current={page === id ? "page" : undefined}
              lang={lang}
              onClick={() => {
                setPage(id);
                onClose();
              }}
            >
              <Ico>{icon}</Ico>
              {PAGE_TEXT[lang].nav[role][id]}
            </button>
          ))}
        </nav>

        <button type="button" className="logout-btn" lang={lang} onClick={logout}>
          ↪ {PAGE_TEXT[lang].logout}
        </button>
      </aside>
    </>
  );
}

function TopBar({ role, title, onMenu, lang, onVoiceOpen, userName }: any) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="menu-btn"
          aria-label="Open navigation menu"
          onClick={onMenu}
        >
          ☰
        </button>
        <div>
          <h1 lang={lang}>{title}</h1>
          <p lang={lang}>{AUTH_TEXT[lang].desc[role]}</p>
        </div>
      </div>

      <div className="topbar-right">
        {role === "patient" && (
          <button
            type="button"
            className="topbar-voice-btn"
            aria-label="Speak to Health Copilot"
            onClick={onVoiceOpen}
            title="Tap to speak to Gemini Health Copilot in your language"
          >
            <MicIcon />
            <span>Speak to Copilot</span>
          </button>
        )}
        <div className="top-user">{userName || (role === "doctor" ? "Dr. A. Sharma" : "E. Sai Charan")}</div>
      </div>
    </header>
  );
}

const BLANK_CONTACT = {
  mobile: "9876543210",
  ecName: "R. Lakshmi",
  ecPhone: "9876500001",
  ec2Name: "K. Prasad",
  ec2Phone: "9876511112",
  ec2Rel: "Parent",
};

const isTenDigitPhone = (v: string) => /^\d{10}$/.test((v || "").replace(/\D/g, ""));

function ContactEmergencyCard({ data, setData }: any) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const startEdit = () => {
    setDraft(data);
    setErrors({});
    setEditing(true);
  };

  const cancel = () => {
    setDraft(data);
    setErrors({});
    setEditing(false);
  };

  const set = (k: string) => (e: any) => setDraft({ ...draft, [k]: e.target.value });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!isTenDigitPhone(draft.mobile)) err.mobile = "Enter a valid 10-digit mobile number.";
    if (!draft.ecName.trim()) err.ecName = "Enter the primary emergency contact's name.";
    if (!isTenDigitPhone(draft.ecPhone)) err.ecPhone = "Enter a valid 10-digit mobile number.";
    if (draft.ec2Name.trim() && !isTenDigitPhone(draft.ec2Phone)) {
      err.ec2Phone = "Enter a valid 10-digit mobile number, or clear the secondary contact's name.";
    }
    setErrors(err);
    if (Object.keys(err).length) return;
    setData(draft);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="generic-card contact-card">
        <div className="contact-card-head">
          <h2>📞 Contact &amp; Emergency Details</h2>
          <button type="button" className="secondary-btn small-btn" onClick={startEdit}>
            ✎ Edit
          </button>
        </div>

        <dl className="summary-list">
          <div>
            <dt>Primary mobile number</dt>
            <dd>{data.mobile}</dd>
          </div>
          <div>
            <dt>Primary emergency contact</dt>
            <dd>{data.ecName} • {data.ecPhone}</dd>
          </div>
          <div>
            <dt>Secondary emergency contact</dt>
            <dd>
              {data.ec2Name
                ? `${data.ec2Name} • ${data.ec2Phone} • ${data.ec2Rel}`
                : "Not added"}
            </dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <form className="generic-card contact-card" onSubmit={save} noValidate>
      <div className="contact-card-head">
        <h2>📞 Contact &amp; Emergency Details</h2>
      </div>

      <Field
        id="cd-mobile"
        label="Primary mobile number"
        inputMode="numeric"
        maxLength={10}
        value={draft.mobile}
        error={errors.mobile}
        onChange={set("mobile")}
      />

      <h3 className="contact-subhead">Primary emergency contact</h3>
      <div className="grid-2">
        <Field id="cd-ecname" label="Name" value={draft.ecName} error={errors.ecName} onChange={set("ecName")} />
        <Field
          id="cd-ecphone"
          label="Phone number"
          inputMode="numeric"
          maxLength={10}
          value={draft.ecPhone}
          error={errors.ecPhone}
          onChange={set("ecPhone")}
        />
      </div>

      <h3 className="contact-subhead">Secondary emergency contact (optional)</h3>
      <div className="grid-3">
        <Field id="cd-ec2name" label="Name" value={draft.ec2Name} onChange={set("ec2Name")} />
        <Field
          id="cd-ec2phone"
          label="Phone number"
          inputMode="numeric"
          maxLength={10}
          value={draft.ec2Phone}
          error={errors.ec2Phone}
          onChange={set("ec2Phone")}
        />
        <div className="field">
          <label htmlFor="cd-ec2rel">Relationship</label>
          <select id="cd-ec2rel" value={draft.ec2Rel} onChange={set("ec2Rel")}>
            {["Spouse", "Parent", "Sibling", "Child", "Friend", "Other"].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="action-row">
        <button type="submit" className="primary-btn small-btn">💾 Save</button>
        <button type="button" className="secondary-btn" onClick={cancel}>Cancel</button>
      </div>
    </form>
  );
}

function PatientDashboard({ goTo, onAssistant, onStartVoice, lang, contact, setContact, userName }: any) {
  const t = PAGE_TEXT[lang].patientDash;
  return (
    <>
      <Banner
        hello={t.welcomeBack}
        name={userName || "E. Sai Charan"}
        meta={`${t.healthIdLabel}: MEDX-9988-7766`}
        status="Health Profile Active"
      />

      {/* Voice Assistant Interactive Hero Card */}
      <section className="voice-hero-card" role="region" aria-label="Voice Health Copilot">
        <div className="voice-hero-left">
          <button
            type="button"
            className="voice-big-mic-btn"
            onClick={onStartVoice}
            aria-label="Tap to speak to Gemini Copilot in your language"
            title="Tap to start speaking in your language"
          >
            <MicIcon />
            <span className="voice-pulse-ring" />
          </button>
          <div>
            <h3>{t.voiceBannerTitle}</h3>
            <p>{t.voiceBannerSub}</p>
          </div>
        </div>
        <div className="voice-hero-actions">
          <button type="button" className="voice-action-btn speak-btn" onClick={onStartVoice}>
            {lang === "te"
              ? "🎙️ తెలుగులో మాట్లాడండి"
              : lang === "hi"
              ? "🎙️ हिन्दी में बोलें"
              : "🎙️ Speak to Copilot"}
          </button>
          <button type="button" className="voice-action-btn open-btn" onClick={onAssistant}>
            {lang === "te"
              ? "💬 చాట్ & రిపోర్ట్ జత చేయండి"
              : lang === "hi"
              ? "💬 चैट और रिपोर्ट जोड़ें"
              : "💬 Chat & Attach Reports"}
          </button>
        </div>
      </section>

      <div className="alert-card" role="note" lang={lang}>
        <strong>{t.allergyTitle}</strong>
        <p>{t.allergyBody}</p>
      </div>

      <ContactEmergencyCard data={contact} setData={setContact} />

      <h2 className="section-title" lang={lang}>{t.quickAccess}</h2>

      <div className="stats-grid patient-stats-grid">
        <StatCard icon="👨‍⚕️" title="Verified Doctors" text="Browse & Book" onClick={() => goTo("doctors")} />
        <StatCard icon="📋" title="Medical Records" text="12 records" onClick={() => goTo("records")} />
        <StatCard icon="💊" title="Medications" text="2 active" onClick={() => goTo("medications")} />
        <StatCard icon="🔐" title="Consent" text="2 active requests" onClick={() => goTo("consent")} />
        <StatCard icon={<AssistantIcon />} title="Voice Copilot" text="Speak & listen" onClick={onStartVoice} />
      </div>

      <h2 className="section-title" lang={lang}>{t.recentRecord}</h2>

      <div className="record-card">
        <Ico className="record-icon">🧪</Ico>
        <div className="record-info">
          <h3>Blood Test (CBC)</h3>
          <p>Apollo Hospitals • 18 Sep 2026</p>
          <span>Dr. A. Sharma • Hemoglobin: 11.5 g/dL</span>
        </div>
        <button type="button" className="secondary-btn small-btn" onClick={onAssistant}>
          Explain with Copilot
        </button>
      </div>

      <div className="medication-card">
        <h3 lang={lang}>
          <Ico>💊</Ico> {t.currentMed}
        </h3>
        <strong>Azithromycin 500mg</strong>
        <p>Once daily • 3 days remaining</p>
        <span className="status-badge">✓ No allergy conflict found</span>
      </div>
    </>
  );
}

function PatientProfile({ contact, goTo, userName }: any) {
  const second = contact.ec2Name
    ? `${contact.ec2Name} • ${contact.ec2Phone} • ${contact.ec2Rel}`
    : "Not added";
  return (
    <>
      <GenericPage
        description="Your unified health information."
        items={[
          ["🪪", "Health ID", "MEDX-9988-7766"],
          ["👤", "Patient Name", userName || "E. Sai Charan"],
          ["🎂", "Age", "28 years"],
          ["🩸", "Blood Group", "B+"],
          ["⚠", "Allergy", "Penicillin"],
          ["📱", "Primary mobile number", contact.mobile],
          ["📞", "Emergency Contact (primary)", `${contact.ecName} • ${contact.ecPhone}`],
          ["📞", "Emergency Contact (secondary)", second],
        ]}
      />
      <button type="button" className="secondary-btn show-all" onClick={() => goTo("dashboard")}>
        ✎ Edit contact details
      </button>
    </>
  );
}

function ConsentManager() {
  const [items, setItems] = useState([
    { id: 1, icon: "👨‍⚕️", name: "Dr. R. K. Patel", scope: "Medical History + Lab Reports", active: true },
    { id: 2, icon: "🏥", name: "City Care Hospital", scope: "Temporary access • 2 hours", active: true },
  ]);

  const toggle = (id: number) =>
    setItems(items.map((i) => (i.id === id ? { ...i, active: !i.active } : i)));

  return (
    <div className="generic-card">
      <h2>Manage who can access your health records.</h2>

      {items.map((i) => (
        <div className="generic-row" key={i.id}>
          <Ico className="row-icon">{i.icon}</Ico>
          <div className="row-text">
            <h3>{i.name}</h3>
            <p>{i.scope}</p>
          </div>
          <span className={i.active ? "status-badge" : "status-badge off"} role="status">
            {i.active ? "Access granted" : "Access revoked"}
          </span>
          <button type="button" className="secondary-btn" onClick={() => toggle(i.id)}>
            {i.active ? "Revoke" : "Grant again"}
          </button>
        </div>
      ))}
    </div>
  );
}

const SCOPES = [
  ["history", "📋", "Medical history"],
  ["labs", "🧪", "Lab reports"],
  ["rx", "💊", "Prescriptions"],
  ["imaging", "🩻", "Imaging"],
];

const DURATIONS: [number, string][] = [
  [1, "1 minute (demo)"],
  [30, "30 minutes"],
  [60, "1 hour"],
  [120, "2 hours"],
];

const RECORD_DATA: Record<string, [string, string, string]> = {
  history: ["📋", "Medical History", "Allergy: Penicillin • Blood group B+ • Vaccination: 20 Aug 2026"],
  labs: ["🧪", "Lab Reports", "Blood Test • Apollo Hospitals • 18 Sep 2026 • Hemoglobin 11.5 g/dL"],
  rx: ["💊", "Prescriptions", "Azithromycin 500mg • Dr. A. Sharma • 15 Sep 2026"],
  imaging: ["🩻", "Imaging", "Chest imaging • Apollo Hospitals • 02 Sep 2026"],
};

function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

const fmtTime = (s: number) => {
  const p = (n: number) => String(n).padStart(2, "0");
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}:${p(m)}:${p(s % 60)}` : `${p(m)}:${p(s % 60)}`;
};

function SessionBar({ session, onEnd, onExpire }: any) {
  const now = useNow();
  const hasLimit = !session.emergency && session.expiresAt != null;
  const left = hasLimit ? Math.max(0, Math.ceil((session.expiresAt - now) / 1000)) : null;

  useEffect(() => {
    if (hasLimit && left === 0) onExpire();
  }, [left, hasLimit]); // eslint-disable-line react-hooks/exhaustive-deps

  const cls = ["session-bar", session.emergency ? "emergency" : left !== null && left < 300 ? "low" : ""].join(" ");

  return (
    <div className={cls} role="region" aria-label="Active patient access">
      <div>
        <strong>{session.emergency ? "🚨 Emergency access" : "🔓 Access active"}</strong>
        {" • "}
        {session.name} ({session.healthId})
      </div>
      <div className="session-right">
        {hasLimit ? (
          <span className="timer">⏱ {fmtTime(left!)} left</span>
        ) : (
          <span className="timer">⏱ No time limit</span>
        )}
        <button type="button" className="end-btn" onClick={onEnd}>
          {session.emergency ? "Save & next patient" : "End access now"}
        </button>
      </div>
    </div>
  );
}

function Locked({ goTo, lang }: any) {
  const t = PAGE_TEXT[lang].locked;
  return (
    <div className="generic-card locked" lang={lang}>
      <Ico className="lock-icon">🔒</Ico>
      <h2>{t.title}</h2>
      <p>{t.body}</p>
      <button type="button" className="primary-btn small-btn" onClick={() => goTo("patients")}>
        {t.button}
      </button>
    </div>
  );
}

const PATIENT_NAMES = [
  "E. Sai Charan", "K. Lakshmi Devi", "P. Ravi Teja", "S. Anitha", "M. Venkata Rao", "G. Sunitha",
  "B. Suresh Kumar", "N. Padmavathi", "R. Harish", "D. Kavitha", "T. Srinivas", "V. Mounika",
  "A. Prasad", "Y. Swathi", "C. Nagaraju", "L. Bhavani", "J. Karthik", "S. Fatima",
];

const slotTime = (i: number) => {
  const m = 9 * 60 + i * 15;
  const h = Math.floor(m / 60);
  return `${((h + 11) % 12) + 1}:${String(m % 60).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

const TODAY_PATIENTS = PATIENT_NAMES.map((name, i) => {
  const words = name.split(" ");
  return {
    id: i === 0 ? "MEDX-9988-7766" : `MEDX-${1200 + i * 173}-${3100 + i * 241}`,
    name,
    initials: words[0][0] + words[words.length - 1][0],
    time: slotTime(i),
    done: i < 5,
  };
});

const isIdentifiedId = (healthId: string) => !healthId.startsWith("UNK-");

function DoctorEmergencyRecords({ encounters, cases, onResume, activeId }: any) {
  const unidentified = cases.filter((c: any) => !isIdentifiedId(c.healthId));
  const identified = cases.filter((c: any) => isIdentifiedId(c.healthId));

  const block = (c: any) => {
    const encs = encounters.filter((e: any) => e.healthId === c.healthId && e.emergency);
    const isActive = activeId === c.healthId;
    return (
      <div className="case-block" key={c.healthId}>
        <div className="generic-row">
          <Ico className="row-icon">🚨</Ico>
          <div className="row-text">
            <h3>{c.name} • {c.healthId}</h3>
            <p>{c.time} • {c.reason || "No reason recorded"}</p>
          </div>
          <span className={isIdentifiedId(c.healthId) ? "status-badge" : "status-badge wait"}>
            {isIdentifiedId(c.healthId) ? "✓ Identified" : "🚨 Unidentified"}
          </span>
          <button type="button" className="secondary-btn" disabled={isActive} onClick={() => onResume(c)}>
            {isActive ? "Open now" : "Open case"}
          </button>
        </div>

        {encs.length === 0 ? (
          <p className="demo-note left">No encounter saved for this case yet.</p>
        ) : (
          encs.map((e: any) => (
            <div className="case-enc" key={e.id}>
              <p><strong>{e.time}</strong> • {e.symptoms || "No symptoms recorded"}</p>
              {e.meds.length > 0 && <p>Prescription: {e.meds.map(medLine).join("; ")}</p>}
              {e.labs.length > 0 && <p>Lab tests ordered: {e.labs.join(", ")}</p>}
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <div className="generic-card emergency-folder">
      <h2>🚨 Emergency &amp; Unidentified Records</h2>
      <p className="demo-note left">
        Every emergency case is kept here and can be reopened at any time.
      </p>

      <h3 className="contact-subhead">🚨 Still unidentified ({unidentified.length})</h3>
      {unidentified.length === 0 ? (
        <p className="demo-note left">No unidentified cases pending right now.</p>
      ) : (
        unidentified.map(block)
      )}

      <h3 className="contact-subhead">✓ Identified &amp; merged ({identified.length})</h3>
      {identified.length === 0 ? (
        <p className="demo-note left">No identified emergency cases yet.</p>
      ) : (
        identified.map(block)
      )}
    </div>
  );
}

function TodaysPatients({ session, lang }: any) {
  const t = PAGE_TEXT[lang].common;
  const [q, setQ] = useState("");
  const [all, setAll] = useState(false);

  const term = q.trim().toLowerCase();
  const list = TODAY_PATIENTS.filter((p) => (p.name + p.id).toLowerCase().includes(term));
  const shown = all || term ? list : list.slice(0, 8);

  return (
    <section id="todays-patients" aria-labelledby="tp-title">
      <h2 className="section-title" id="tp-title" lang={lang}>
        {PAGE_TEXT[lang].doctorDash.todaysPatients(TODAY_PATIENTS.length)}
      </h2>

      <div className="field tp-search">
        <label htmlFor="tp-q" lang={lang}>{t.searchLabel}</label>
        <input id="tp-q" type="search" placeholder="e.g. Lakshmi" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <ul className="plain-list">
        {shown.map((p) => {
          const active = session && p.id === "MEDX-9988-7766";
          return (
            <li className="patient-row" key={p.id}>
              <div className="avatar" aria-hidden="true">{p.initials}</div>
              <div>
                <h3>{p.name}</h3>
                <p>{p.id} • {p.time}</p>
              </div>
              <span className={active || p.done ? "status-badge" : "status-badge wait"} lang={lang}>
                {active ? "Access active" : p.done ? "Completed" : "Waiting"}
              </span>
            </li>
          );
        })}
      </ul>

      {shown.length === 0 && <p className="demo-note left" lang={lang}>{t.noResult(q)}</p>}

      {!term && (
        <button type="button" className="secondary-btn show-all" lang={lang} onClick={() => setAll(!all)}>
          {all ? t.showFewer : t.showAll(list.length)}
        </button>
      )}
    </section>
  );
}

function PendingAccessRequests({ pending, approved, onApprove }: any) {
  return (
    <>
      <h2 className="section-title">⏳ Pending Access Requests</h2>
      <p className="demo-note left">Patients waiting for you to approve record access.</p>

      {pending.length === 0 ? (
        <p className="demo-note left">No pending access requests right now.</p>
      ) : (
        <ul className="plain-list">
          {pending.map((p: any) => (
            <li className="patient-row" key={p.id}>
              <div className="avatar" aria-hidden="true">{p.initials}</div>
              <div>
                <h3>{p.name}</h3>
                <p>{p.id} • Requested at {p.requestTime}</p>
              </div>
              <button type="button" className="primary-btn small-btn" onClick={() => onApprove(p.id)}>
                ✓ Approve Access
              </button>
            </li>
          ))}
        </ul>
      )}

      {approved.length > 0 && (
        <p className="demo-note left">
          Approved just now: {approved.map((p: any) => p.name).join(", ")}.
        </p>
      )}
    </>
  );
}

function CompletedSessionHistory({ encounters }: any) {
  const groups: Record<string, any> = {};
  encounters.forEach((e: any) => {
    if (!groups[e.healthId]) groups[e.healthId] = { name: e.patient, healthId: e.healthId, times: [] };
    groups[e.healthId].times.push(e.time);
  });
  const list = Object.values(groups);

  return (
    <>
      <h2 className="section-title">✅ Completed Session History</h2>
      <p className="demo-note left">Sessions you have completed for each patient.</p>

      <ul className="plain-list">
        {TODAY_PATIENTS.filter((p) => p.done).map((p) => (
          <li className="patient-row" key={p.id}>
            <div className="avatar" aria-hidden="true">{p.initials}</div>
            <div>
              <h3>{p.name}</h3>
              <p>{p.id} • {p.time}</p>
            </div>
            <span className="status-badge">Completed</span>
          </li>
        ))}
      </ul>

      {list.length > 0 && (
        <ul className="plain-list">
          {list.map((g: any) => (
            <li key={g.healthId} className="generic-card session-history-card">
              <div className="session-history-head">
                <h3>{g.name} • {g.healthId}</h3>
                <span className="status-badge">
                  {g.times.length} Completed Visit{g.times.length === 1 ? "" : "s"}
                </span>
              </div>
              <ul className="visit-dates">
                {g.times.map((t: string, i: number) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function DoctorDashboard({ goTo, session, encounters, lang, pending, approved, onApprove }: any) {
  const t = PAGE_TEXT[lang].doctorDash;
  const [panel, setPanel] = useState<string | null>(null);
  const toggle = (p: string) => setPanel(panel === p ? null : p);
  const jump = () => {
    const el = document.getElementById("todays-patients");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <Banner
        variant="doctor-banner"
        hello="Welcome"
        name="Dr. A. Sharma"
        meta="Apollo Hospitals • Cardiology"
        status="Professional Verified"
      />

      <h2 className="section-title" lang={lang}>{t.todaysOverview}</h2>

      <div className="stats-grid">
        <StatCard icon="👥" title="Patients" text={`${TODAY_PATIENTS.length} scheduled • see names`} onClick={jump} />
        <StatCard icon="📋" title="Records" text="18 accessed" onClick={() => goTo("records")} />
        <StatCard
          icon="🔐"
          title="Consent"
          text={`${pending.length} pending`}
          active={panel === "consent"}
          onClick={() => toggle("consent")}
        />
        <StatCard
          icon="🩺"
          title="Encounters"
          text={`${5 + encounters.length} completed`}
          active={panel === "encounters"}
          onClick={() => toggle("encounters")}
        />
      </div>

      {panel === "consent" && (
        <div className="detail-panel">
          <PendingAccessRequests pending={pending} approved={approved} onApprove={onApprove} />
        </div>
      )}
      {panel === "encounters" && (
        <div className="detail-panel">
          <CompletedSessionHistory encounters={encounters} />
        </div>
      )}

      <h2 className="section-title" lang={lang}>{PAGE_TEXT[lang].nav.doctor.patients}</h2>

      <div className="verification-card" lang={lang}>
        <h3>
          <Ico>📱</Ico> {t.verifyTitle}
        </h3>
        <p>{t.verifyDesc}</p>
        <button type="button" className="primary-btn small-btn" onClick={() => goTo("patients")}>
          {PAGE_TEXT[lang].common.verifyPatient}
        </button>
      </div>

      <TodaysPatients session={session} lang={lang} />
    </>
  );
}

const PENICILLINS = [
  "penicillin", "amoxicillin", "ampicillin", "cloxacillin",
  "flucloxacillin", "amoxyclav", "augmentin", "piperacillin",
];
const FREQS = ["Once daily", "Twice daily", "Thrice daily", "At night", "Only if needed"];
const LAB_TESTS = [
  "CBC (complete blood count)", "Blood sugar (fasting)", "Lipid profile",
  "Liver function test", "Kidney function test", "Chest X-ray", "ECG",
];

let rxCounter = 0;
const newRx = () => ({ id: ++rxCounter, drug: "", dose: "", freq: "Twice daily", days: "5" });
const outOfRange = (v: string, lo: number, hi: number) => v !== "" && (Number(v) < lo || Number(v) > hi);
const medLine = (m: any) => `${m.drug} ${m.dose} • ${m.freq.toLowerCase()} • ${m.days} days`;

const vitalsText = (d: any) => {
  const v = [];
  if (d.bps && d.bpd) v.push(`BP ${d.bps}/${d.bpd} mmHg`);
  if (d.pulse) v.push(`Pulse ${d.pulse} bpm`);
  if (d.temp) v.push(`Temp ${d.temp} °F`);
  if (d.spo2) v.push(`SpO₂ ${d.spo2}%`);
  return v.length ? v.join(" • ") : "Not recorded";
};

function encounterRows(list: any[]) {
  const out: [string, string, string][] = [];
  list.forEach((e) => {
    if (e.meds.length) out.push(["💊", `New prescription • ${e.time}`, e.meds.map(medLine).join("; ")]);
    if (e.labs.length) out.push(["🧪", `Lab tests ordered • ${e.time}`, e.labs.join(", ")]);
  });
  return out;
}

const BLANK_ENCOUNTER = {
  symptoms: "", bps: "", bpd: "", pulse: "", temp: "", spo2: "",
  diagnosis: "", advice: "", followUp: "",
};

function NewEncounter({ session, saved, onSave, goTo }: any) {
  const [f, setF] = useState(BLANK_ENCOUNTER);
  const [rx, setRx] = useState(() => [newRx()]);
  const [labs, setLabs] = useState<string[]>([]);
  const [ack, setAck] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<any>(null);

  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  const upd = (id: number, k: string, v: string) => setRx(rx.map((r) => (r.id === id ? { ...r, [k]: v } : r)));
  const conflicts = rx.filter((r) => PENICILLINS.some((p) => r.drug.toLowerCase().includes(p)));
  const mine = saved.filter((s: any) => s.healthId === session.healthId);

  const reset = () => {
    setF(BLANK_ENCOUNTER);
    setRx([newRx()]);
    setLabs([]);
    setAck(false);
    setErrors({});
    setDone(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!f.symptoms.trim()) err.symptoms = "Describe the patient's symptoms.";
    if ((f.bps && !f.bpd) || (!f.bps && f.bpd)) err.bps = "Enter both BP values.";
    if (outOfRange(f.bps, 50, 260) || outOfRange(f.bpd, 30, 160)) err.bps = "BP looks out of range. Please check.";
    if (outOfRange(f.pulse, 30, 220)) err.pulse = "Enter 30–220 bpm.";
    if (outOfRange(f.temp, 90, 110)) err.temp = "Enter 90–110 °F.";
    if (outOfRange(f.spo2, 50, 100)) err.spo2 = "Enter 50–100 %.";

    const meds = rx.filter((r) => r.drug.trim());
    meds.forEach((r) => {
      if (!r.dose.trim()) err["dose" + r.id] = "Enter dose.";
      if (!(Number(r.days) >= 1 && Number(r.days) <= 90)) err["days" + r.id] = "1–90 days.";
    });
    if (conflicts.length && !ack) err.ack = "Confirm you reviewed the allergy alert, or change the medicine.";

    setErrors(err);
    if (Object.keys(err).length) return;

    const enc = {
      id: Date.now(),
      patient: session.name,
      healthId: session.healthId,
      time: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
      emergency: !!session.emergency,
      ...f,
      meds,
      labs,
      allergyOverride: conflicts.length > 0,
    };
    onSave(enc);
    setDone(enc);
  };

  if (done) {
    const rows = [
      ["Symptoms", done.symptoms],
      ["Vitals", vitalsText(done)],
      ["Diagnosis", done.diagnosis || "Not entered"],
      ["Lab tests ordered", done.labs.length ? done.labs.join(", ") : "None"],
      ["Advice", done.advice || "Not entered"],
      ["Follow-up date", done.followUp || "Not set"],
    ];
    return (
      <>
        <div className="verified-banner" role="status">
          ✓ Encounter saved for {done.patient} on {done.time}.
        </div>

        <div className="generic-card enc-summary">
          <h2>Encounter summary</h2>
          <dl className="summary-list">
            {rows.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>

          <h3 className="rx-title">💊 Prescription</h3>
          {done.meds.length ? (
            <div className="table-wrap">
              <table className="rx-table">
                <thead>
                  <tr><th>Medicine</th><th>Dose</th><th>How often</th><th>Days</th></tr>
                </thead>
                <tbody>
                  {done.meds.map((m: any) => (
                    <tr key={m.id}>
                      <td>{m.drug}</td><td>{m.dose}</td><td>{m.freq}</td><td>{m.days}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="demo-note left">No medicines prescribed.</p>
          )}

          {done.allergyOverride && (
            <div className="alert-card">
              <strong>⚠ Allergy alert reviewed</strong>
              <p>A penicillin-family medicine was prescribed after the doctor confirmed the allergy alert.</p>
            </div>
          )}

          <div className="action-row">
            <button type="button" className="primary-btn small-btn" onClick={reset}>Start another encounter</button>
            <button type="button" className="secondary-btn" onClick={() => goTo("records")}>Open health records</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="enc-form">
      <div className="alert-card" role="note">
        <strong>⚠ Allergy Alert</strong>
        <p>
          {session.anonymous
            ? "Allergy history is unknown for this unidentified patient."
            : `${session.name}: Penicillin allergy. Check before prescribing.`}
        </p>
      </div>

      <fieldset className="enc-section">
        <legend>🩺 Symptoms</legend>
        <Field
          as="textarea" rows={3} id="e-sym"
          label="What is the patient reporting?"
          placeholder="e.g. Fever and sore throat for 3 days"
          value={f.symptoms} error={errors.symptoms} onChange={set("symptoms")}
        />
      </fieldset>

      <fieldset className="enc-section">
        <legend>❤️ Vitals</legend>
        <div className="grid-3">
          <Field id="e-bps" label="BP upper (mmHg)" type="number" inputMode="numeric" placeholder="120" value={f.bps} error={errors.bps} onChange={set("bps")} />
          <Field id="e-bpd" label="BP lower (mmHg)" type="number" inputMode="numeric" placeholder="80" value={f.bpd} onChange={set("bpd")} />
          <Field id="e-pulse" label="Pulse (bpm)" type="number" inputMode="numeric" placeholder="72" value={f.pulse} error={errors.pulse} onChange={set("pulse")} />
          <Field id="e-temp" label="Temperature (°F)" type="number" step="0.1" inputMode="decimal" placeholder="98.6" value={f.temp} error={errors.temp} onChange={set("temp")} />
          <Field id="e-spo2" label="SpO₂ (%)" type="number" inputMode="numeric" placeholder="98" value={f.spo2} error={errors.spo2} onChange={set("spo2")} />
        </div>
      </fieldset>

      <fieldset className="enc-section">
        <legend>📝 Diagnosis</legend>
        <Field id="e-dx" label="Provisional diagnosis" placeholder="e.g. Acute pharyngitis" value={f.diagnosis} onChange={set("diagnosis")} />
      </fieldset>

      <fieldset className="enc-section">
        <legend>💊 Prescription</legend>

        {rx.map((r, i) => (
          <div className="rx-row" key={r.id}>
            <Field id={`rx-drug-${r.id}`} label={`Medicine ${i + 1}`} placeholder="e.g. Azithromycin" value={r.drug} onChange={(e: any) => upd(r.id, "drug", e.target.value)} />
            <Field id={`rx-dose-${r.id}`} label="Dose" placeholder="500mg" value={r.dose} error={errors["dose" + r.id]} onChange={(e: any) => upd(r.id, "dose", e.target.value)} />
            <div className="field">
              <label htmlFor={`rx-freq-${r.id}`}>How often</label>
              <select id={`rx-freq-${r.id}`} value={r.freq} onChange={(e) => upd(r.id, "freq", e.target.value)}>
                {FREQS.map((x) => <option key={x}>{x}</option>)}
              </select>
            </div>
            <Field id={`rx-days-${r.id}`} label="Days" type="number" min="1" max="90" inputMode="numeric" value={r.days} error={errors["days" + r.id]} onChange={(e: any) => upd(r.id, "days", e.target.value)} />
            {rx.length > 1 && (
              <button type="button" className="end-btn rx-remove" aria-label={`Remove medicine ${i + 1}`} onClick={() => setRx(rx.filter((x) => x.id !== r.id))}>
                Remove
              </button>
            )}
          </div>
        ))}

        <button type="button" className="secondary-btn add-rx" onClick={() => setRx([...rx, newRx()])}>
          + Add another medicine
        </button>

        {conflicts.length > 0 && (
          <div className="hospital-alert" role="alert">
            <strong>⚠ Allergy conflict</strong>
            <p>
              {conflicts.map((c) => c.drug).join(", ")} belongs to the penicillin
              family, and {session.name} is allergic to penicillin.
            </p>
            <label className="check">
              <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
              I have reviewed this allergy alert
            </label>
            {errors.ack && <p className="field-error" role="alert">{errors.ack}</p>}
          </div>
        )}
      </fieldset>

      <fieldset className="enc-section">
        <legend>🧪 Lab tests</legend>
        <div className="check-grid flat">
          {LAB_TESTS.map((t) => (
            <label key={t} className="check">
              <input
                type="checkbox"
                checked={labs.includes(t)}
                onChange={() => setLabs(labs.includes(t) ? labs.filter((x) => x !== t) : [...labs, t])}
              />
              {t}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="enc-section">
        <legend>📅 Advice and follow-up</legend>
        <Field as="textarea" rows={2} id="e-adv" label="Advice for the patient" placeholder="e.g. Rest, drink plenty of fluids" value={f.advice} onChange={set("advice")} />
        <Field id="e-fu" label="Follow-up date" type="date" value={f.followUp} onChange={set("followUp")} />
      </fieldset>

      <button className="primary-btn save-enc" type="submit">Save encounter</button>
    </form>
  );
}

const RECIPIENTS = [
  "Dr. R. K. Patel • Cardiology, City Care Hospital",
  "Dr. S. Reddy • Pathology, Apollo Hospitals",
  "Radiology Department • Apollo Hospitals",
];

function SecureSharing({ session, shares, setShares }: any) {
  const [to, setTo] = useState(RECIPIENTS[0]);
  const [scope, setScope] = useState(session.scope.slice(0, 1));
  const [mins, setMins] = useState(30);
  const [error, setError] = useState("");

  const labelOf = (k: string) => SCOPES.find((s) => s[0] === k)?.[2] || k;
  const durLabel = (m: number) => DURATIONS.find((d) => d[0] === m)?.[1] || `${m} min`;

  const share = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scope.length) {
      setError("Select at least one type of record to share.");
      return;
    }
    setError("");
    setShares([{ id: Date.now(), to, scope, mins, patient: session.name, active: true }, ...shares]);
  };

  return (
    <>
      <form className="generic-card" onSubmit={share} noValidate>
        <h2>Share approved records securely.</h2>
        <p className="demo-note left">You can only share records the patient approved in this session.</p>

        <div className="field">
          <label htmlFor="s-to">Share with</label>
          <select id="s-to" value={to} onChange={(e) => setTo(e.target.value)}>
            {RECIPIENTS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>

        <fieldset className="check-grid">
          <legend>Records to share</legend>
          {session.scope.map((k: string) => (
            <label key={k} className="check">
              <input
                type="checkbox"
                checked={scope.includes(k)}
                onChange={() => setScope(scope.includes(k) ? scope.filter((x: string) => x !== k) : [...scope, k])}
              />
              {labelOf(k)}
            </label>
          ))}
        </fieldset>
        {error && <p className="field-error" role="alert">{error}</p>}

        <div className="field">
          <label htmlFor="s-dur">Access duration</label>
          <select id="s-dur" value={mins} onChange={(e) => setMins(Number(e.target.value))}>
            {DURATIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        <button className="primary-btn small-btn" type="submit">Share securely</button>
      </form>

      {shares.length > 0 && (
        <div className="saved-list">
          <div className="generic-card">
            <h2>Shared access</h2>
            {shares.map((s: any) => (
              <div className="generic-row" key={s.id}>
                <Ico className="row-icon">📤</Ico>
                <div className="row-text">
                  <h3>{s.to}</h3>
                  <p>{s.patient} • {s.scope.map(labelOf).join(", ")} • {durLabel(s.mins)}</p>
                </div>
                <span className={s.active ? "status-badge" : "status-badge off"}>{s.active ? "Active" : "Revoked"}</span>
                {s.active && (
                  <button
                    type="button"
                    className="end-btn"
                    onClick={() => setShares(shares.map((x: any) => (x.id === s.id ? { ...x, active: false } : x)))}
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

const OTP_SECONDS = 60;

function PatientVerification({ session, onStart, onEnd, goTo }: any) {
  const [step, setStep] = useState("mobile");
  const [mobile, setMobile] = useState("");
  const [scope, setScope] = useState(["history", "labs", "rx"]);
  const [mins, setMins] = useState(30);
  const [emergency, setEmergency] = useState(false);
  const [reason, setReason] = useState("");
  const [tempLabel, setTempLabel] = useState("");
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (wait <= 0) return undefined;
    const t = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const mobileDigits = mobile.replace(/\D/g, "");
  const maskedMobile = mobileDigits.length === 10 ? "XXXXXX" + mobileDigits.slice(6) : mobileDigits;

  const reset = () => {
    setStep("mobile");
    setMobile("");
    setOtp("");
    setReason("");
    setTempLabel("");
    setErrors({});
    setTries(0);
    setWait(0);
    setEmergency(false);
    setBusy(false);
  };

  const grant = () => {
    if (emergency) {
      const anonId = "UNK-" + Date.now().toString().slice(-6);
      onStart({
        name: tempLabel.trim() || "Unidentified Patient",
        healthId: anonId,
        mobile: null,
        anonymous: true,
        merged: false,
        scope: SCOPES.map((s) => s[0]),
        expiresAt: null,
        emergency: true,
        reason: reason.trim(),
      });
    } else {
      onStart({
        name: "E. Sai Charan",
        healthId: "MEDX-9988-7766",
        mobile: maskedMobile,
        verifiedVia: "mobile",
        anonymous: false,
        scope,
        expiresAt: Date.now() + mins * 60000,
        emergency: false,
      });
    }
    reset();
  };

  const startOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (emergency) {
      if (!reason.trim()) err.reason = "Enter the reason for emergency access.";
    } else {
      if (mobileDigits.length !== 10) err.mobile = "Enter the patient's 10-digit mobile number.";
      if (scope.length === 0) err.scope = "Select at least one type of record.";
    }
    setErrors(err);
    if (Object.keys(err).length) return;

    setBusy(true);
    setTimeout(() => {
      if (emergency) {
        grant();
        return;
      }
      setBusy(false);
      setStep("otp");
      setWait(OTP_SECONDS);
      setTries(0);
      setOtp("");
    }, 800);
  };

  const verifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (wait <= 0) {
      setErrors({ otp: "OTP expired. Please tap Resend OTP to get a new one." });
      return;
    }
    if (otp.length !== 6) {
      setErrors({ otp: "Enter the 6-digit OTP shared by the patient." });
      return;
    }
    if (otp === "000000") {
      const n = tries + 1;
      setTries(n);
      setOtp("");
      if (n >= 3) {
        setStep("mobile");
        setErrors({ mobile: "Too many wrong OTP attempts. Please start again." });
      } else {
        setErrors({ otp: `Incorrect OTP. ${3 - n} attempt${3 - n === 1 ? "" : "s"} left.` });
      }
      return;
    }
    setErrors({});
    setBusy(true);
    setTimeout(grant, 700);
  };

  if (session) {
    return (
      <>
        <div className={session.emergency ? "verified-banner emergency" : "verified-banner"} role="status">
          {session.emergency
            ? session.anonymous
              ? "🚨 Emergency access started for an unidentified patient."
              : "🚨 Emergency access started. Emergency contacts notified."
            : "✓ Patient verified via Mobile OTP. Access is time-limited."}
        </div>

        <div className="patient-row">
          <div className="avatar" aria-hidden="true">
            {session.anonymous
              ? "UP"
              : session.name.split(" ").filter(Boolean).map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div>
            <h3>{session.name}</h3>
            {session.anonymous ? (
              <p>Temporary ID: {session.healthId}{session.reason ? ` • ${session.reason}` : ""}</p>
            ) : (
              <p>
                {session.healthId}
                {session.mobile ? ` • Mobile ${session.mobile}` : ""}
              </p>
            )}
            {!session.anonymous && !session.merged && <p>Age: 28 • Male • Blood Group: B+</p>}
          </div>
          <span className="status-badge">{session.anonymous ? "🚨 Unidentified" : "✓ Verified"}</span>
        </div>

        <div className="generic-card scope-card">
          <h2>Access approved for</h2>
          <ul className="chip-list">
            {session.scope.map((k: string) => {
              const s = SCOPES.find((x) => x[0] === k);
              return s ? (
                <li className="chip" key={k}>
                  <Ico>{s[1]}</Ico> {s[2]}
                </li>
              ) : null;
            })}
          </ul>
          <div className="action-row">
            <button type="button" className="primary-btn small-btn" onClick={() => goTo("records")}>
              Open health records
            </button>
            <button type="button" className="secondary-btn" onClick={() => goTo("encounter")}>
              Start new encounter
            </button>
            <button type="button" className="secondary-btn" onClick={onEnd}>
              {session.emergency ? "Save & verify next patient" : "End access"}
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="verification-card large">
      <h2>
        <Ico>{emergency ? "🚨" : "📱"}</Ico>{" "}
        {emergency ? "Emergency access" : "Verify patient via Mobile OTP"}
      </h2>
      <p>
        {emergency
          ? "Use only when the patient is unconscious or cannot provide mobile OTP. Access is audited."
          : "Enter the patient's 10-digit mobile number. A secure verification OTP will be sent to their phone."}
      </p>

      {step === "mobile" ? (
        <form onSubmit={startOtp} noValidate>
          {!emergency && (
            <Field
              id="p-mobile"
              label="Patient's mobile number"
              inputMode="numeric"
              placeholder="10-digit mobile number"
              maxLength={10}
              value={mobile}
              error={errors.mobile}
              onChange={(e: any) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
            />
          )}

          {emergency ? (
            <>
              <Field
                id="p-reason"
                label="Reason for emergency access"
                placeholder="e.g. Patient unconscious in casualty"
                value={reason}
                error={errors.reason}
                onChange={(e: any) => setReason(e.target.value)}
              />
              <Field
                id="p-templabel"
                label="Temporary description (optional)"
                placeholder="e.g. Unidentified male, approx. 30 years"
                value={tempLabel}
                onChange={(e: any) => setTempLabel(e.target.value)}
              />
            </>
          ) : (
            <>
              <fieldset className="check-grid">
                <legend>Records you need</legend>
                {SCOPES.map(([k, icon, label]) => (
                  <label key={k} className="check">
                    <input
                      type="checkbox"
                      checked={scope.includes(k)}
                      onChange={() =>
                        setScope(scope.includes(k) ? scope.filter((x) => x !== k) : [...scope, k])
                      }
                    />
                    <Ico>{icon}</Ico> {label}
                  </label>
                ))}
              </fieldset>
              {errors.scope && <p className="field-error" role="alert">{errors.scope}</p>}

              <div className="field">
                <label htmlFor="p-duration">Access duration</label>
                <select id="p-duration" value={mins} onChange={(e) => setMins(Number(e.target.value))}>
                  {DURATIONS.map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <button className={emergency ? "primary-btn danger" : "primary-btn"} type="submit" disabled={busy}>
            {busy ? "Please wait…" : emergency ? "Start emergency access" : "Send OTP to patient"}
          </button>

          <button type="button" className="text-btn" onClick={() => { setEmergency(!emergency); setErrors({}); }}>
            {emergency ? "← Back to Mobile OTP verification" : "🚨 Patient unconscious? Use emergency access"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOtp} noValidate>
          <div className="otp-info" role="status">
            OTP sent to mobile number {maskedMobile}. Ask the patient to read it out.
          </div>

          <div className={wait > 0 ? (wait <= 10 ? "otp-timer low" : "otp-timer") : "otp-timer expired"}>
            <span>
              {wait > 0
                ? `⏱ OTP valid for ${fmtTime(wait)}`
                : "⌛ OTP expired. Tap Resend OTP to get a new one."}
            </span>
          </div>

          <Field
            id="p-otp"
            label="OTP shared by the patient"
            className="otp-input"
            inputMode="numeric"
            maxLength={6}
            placeholder="••••••"
            value={otp}
            error={errors.otp}
            onChange={(e: any) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />

          <button className="primary-btn" type="submit" disabled={busy || wait <= 0}>
            {busy ? "Verifying…" : wait <= 0 ? "OTP expired" : "Verify OTP and unlock records"}
          </button>

          <div className="otp-actions">
            <button
              type="button"
              className="text-btn"
              disabled={wait > 0}
              onClick={() => { setWait(OTP_SECONDS); setTries(0); setOtp(""); setErrors({}); }}
            >
              {wait > 0 ? `Resend OTP (${fmtTime(wait)})` : "Resend OTP"}
            </button>
            <button
              type="button"
              className="text-btn"
              onClick={() => { setStep("mobile"); setOtp(""); setErrors({}); }}
            >
              Change number
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function HealthRecordsView({ session, encounters }: any) {
  const mine = encounters.filter((e: any) => e.healthId === session.healthId);
  const emergencyRows = encounterRows(mine.filter((e: any) => e.emergency));
  const normalRows = encounterRows(mine.filter((e: any) => !e.emergency));
  const regularItems = session.anonymous ? [] : [...session.scope.map((k: string) => RECORD_DATA[k]), ...normalRows];

  return (
    <>
      <GenericPage
        description={
          session.anonymous
            ? "No prior medical history is available for this unidentified patient."
            : "Records approved by the patient for this session."
        }
        items={
          session.anonymous
            ? [["ℹ️", "No prior history", "Confirm allergies and medical history with the patient or family."]]
            : regularItems.length
            ? regularItems
            : [["📋", "No records yet", "Start an encounter to add clinical records."]]
        }
      />

      {emergencyRows.length > 0 && (
        <div className="generic-card emergency-folder">
          <h2>🚨 Emergency records</h2>
          {emergencyRows.map(([icon, title, text], i) => (
            <div className="generic-row" key={`${title}-${i}`}>
              <Ico className="row-icon">{icon}</Ico>
              <div className="row-text">
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function GenericPage({ description, items }: { description: string; items: [string, string, string][] }) {
  return (
    <div className="generic-card">
      <h2>{description}</h2>

      {items.map(([icon, title, text], i) => (
        <div className="generic-row" key={`${title}-${i}`}>
          <Ico className="row-icon">{icon}</Ico>
          <div className="row-text">
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* =========================
   PERFECT MULTILINGUAL VOICE COPILOT (STT & TTS)
========================= */
const LANGS: Record<string, { code: string; label: string; bcp47: string; samplePhrase: string }> = {
  en: { code: "en-IN", label: "English", bcp47: "en-IN", samplePhrase: "Explain my recent blood test" },
  hi: { code: "hi-IN", label: "हिन्दी", bcp47: "hi-IN", samplePhrase: "मेरी रक्त जांच रिपोर्ट समझाइए" },
  te: { code: "te-IN", label: "తెలుగు", bcp47: "te-IN", samplePhrase: "నా రక్త పరీక్ష రిపోర్టును వివరించండి" },
};

const INTENTS = [
  {
    keys: ["emergency", "chest pain", "breathing", "आपात", "इमरजेंसी", "सीने", "सांस", "అత్యవసర", "ఛాతి", "శ్వాస"],
    en: "In an emergency, call 108 (ambulance) or 112 right away. Do not wait for an online answer.",
    hi: "आपात स्थिति में तुरंत 108 (एम्बुलेंस) या 112 पर कॉल करें। ऑनलाइन जवाब का इंतज़ार न करें।",
    te: "అత్యవసర పరిస్థితిలో వెంటనే 108 (అంబులెన్స్) లేదా 112కు కాల్ చేయండి. ఆన్‌లైన్ సమాధానం కోసం వేచి ఉండకండి.",
  },
  {
    keys: ["allerg", "penicillin", "एलर्जी", "पेनिसिलिन", "అలర్జీ", "ఎలర్జీ", "అలెర్జీ", "పెన్సిలిన్"],
    en: "Your health profile records a Penicillin allergy. Always tell your doctor and pharmacist before taking any antibiotic.",
    hi: "आपके स्वास्थ्य प्रोफ़ाइल में पेनिसिलिन से एलर्जी दर्ज है। कोई भी एंटीबायोटिक लेने से पहले अपने डॉक्टर और फार्मासिस्ट को यह ज़रूर बताएं।",
    te: "మీ హెల్త్ ప్రొఫైల్‌లో పెన్సిలిన్ అలర్జీ నమోదు చేయబడింది. ఏదైనా యాంటీబయాటిక్ తీసుకునే ముందు మీ డాక్టర్‌కు, ఫార్మసిస్ట్‌కు తప్పకుండా చెప్పండి.",
  },
  {
    keys: ["medic", "tablet", "azithro", "दवा", "दवाई", "एज़िथ्रोमाइसिन", "మందు", "మాత్ర", "అజిత్రోమైసిన్"],
    en: "Your current medicine is Azithromycin 500mg, once daily, with 3 days remaining. No conflict with your Penicillin allergy was found. Finish the course as your doctor advised.",
    hi: "आपकी मौजूदा दवा एज़िथ्रोमाइसिन 500mg है, दिन में एक बार, 3 दिन बाकी हैं। आपकी पेनिसिलिन एलर्जी से कोई टकराव नहीं मिला।",
    te: "మీ ప్రస్తుత మందు అజిత్రోమైసిన్ 500mg, రోజుకు ఒకసారి, ఇంకా 3 రోజులు మిగిలి ఉన్నాయి. మీ పెన్సిలిన్ అలర్జీతో ఎలాంటి సమస్య లేదు.",
  },
];

const SpeechRec =
  typeof window !== "undefined" &&
  ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

const COPILOT_URL = "/api/copilot";
const MAX_FILE_BYTES = 10 * 1024 * 1024;

const PATIENT_CONTEXT = {
  firstName: "Sai Charan",
  fullName: "E. Sai Charan",
  healthId: "MEDX-9988-7766",
  age: 28,
  gender: "Male",
  bloodGroup: "B+",
  allergies: ["Penicillin"],
  currentMedicines: ["Azithromycin 500mg once daily (3 days remaining)", "Cetirizine 10mg at night"],
  recentLabs: ["Hemoglobin 11.5 g/dL (18 Sep 2026) at Apollo Hospitals"],
};

const AI_TEXT: Record<string, any> = {
  en: {
    title: "Gemini Health Copilot",
    hello:
      "Hello! I am your SMART-MEDX Health Copilot, powered by Google Gemini AI. Tap the microphone to speak with me in your language, or attach any prescription, lab report, or scan photo!",
    placeholder: "Ask or speak your health question…",
    send: "Send",
    listening: "🎙️ Listening… Speak now in English",
    listeningSub: "Listening to your voice… Speak naturally into your mic.",
    noVoice: "Voice input is not supported in this browser. Please use Chrome or Edge.",
    speak: "Auto Voice Output (Assistant Speaking ON)",
    attach: "Attach report (PDF or Image)",
    removeFile: "Remove attachment",
    fileBad: "Please attach a PDF or image under 10 MB.",
    thinking: "Gemini is analyzing…",
    readingFile: "Gemini is reading your medical document…",
    offline: "Connecting in offline mode.",
    offlineFile: "The document was received, but the AI service is offline. Please consult your physician.",
    errServer: "Unable to process right now. Please try again.",
    defaultFilePrompt: "Please read this document, extract all clinical values, and explain it to me clearly in English.",
    disclaimer: "AI-assisted guidance for informational purposes only. Consult a doctor for clinical treatment.",
    newChat: "New chat",
    extracted: "Extracted Clinical Data (Gemini Vision / OCR)",
    cols: { test: "Test / Parameter", value: "Observed Result", range: "Reference Range", status: "Status" },
    status: { low: "Low", normal: "Normal", high: "High", abnormal: "Abnormal", unknown: "—" },
    medicines: "Prescribed Medications",
    diagnoses: "Diagnoses / Indications",
    chips: [
      "Explain my recent CBC blood test",
      "Is Azithromycin safe with my Penicillin allergy?",
      "Who currently has access to my records?",
      "What should I do if I get a fever?",
    ],
    fallback: "I can assist you with your health records, Penicillin allergy alert, or review any medical report you attach.",
  },
  hi: {
    title: "जेमिनी स्वास्थ्य कोपायलट",
    hello:
      "नमस्ते! मैं आपका SMART-MEDX स्वास्थ्य कोपायलट हूं। मुझसे हिन्दी में बात करने के लिए माइक दबाएं, या अपनी कोई भी लैब रिपोर्ट या पर्चा फोटो जोड़ें। मैं आपको पूरी जानकारी हिन्दी में बोलकर समझाऊंगा!",
    placeholder: "अपना स्वास्थ्य प्रश्न पूछें या हिन्दी में बोलें…",
    send: "भेजें",
    listening: "🎙️ सुन रहा हूं… कृपया हिन्दी में बोलिए",
    listeningSub: "आपकी आवाज़ सुनी जा रही है… कृपया माइक में स्पष्ट बोलें।",
    noVoice: "इस ब्राउज़र में आवाज़ इनपुट उपलब्ध नहीं है। कृपया Chrome या Edge उपयोग करें।",
    speak: "वॉयस आउटपुट (सहायक बोलेगा)",
    attach: "रिपोर्ट जोड़ें (PDF या इमेज)",
    removeFile: "फ़ाइल हटाएं",
    fileBad: "कृपया 10 MB से छोटी PDF या इमेज फ़ाइल जोड़ें।",
    thinking: "जेमिनी विश्लेषण कर रहा है…",
    readingFile: "जेमिनी आपका दस्तावेज़ पढ़ रहा है…",
    offline: "ऑफ़लाइन मोड में उत्तर दिया जा रहा है।",
    offlineFile: "फ़ाइल मिल गई, लेकिन AI सेवा अभी ऑफ़लाइन है।",
    errServer: "कुछ गड़बड़ हो गई। कृपया फिर कोशिश करें।",
    defaultFilePrompt: "कृपया इस दस्तावेज़ को पढ़ें, सारा डेटा निकालें और मुझे विस्तार से हिन्दी में समझाएं।",
    disclaimer: "केवल सामान्य जानकारी, चिकित्सा सलाह नहीं। डॉक्टर से परामर्श करें।",
    newChat: "नई बातचीत",
    extracted: "दस्तावेज़ से निकाली गई जानकारी (Gemini AI)",
    cols: { test: "जांच", value: "परिणाम", range: "सामान्य सीमा", status: "स्थिति" },
    status: { low: "कम", normal: "सामान्य", high: "अधिक", abnormal: "असामान्य", unknown: "—" },
    medicines: "दवाइयां",
    diagnoses: "निदान",
    chips: [
      "मेरी रक्त जांच (CBC) समझाएं",
      "क्या एज़िथ्रोमाइसिन मेरी पेनिसिलिन एलर्जी के साथ सुरक्षित है?",
      "मेरे रिकॉर्ड कौन देख सकता है?",
    ],
    fallback: "मैं आपकी एलर्जी, दवाओं, रक्त जांच, या रिपोर्ट के बारे में हिन्दी में मदद कर सकता हूं।",
  },
  te: {
    title: "జెమిని ఆరోగ్య కోపైలట్",
    hello:
      "నమస్కారం! నేను మీ SMART-MEDX ఆరోగ్య కోపైలట్‌ను. నాతో తెలుగులో మాట్లాడటానికి మైక్రోఫోన్ నొక్కండి, లేదా ల్యాబ్ రిపోర్టు, ప్రిస్క్రిప్షన్ ఫోటో జత చేయండి. నేను మీకు పూర్తిగా తెలుగులోనే వివరిస్తాను!",
    placeholder: "మీ ఆరోగ్య ప్రశ్నను తెలుగులో అడగండి లేదా మాట్లాడండి…",
    send: "పంపండి",
    listening: "🎙️ వింటున్నాను… దయచేసి తెలుగులో మాట్లాడండి",
    listeningSub: "మీ మాటలను వింటున్నాను… మైక్‌లో మాట్లాడండి.",
    noVoice: "ఈ బ్రౌజర్‌లో వాయిస్ ఇన్‌పుట్ అందుబాటులో లేదు. దయచేసి Chrome లేదా Edge వాడండి.",
    speak: "వాయిస్ అవుట్‌పుట్ (సహాయకుడు తెలుగులో మాట్లాడుతాడు)",
    attach: "రిపోర్ట్ జత చేయండి (PDF లేదా ఇమేజ్)",
    removeFile: "ఫైల్ తొలగించు",
    fileBad: "దయచేసి 10 MB కంటే తక్కువ ఉన్న PDF లేదా ఇమేజ్ ఫైల్ జత చేయండి.",
    thinking: "జెమిని విశ్లేషిస్తోంది…",
    readingFile: "జెమిని మీ డాక్యుమెంట్ చదువుతోంది…",
    offline: "ఆఫ్‌లైన్ మోడ్ సమాధానం చూపిస్తున్నాను.",
    offlineFile: "మీ ఫైల్ అందింది, కానీ AI సర్వర్ ఆఫ్‌లైన్‌లో ఉంది.",
    errServer: "ఏదో తప్పు జరిగింది. దయచేసి మళ్లీ ప్రయత్నించండి.",
    defaultFilePrompt: "దయచేసి ఈ డాక్యుమెంట్ చదివి, మొత్తం డేటాను సేకరించి, నాకు వివరంగా తెలుగులోనే వివరించండి.",
    disclaimer: "సాధారణ సమాచారం మాత్రమే, వైద్య సలహా కాదు. డాక్టర్‌ను సంప్రదించండి.",
    newChat: "కొత్త చాట్",
    extracted: "డాక్యుమెంట్ నుండి సేకరించిన సమాచారం (Gemini AI)",
    cols: { test: "పరీక్ష", value: "ఫలితం", range: "సాధారణ పరిధి", status: "స్థితి" },
    status: { low: "తక్కువ", normal: "సాధారణం", high: "ఎక్కువ", abnormal: "అసాధారణం", unknown: "—" },
    medicines: "మందులు",
    diagnoses: "నిర్ధారణలు",
    chips: [
      "నా ఇటీవలి CBC రక్త పరీక్షను తెలుగులో వివరించండి",
      "నా పెన్సిలిన్ అలర్జీకి అజిత్రోమైసిన్ సురక్షితమేనా?",
      "నా రికార్డులను ఎవరు చూడగలరు?",
    ],
    fallback: "నేను మీ అలర్జీ, మందులు, రక్త పరీక్ష, లేదా ల్యాబ్ రిపోర్టుల గురించి తెలుగులో సహాయం చేయగలను.",
  },
};

const readBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

const fmtSize = (n: number) =>
  n < 1048576 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1048576).toFixed(1)} MB`;

function ExtractedCard({ data, T }: any) {
  const labs = data.labResults || [];
  const meds = data.medicines || [];
  const dx = data.diagnoses || [];
  const head = [data.documentType, data.date, data.provider, data.patientName].filter(Boolean).join(" • ");
  if (!labs.length && !meds.length && !dx.length && !head) return null;

  return (
    <div className="cx-card">
      <div className="cx-card-title">📄 {T.extracted}</div>
      {head && <div className="cx-card-sub">{head}</div>}

      {labs.length > 0 && (
        <div className="cx-table-wrap">
          <table className="cx-table">
            <thead>
              <tr>
                <th>{T.cols.test}</th>
                <th>{T.cols.value}</th>
                <th>{T.cols.range}</th>
                <th>{T.cols.status}</th>
              </tr>
            </thead>
            <tbody>
              {labs.map((l: any, i: number) => {
                const st = ["low", "normal", "high", "abnormal"].includes(l.status) ? l.status : "unknown";
                return (
                  <tr key={i}>
                    <td><strong>{l.test}</strong></td>
                    <td>{[l.value, l.unit].filter(Boolean).join(" ")}</td>
                    <td>{l.referenceRange || "—"}</td>
                    <td>
                      <span className={`cx-st ${st}`}>{T.status[st] || st}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {meds.length > 0 && (
        <>
          <h4 className="cx-h">💊 {T.medicines}</h4>
          <ul className="cx-list">
            {meds.map((m: any, i: number) => (
              <li key={i}>
                <strong>{m.name}</strong>
                {[m.dose, m.frequency, m.duration].filter(Boolean).length > 0 &&
                  ` • ${[m.dose, m.frequency, m.duration].filter(Boolean).join(" • ")}`}
              </li>
            ))}
          </ul>
        </>
      )}

      {dx.length > 0 && (
        <>
          <h4 className="cx-h">🩺 {T.diagnoses}</h4>
          <ul className="cx-list">
            {dx.map((d: string, i: number) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </>
      )}

      {data.notes && (
        <div style={{ marginTop: 8, fontSize: "0.8rem", color: "var(--muted)" }}>
          <strong>Clinical note:</strong> {data.notes}
        </div>
      )}
    </div>
  );
}

function HealthAssistant({
  open,
  setOpen,
  initialVoiceStart,
  lang,
  setLang,
}: {
  open: boolean;
  setOpen: (b: boolean) => void;
  initialVoiceStart?: boolean;
  lang: string;
  setLang: (l: string) => void;
}) {
  const [msgs, setMsgs] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [speakOn, setSpeakOn] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeakingMsgId, setCurrentSpeakingMsgId] = useState<number | null>(null);
  const [note, setNote] = useState("");

  const recRef = useRef<any>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const T = AI_TEXT[lang];

  const stopAll = () => {
    if (canSpeak) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setCurrentSpeakingMsgId(null);
    }
    if (recRef.current) {
      try {
        recRef.current.abort();
      } catch {
        /* ignore */
      }
    }
    setListening(false);
    setInterimText("");
  };

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ block: "end" });
  }, [msgs, loading, open, interimText]);

  useEffect(() => {
    if (!open) {
      stopAll();
      if (abortRef.current) abortRef.current.abort();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open && initialVoiceStart) {
      const timer = setTimeout(() => {
        listen();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open, initialVoiceStart]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ensure voices are loaded cleanly when browser initializes them
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      const onVoices = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.onvoiceschanged = onVoices;
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  const say = (text: string, l: string = lang, msgId?: number) => {
    if (!canSpeak || !text) return;
    window.speechSynthesis.cancel();

    const cleanSpeech = text
      .replace(/[#*`_~]/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanSpeech) return;

    const u = new SpeechSynthesisUtterance(cleanSpeech);
    const targetCode = LANGS[l]?.bcp47 || "en-IN";
    u.lang = targetCode;
    u.rate = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const matchedVoice =
      voices.find((v) => v.lang.toLowerCase() === targetCode.toLowerCase()) ||
      voices.find((v) => v.lang.toLowerCase().replace("_", "-").startsWith(targetCode.slice(0, 2).toLowerCase())) ||
      voices.find((v) => v.lang.toLowerCase().includes("in"));
    if (matchedVoice) {
      u.voice = matchedVoice;
    }

    u.onstart = () => {
      setIsSpeaking(true);
      if (msgId !== undefined) setCurrentSpeakingMsgId(msgId);
    };

    u.onend = () => {
      setIsSpeaking(false);
      setCurrentSpeakingMsgId(null);
    };

    u.onerror = () => {
      setIsSpeaking(false);
      setCurrentSpeakingMsgId(null);
    };

    window.speechSynthesis.speak(u);
  };

  const stopSpeaking = () => {
    if (canSpeak) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setCurrentSpeakingMsgId(null);
    }
  };

  const offlineAnswer = (text: string, hadFile: boolean) => {
    if (hadFile) return T.offlineFile;
    const lower = text.toLowerCase();
    const hit = INTENTS.find((i) => i.keys.some((k) => lower.includes(k)));
    return hit ? (hit as any)[lang] : T.fallback;
  };

  const send = async (raw?: string, viaVoice?: boolean) => {
    const q = (raw || "").trim();
    if (loading || (!q && !pending)) return;

    stopSpeaking();

    const file = pending;
    const text = q || T.defaultFilePrompt;
    const userMsg = {
      id: Date.now(),
      from: "user",
      text,
      auto: !q,
      lang,
      file: file ? { name: file.name, size: file.size } : null,
    };
    const history = [...msgs, userMsg];
    const lower = text.toLowerCase();
    const urgent = INTENTS[0].keys.some((k) => lower.includes(k));

    setMsgs(history);
    setInput("");
    setPending(null);
    setNote("");
    setInterimText("");
    setLoading(true);

    const payload = history
      .filter((m) => !m.offline)
      .map((m) => {
        const item: any = { role: m.from === "user" ? "user" : "assistant", text: m.text };
        if (m === userMsg && file) item.file = { name: file.name, mediaType: file.mediaType, data: file.data };
        return item;
      });

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const timer = setTimeout(() => ctrl.abort(), 90000);

    try {
      const res = await fetch(COPILOT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, patient: PATIENT_CONTEXT, messages: payload }),
        signal: ctrl.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const botId = Date.now() + 1;
      const bot = {
        id: botId,
        from: "bot",
        lang,
        text: data.reply || T.errServer,
        extracted: data.extracted || null,
        followUps: Array.isArray(data.followUps) ? data.followUps.slice(0, 3) : [],
        urgent,
      };
      setMsgs((m) => [...m, bot]);

      if (speakOn || viaVoice) {
        say(bot.text, bot.lang, botId);
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      const answer = offlineAnswer(text, !!file);
      const botId = Date.now() + 1;
      setMsgs((m) => [...m, { id: botId, from: "bot", lang, text: answer, offline: true, urgent, followUps: [] }]);
      setNote(T.offline);
      if (speakOn || viaVoice) {
        say(answer, lang, botId);
      }
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  };

  const listen = () => {
    if (!SpeechRec) {
      setNote(T.noVoice);
      return;
    }
    if (listening) {
      try {
        recRef.current?.stop();
      } catch {}
      setListening(false);
      setInterimText("");
      return;
    }

    stopSpeaking();

    const r = new SpeechRec();
    const bcp47 = LANGS[lang]?.bcp47 || "en-IN";
    r.lang = bcp47;
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 1;

    r.onstart = () => {
      setListening(true);
      setInterimText("");
      setNote(
        lang === "te"
          ? "🎙️ వింటున్నాను… దయచేసి తెలుగులో మాట్లాడండి"
          : lang === "hi"
          ? "🎙️ सुन रहा हूं… कृपया हिन्दी में बोलिए"
          : "🎙️ Listening… Speak naturally in English"
      );
    };

    r.onresult = (e: any) => {
      let finalTranscript = "";
      let currentInterim = "";

      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
          finalTranscript += e.results[i][0].transcript;
        } else {
          currentInterim += e.results[i][0].transcript;
        }
      }

      if (currentInterim) {
        setInterimText(currentInterim);
        setInput(currentInterim);
      }

      if (finalTranscript.trim()) {
        setInterimText(finalTranscript);
        setInput(finalTranscript);
        setListening(false);
        send(finalTranscript, true);
      }
    };

    r.onerror = (e: any) => {
      console.warn("Speech recognition error:", e.error);
      setListening(false);
      setInterimText("");
      if (e.error === "not-allowed") {
        setNote(
          lang === "te"
            ? "మైక్రోఫోన్ అనుమతి నిరాకరించబడింది. దయచేసి బ్రౌజర్‌లో మైక్ అనుమతించండి."
            : lang === "hi"
            ? "माइक्रोफ़ोन एक्सेस अस्वीकृत। कृपया अपने ब्राउज़र में माइक्रोफ़ोन की अनुमति दें।"
            : "Microphone access was denied. Please allow microphone permissions in your browser."
        );
      } else {
        setNote("");
      }
    };

    r.onend = () => {
      setListening(false);
    };

    recRef.current = r;
    try {
      r.start();
    } catch (err) {
      console.warn("Speech recognition start failed:", err);
      setListening(false);
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const okType = file.type === "application/pdf" || file.type.startsWith("image/");
    if (!okType || file.size > MAX_FILE_BYTES) {
      setNote(T.fileBad);
      return;
    }
    try {
      const data = await readBase64(file);
      setPending({ name: file.name, size: file.size, mediaType: file.type, data });
      setNote("");
    } catch {
      setNote(T.fileBad);
    }
  };

  const changeLang = (k: string) => {
    stopAll();
    setNote("");
    setLang(k);
  };

  const newChat = () => {
    stopAll();
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = null;
    setMsgs([]);
    setPending(null);
    setInput("");
    setNote("");
    setInterimText("");
    setLoading(false);
  };

  if (!open) {
    return (
      <button type="button" className="ai-fab" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <Ico className="fab-icon">
          <AssistantIcon />
        </Ico>{" "}
        <span className="fab-label">{T.title}</span>
        <span className="fab-mic-badge">🎙️ Speak</span>
      </button>
    );
  }

  const lastBotIdx = msgs.map((m) => m.from).lastIndexOf("bot");

  return (
    <section
      className="ai-panel cx-panel"
      role="dialog"
      aria-label={T.title}
      onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
    >
      <div className="ai-head">
        <div className="ai-head-title">
          <Ico className="ai-ico">
            <AssistantIcon />
          </Ico>
          <div>
            <strong>{T.title}</strong>
            <span className="ai-head-sub">{LANGS[lang].label} Voice Copilot</span>
          </div>
        </div>
        <div className="cx-head-actions">
          {isSpeaking && (
            <button
              type="button"
              className="cx-speaking-badge"
              onClick={stopSpeaking}
              title="Assistant is speaking. Click to pause/stop."
            >
              <SpeakerIcon speaking />
              <span>Speaking… Stop</span>
            </button>
          )}
          {msgs.length > 0 && (
            <button type="button" className="cx-newchat" onClick={newChat}>
              {T.newChat}
            </button>
          )}
          <button type="button" className="ai-close" aria-label="Close assistant" onClick={() => setOpen(false)}>
            ✕
          </button>
        </div>
      </div>

      <div className="ai-tools">
        <div className="ai-langs" role="group" aria-label="Language">
          {Object.entries(LANGS).map(([k, v]) => (
            <button
              key={k}
              type="button"
              lang={k}
              aria-pressed={lang === k}
              className={lang === k ? "on" : ""}
              onClick={() => changeLang(k)}
            >
              {v.label}
            </button>
          ))}
        </div>

        {canSpeak && (
          <div className="ai-speak-row">
            <label className="ai-speak">
              <input
                type="checkbox"
                checked={speakOn}
                onChange={(e) => {
                  setSpeakOn(e.target.checked);
                  if (!e.target.checked) stopSpeaking();
                }}
              />
              <span>{T.speak}</span>
            </label>
            {isSpeaking && (
              <button type="button" className="stop-speech-mini-btn" onClick={stopSpeaking}>
                <StopSpeechIcon /> Stop Voice
              </button>
            )}
          </div>
        )}
      </div>

      <div className="ai-log" role="log" aria-live="polite">
        <div className="msg bot" lang={lang}>
          <div className="cx-text">{T.hello}</div>
          {canSpeak && (
            <button
              type="button"
              className="msg-listen"
              aria-label="Listen to welcome message"
              onClick={() => say(T.hello, lang)}
            >
              <SpeakerIcon /> Read aloud
            </button>
          )}
        </div>

        {msgs.map((m, i) => (
          <div key={m.id || i} className={`msg ${m.from}`} lang={m.lang}>
            {m.urgent && m.from === "bot" && (
              <div className="cx-emergency" role="alert">🚨 {(INTENTS[0] as any)[m.lang]}</div>
            )}

            {m.file && (
              <span className="file-chip">
                <Ico>📄</Ico>
                <span className="file-name">{m.file.name}</span>
                <small>{fmtSize(m.file.size)}</small>
              </span>
            )}

            {!(m.from === "user" && m.auto) && <div className="cx-text">{m.text}</div>}

            {m.extracted && <ExtractedCard data={m.extracted} T={AI_TEXT[m.lang]} />}

            {m.from === "bot" && canSpeak && (
              <div className="msg-actions">
                <button
                  type="button"
                  className={`msg-listen ${currentSpeakingMsgId === m.id ? "speaking" : ""}`}
                  aria-label="Listen to this reply"
                  onClick={() => {
                    if (currentSpeakingMsgId === m.id && isSpeaking) {
                      stopSpeaking();
                    } else {
                      say(m.text, m.lang, m.id);
                    }
                  }}
                >
                  <SpeakerIcon speaking={currentSpeakingMsgId === m.id} />
                  <span>{currentSpeakingMsgId === m.id ? "Stop voice" : "Speak aloud"}</span>
                </button>
              </div>
            )}

            {m.from === "bot" && i === lastBotIdx && m.followUps && m.followUps.length > 0 && !loading && (
              <div className="cx-followups">
                {m.followUps.map((f: string) => (
                  <button key={f} type="button" lang={m.lang} onClick={() => send(f)}>
                    💬 {f}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {listening && (
          <div className="msg user cx-voice-live" role="status">
            <div className="voice-pulse-indicator">
              <span className="pulse-bar" />
              <span className="pulse-bar" />
              <span className="pulse-bar" />
              <span className="pulse-bar" />
            </div>
            <div className="voice-live-text">
              <strong>{T.listening}</strong>
              <p>{interimText || T.listeningSub}</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="msg bot cx-typing" lang={lang} aria-live="polite">
            <span className="cx-dots" aria-hidden="true"><i /><i /><i /></span>
            {pending || (msgs.length && msgs[msgs.length - 1].file) ? T.readingFile : T.thinking}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {msgs.length === 0 && (
        <div className="ai-chips">
          {T.chips.map((c: string) => (
            <button key={c} type="button" lang={lang} onClick={() => send(c)}>
              💡 {c}
            </button>
          ))}
        </div>
      )}

      {note && <p className="ai-note" role="status">{note}</p>}

      {pending && (
        <div className="cx-pending">
          <span className="file-chip">
            <Ico>📄</Ico>
            <span className="file-name">{pending.name}</span>
            <small>{fmtSize(pending.size)}</small>
          </span>
          <button type="button" className="cx-remove" aria-label={T.removeFile} onClick={() => setPending(null)}>
            ✕
          </button>
        </div>
      )}

      <form
        className="ai-form"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <button
          type="button"
          className="attach"
          aria-label={T.attach}
          title={T.attach}
          onClick={() => fileRef.current && fileRef.current.click()}
        >
          <ClipIcon />
        </button>
        <input ref={fileRef} type="file" accept="application/pdf,image/*" hidden onChange={onFile} />

        {/* Dedicated Patient Voice Speech Button */}
        <button
          type="button"
          className={`mic ${listening ? "on" : ""}`}
          aria-label={`Speak in ${LANGS[lang].label}`}
          title={listening ? "Tap to finish speaking" : `Tap to speak in ${LANGS[lang].label}`}
          aria-pressed={listening}
          onClick={listen}
        >
          <MicIcon active={listening} />
          {listening && <span className="mic-pulse-ring" />}
        </button>

        <input
          aria-label={T.placeholder}
          placeholder={listening ? `Listening in ${LANGS[lang].label}…` : T.placeholder}
          lang={lang}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <button type="submit" className="send" disabled={loading || (!input.trim() && !pending)}>
          {T.send}
        </button>
      </form>

      <p className="ai-disclaimer">{T.disclaimer}</p>
    </section>
  );
}

/* =========================
   MAIN APP ROUTER (Patient & Doctor Only)
========================= */
const readHash = () => window.location.hash.replace("#/", "") || "dashboard";

function usePage(): [string, (p: string) => void] {
  const [page, setPageState] = useState(readHash);

  useEffect(() => {
    const onHash = () => setPageState(readHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const setPage = (p: string) => {
    window.location.hash = "/" + p;
  };
  return [page, setPage];
}

function MainApp({
  role, logout, lang, setLang, encounters, setEncounters, contact, setContact, emergencyCases, addEmergencyCase, patientProfile,
}: any) {
  const [rawPage, setPage] = usePage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [initialVoiceStart, setInitialVoiceStart] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [notice, setNotice] = useState("");
  const [shares, setShares] = useState<any[]>([]);

  const [pendingReqs, setPendingReqs] = useState(() =>
    TODAY_PATIENTS.filter((p) => !p.done)
      .slice(0, 5)
      .map((p) => ({ ...p, requestTime: p.time }))
  );
  const [approvedReqs, setApprovedReqs] = useState<any[]>([]);

  const approveReq = (id: string) => {
    const p = pendingReqs.find((x) => x.id === id);
    if (!p) return;
    setPendingReqs(pendingReqs.filter((x) => x.id !== id));
    setApprovedReqs([p, ...approvedReqs]);
  };

  const startSession = (sess: any) => {
    setSession(sess);
    setNotice("");
    if (sess.emergency) {
      addEmergencyCase({
        healthId: sess.healthId,
        name: sess.name,
        reason: sess.reason || "",
        time: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
      });
    }
  };

  const endSession = (msg: string) => {
    setSession(null);
    setNotice(msg);
  };

  const finishSession = () =>
    endSession(
      session && session.emergency
        ? "Emergency case saved. You can verify the next patient now."
        : "Access ended. Patient records are locked again."
    );

  const resumeCase = (c: any) => {
    const known = isIdentifiedId(c.healthId);
    setSession({
      name: c.name,
      healthId: c.healthId,
      mobile: null,
      anonymous: !known,
      merged: known,
      scope: SCOPES.map((s) => s[0]),
      expiresAt: null,
      emergency: true,
      reason: c.reason,
    });
    setNotice("");
    setPage("records");
  };

  const openVoiceCopilot = () => {
    setInitialVoiceStart(true);
    setAiOpen(true);
  };

  const page = NAV[role]?.some((n) => n[0] === rawPage) ? rawPage : "dashboard";
  const title =
    page === "dashboard"
      ? `${AUTH_TEXT[lang].roleTitle[role]} ${PAGE_TEXT[lang].dashboardWord}`
      : PAGE_TEXT[lang].nav[role]?.[page] || "Dashboard";

  useEffect(() => {
    document.title = `${title} | SMART-MEDX`;
    const main = document.getElementById("main");
    if (main && (main as any).scrollTo) (main as any).scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, [title]);

  const renderPage = () => {
    const special: Record<string, Record<string, React.ReactNode>> = {
      patient: {
        dashboard: (
          <PatientDashboard
            goTo={setPage}
            onAssistant={() => {
              setInitialVoiceStart(false);
              setAiOpen(true);
            }}
            onStartVoice={openVoiceCopilot}
            lang={lang}
            contact={contact}
            setContact={setContact}
            userName={patientProfile?.name}
          />
        ),
        doctors: (
          <DoctorsDirectory
            lang={lang}
            patientName={patientProfile?.name || "E. Sai Charan"}
            patientId={patientProfile?.uid || "pt-default"}
          />
        ),
        consent: <ConsentManager />,
        profile: <PatientProfile contact={contact} goTo={setPage} userName={patientProfile?.name} />,
        ai: (
          <>
            <GenericPage description={GENERIC.patient.ai[0]} items={GENERIC.patient.ai[1]} />
            <div className="action-row">
              <button
                type="button"
                className="primary-btn small-btn"
                onClick={openVoiceCopilot}
              >
                🎙️ Speak to Gemini Copilot
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setInitialVoiceStart(false);
                  setAiOpen(true);
                }}
              >
                💬 Open Chat &amp; Attach Reports
              </button>
            </div>
          </>
        ),
      },
      doctor: {
        dashboard: (
          <DoctorDashboard
            goTo={setPage}
            session={session}
            encounters={encounters}
            lang={lang}
            pending={pendingReqs}
            approved={approvedReqs}
            onApprove={approveReq}
          />
        ),
        doctors: (
          <DoctorsDirectory
            lang={lang}
            patientName={session?.name || "Doctor Staff"}
          />
        ),
        patients: (
          <PatientVerification
            session={session}
            onStart={startSession}
            onEnd={finishSession}
            goTo={setPage}
          />
        ),
        records: session ? (
          <HealthRecordsView session={session} encounters={encounters} />
        ) : (
          <Locked goTo={setPage} lang={lang} />
        ),
        emergencyRecords: (
          <DoctorEmergencyRecords
            encounters={encounters}
            cases={emergencyCases}
            onResume={resumeCase}
            activeId={session ? session.healthId : null}
          />
        ),
        encounter: session ? (
          <NewEncounter
            session={session}
            saved={encounters}
            onSave={(enc: any) => setEncounters([enc, ...encounters])}
            goTo={setPage}
          />
        ) : (
          <Locked goTo={setPage} lang={lang} />
        ),
        sharing: session ? (
          <SecureSharing session={session} shares={shares} setShares={setShares} />
        ) : (
          <Locked goTo={setPage} lang={lang} />
        ),
      },
    };

    if (special[role]?.[page]) return special[role][page];

    const [description, items] = GENERIC[role]?.[page] || ["", []];
    return <GenericPage description={description} items={items} />;
  };

  return (
    <div className="app-layout">
      <Sidebar
        role={role}
        page={page}
        setPage={setPage}
        logout={logout}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        lang={lang}
      />

      <main className="main-content" id="main" tabIndex={-1}>
        <TopBar
          role={role}
          title={title}
          onMenu={() => setMenuOpen(true)}
          lang={lang}
          onVoiceOpen={openVoiceCopilot}
          userName={patientProfile?.name}
        />
        <div className="content-area">
          {role === "doctor" && session && (
            <SessionBar
              session={session}
              onEnd={finishSession}
              onExpire={() =>
                endSession(`Access to ${session.name} has ended automatically. Verify the patient again to continue.`)
              }
            />
          )}
          {role === "doctor" && notice && (
            <div className="alert-card" role="status">{notice}</div>
          )}
          {renderPage()}
        </div>
        <footer className="gov-footer" lang={lang}>
          {PAGE_TEXT[lang].footer}
        </footer>
      </main>

      {role === "patient" && (
        <HealthAssistant
          open={aiOpen}
          setOpen={setAiOpen}
          initialVoiceStart={initialVoiceStart}
          lang={lang}
          setLang={setLang}
        />
      )}
    </div>
  );
}

/* =========================
   APP ROOT
========================= */
export default function App() {
  const [role, setRole] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [size, setSize] = useState(1);
  const [contrast, setContrast] = useState(false);
  const [lang, setLang] = useState("en");

  const [patientProfile, setPatientProfile] = useState<any>({
    name: "E. Sai Charan",
    mobile: "9876543210",
    email: "esr272007@gmail.com",
  });

  const [encounters, setEncounters] = useState<any[]>([]);
  const [emergencyCases, setEmergencyCases] = useState<any[]>([]);
  const [contact, setContact] = useState(BLANK_CONTACT);

  const addEmergencyCase = (c: any) => setEmergencyCases((list) => [c, ...list]);

  useEffect(() => {
    document.documentElement.style.fontSize = ["90%", "100%", "115%"][size];
  }, [size]);

  useEffect(() => {
    document.body.classList.toggle("high-contrast", contrast);
  }, [contrast]);

  const logout = () => {
    window.location.hash = "";
    setAuthenticated(false);
    setRole(null);
  };

  let screen;

  if (!role) {
    screen = <RoleSelection onSelect={setRole} lang={lang} setLang={setLang} />;
  } else if (!authenticated) {
    screen =
      role === "patient" ? (
        <PatientAuth
          onBack={() => setRole(null)}
          onLogin={(profileData: any) => {
            if (profileData) {
              setPatientProfile((prev: any) => ({ ...prev, ...profileData }));
              if (profileData.mobile) {
                setContact((prev: any) => ({ ...prev, mobile: profileData.mobile }));
              }
            }
            setAuthenticated(true);
          }}
          lang={lang}
          setPatientProfile={setPatientProfile}
        />
      ) : (
        <LoginForm
          role={role}
          onBack={() => setRole(null)}
          onLogin={() => setAuthenticated(true)}
          lang={lang}
        />
      );
  } else {
    screen = (
      <MainApp
        role={role}
        logout={logout}
        lang={lang}
        setLang={setLang}
        encounters={encounters}
        setEncounters={setEncounters}
        contact={contact}
        setContact={setContact}
        emergencyCases={emergencyCases}
        addEmergencyCase={addEmergencyCase}
        patientProfile={patientProfile}
      />
    );
  }

  return (
    <>
      <GovStrip size={size} setSize={setSize} contrast={contrast} setContrast={setContrast} />
      {screen}
    </>
  );
}
