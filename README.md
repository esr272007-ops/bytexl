
🏥 Smart-MedX Health Copilot

Unified Digital Health Portal, Consent-Based Access Control, and Multilingual AI Clinical Assistant
Developed for HacXLerate Hackathon


🌟 Overview

Smart-MedX is a next-generation digital healthcare platform designed to bridge the gap between patients, doctors, and emergency response units. Inspired by national digital health frameworks like ABDM, it offers a secure, consent-driven repository for electronic health records (EHR).
The platform is integrated with an advanced Google Gemini-powered AI Copilot that assists with medical summarization, prescription safety checks, document OCR parsing, and multilingual voice interactions.

🎯 The Problem & Our Solution

The Problem :

• Fragmented Health Records: Patients carry physical files or lose their medical history across different clinics.
• Language Barriers: Non-English speaking patients struggle to understand complex prescriptions and medical jargon.
• Consent Issues: Medical data is often shared without explicit patient permission, risking data privacy.
• Emergency Delays: First responders lack immediate access to critical data like blood groups or severe allergies during accidents.

Our Solution

Smart-MedX solves this by creating a centralized, patient-controlled health repository protected by granular consent architecture, backed by a multilingual AI helper to democratize healthcare understanding to save lives.



## 🚀 Key Features

 🚀 Key Features
🛡️ Core Health & Privacy Infrastructure
• Secure ABHA-Style Health ID & Auth: Simulated multi-tier authentication with strict patient/doctor role separation.
• Granular Consent Management: Patients retain total control over who views their medical history, featuring real-time access revocation toggles.
• Emergency Override Mode: Fast-track protocol for emergency medical responders to access critical vitals and blood groups instantly without waiting for OTP validation.


🤖 AI Clinical Copilot (Powered by @google/genai)

• Multilingual Voice Assistant: Supports interactive audio queries and medical explanations in English, Hindi, and Telugu.
• Prescription Safety Guard: Automatically cross-references new doctor prescriptions against known patient allergies (e.g., triggering alerts for penicillin contraindications).
• OCR Document Parser: Upload scans of legacy handwritten prescriptions or lab reports to automatically parse, structure, and plot clinical metrics.
 
♿ Inclusivity & Compliance

• Accessible GIGW-Compliant UI: Built-in accessibility toolbar featuring font scaling, high-contrast themes, and screen-reader optimizations to meet Government of India web guidelines.

---


🛠️ Tech Stack

• Frontend: React.js, TypeScript, Vite, Tailwind CSS, Lucide Icons
• AI / ML Integration: Official @google/genai SDK (Gemini Pro / Flash Models)
• Backend & Database: Node.js, Express, Firebase Firestore & Authentication
• State Management & Routing: React Router v6, React Context API
• Deployment: Vercel / Netlify


---

📂 Project Structure

smart-medx/
├── public/              # Static assets, icons, and manifests
├── src/
│   ├── components/      # Reusable UI (Modals, Navigation, Accessibility Toolbar)
│   ├── context/         # Global state (Auth Context, Patient Records, Consent Rules)
│   ├── pages/           # Primary views (Patient Dashboard, Doctor Portal, Emergency View)
│   ├── services/        # External API integrations (Gemini AI service wrapper, OCR handling)
│   ├── types/           # TypeScript interface definitions (patient.d.ts, medical.d.ts)
│   ├── App.tsx          # Main routing and layout wrapper
│   └── main.tsx         # Application entry point
├── package.json         # Project dependencies and scripts
├── tailwind.config.js   # Tailwind CSS styling configuration
└── README.md            # Project documentation

## 🔮 The Future Roadmap

To transition the Smart-MedX AI Clinical Assistant from a reactive helper into an autonomous, proactive health ecosystem, the next phases of development will focus on three key pillars:

### 1. Multi-Modal Native Processing (Beyond Text OCR)
* **Real-time Diagnostic Image Analysis:** Instead of just parsing text reports, the AI will use advanced multi-modal models to cross-verify actual X-rays, MRIs, and CT scans against the written radiologist report to flag discrepancies or secondary findings.
* **Audio-to-EHR Automated Charting:** During a patient-doctor consultation, the AI will ambiently listen (with consent), filter out casual talk, and automatically generate a structured medical note (SOAP note), fill out prescription fields, and queue up follow-up dates in the EHR, saving doctors hours of paperwork.

### 2. Proactive Drug-Drug & Genomic Safety Guards
* **Genomic Customization:** The AI will cross-reference newly prescribed medications not just with basic allergies, but with the patient's pharmacogenomic data (if available) to predict drug efficacy and prevent adverse drug reactions (ADRs) unique to their DNA.
* **Real-time Cross-Brand Contraindication:** In India, the same generic drug is sold under hundreds of brand names. The AI will immediately map brand names to active pharmaceutical ingredients (APIs) to prevent accidental over-prescription or toxic combinations.

### 3. Edge-AI & Low-Connectivity Adaptability
* **On-Device Micro-Models:** For rural health camps with zero internet, the platform will utilize distilled, lightweight models (like Gemini Nano) running directly on cheap Android tablets to empower community health workers with offline, voice-guided diagnostics.

---

### 🗺️ AI Evolution Milestones

| Phase | Milestone | Focus Area |
| :--- | :--- | :--- |
| **Phase 1 (Current)** | **Reactive Copilot** | Document OCR parsing, basic multilingual voice queries, and static allergy cross-checks. |
| **Phase 2 (Near-Term)** | **Ambient Copilot** | Consultation audio dictation-to-EHR, computer vision diagnostics, and brand-to-API mapping. |
| **Phase 3 (Long-Term)** | **Predictive Agent** | Completely offline edge-AI deployment, genomic custom drug safety, and telemetry monitoring. |
