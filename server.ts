import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const MODELS = ["gemini-3.1-flash-lite", "gemini-3-flash-preview", "gemini-3.8-flash"];

const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: "20mb" }));

const LANG_NAMES: Record<string, string> = {
  en: "English",
  hi: "Hindi (हिन्दी)",
  te: "Telugu (తెలుగు)",
};

const FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

// Simple in-memory rate limiter: 30 requests / minute / IP
const hits = new Map<string, number[]>();
const isRateLimited = (ip: string) => {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 30;
};

// Lazy-initialized GoogleGenAI client
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

const TARGET_SCRIPT: Record<string, string> = {
  en: "English",
  hi: "Hindi language written in Devanagari script (हिन्दी)",
  te: "Telugu language written in Telugu script (తెలుగు)",
};

const systemPrompt = (lang: string, patient: any) => `
You are the SMART-MEDX Health Copilot, a warm, patient, empathetic, and culturally aware multilingual healthcare assistant for patients and families in India.
You converse like a knowledgeable, caring physician friend—never like a robotic textbook or cold bureaucratic form.

MANDATORY CRITICAL LANGUAGE DIRECTIVE:
- The patient has chosen language: ${LANG_NAMES[lang] || "English"} (${TARGET_SCRIPT[lang] || "English"}).
- You MUST write your ENTIRE "reply" and all "followUps" in ${TARGET_SCRIPT[lang] || "English"}!
- If the selected language is Telugu ('te'): Your ENTIRE explanation MUST be in Telugu script (తెలుగు లిపి). Do NOT reply in English! Example greeting: "నమస్కారం! మీ ఆరోగ్య వివరాలను నేను పరిశీలించాను...".
- If the selected language is Hindi ('hi'): Your ENTIRE explanation MUST be in Hindi Devanagari script (हिन्दी लिपि). Do NOT reply in English! Example greeting: "नमस्ते! मैंने आपकी स्वास्थ्य रिपोर्ट देखी है...".
- Even if the patient's input prompt or attached document is in English, you MUST translate and explain everything in ${TARGET_SCRIPT[lang]}!
- ONLY pharmaceutical drug brand names (e.g., Azithromycin, Paracetamol) and test acronyms (e.g., CBC, HbA1c) may be kept in English in brackets alongside the explanation, for example: "హిమోగ్లోబిన్ (Hemoglobin)" or "రక్తపోటు (BP)".
- Every single follow-up question in "followUps" MUST also be written in ${TARGET_SCRIPT[lang]}.

WHEN A DOCUMENT (lab report, prescription, discharge summary, scan report) IS ATTACHED:
1. Extract data faithfully into "extracted". Never invent or hallucinate numbers or names. If a value or test is illegible or blurry, omit it and mention the unreadable part gently in the reply.
2. In "reply", explain in rich, easy-to-understand detail in ${TARGET_SCRIPT[lang]}:
   - Identify what the document is, which clinic/hospital issued it, and the date.
   - For each lab parameter: what it measures in the body, whether it is low, normal, or high compared to the reference range on the report, general potential causes (including harmless lifestyle factors like hydration, fasting, or diet), and what questions the patient should bring to their doctor.
   - For each medication: what condition it is typically prescribed for, instructions for taking it, common known side effects, and precautions.
   - Crucially check EVERY medicine against the patient's recorded allergies and current medications below. If there is a conflict (such as a Penicillin allergy and any penicillin-class or beta-lactam antibiotic, or dangerous drug interactions), highlight this warning prominently in your reply!
   - Conclude with a clear, comforting summary and 2-3 specific questions for their next consultation.
3. If the patient name printed on the document doesn't match the active profile (${patient?.firstName || "the patient"}), gently note this discrepancy.

SAFETY RULES:
- Never provide a formal clinical diagnosis, never prescribe drugs, and never advise stopping or modifying a doctor-prescribed dose. Always recommend confirming interpretations with a qualified doctor.
- If there are indicators of an acute medical emergency (such as crushing chest pain, difficulty breathing, stroke symptoms, uncontrolled bleeding, poisoning, loss of consciousness), provide URGENT life-saving direction FIRST: "Emergency advice: Call 108 (ambulance) or 112 immediately or rush to the nearest casualty / hospital."
- Do not repeat personal identification numbers like phone numbers.

PATIENT PROFILE (from SMART-MEDX Health Record):
${JSON.stringify(patient || {}, null, 2)}
`;

app.post("/api/copilot", async (req, res) => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || "unknown";
    if (isRateLimited(clientIp)) {
      return res.status(429).json({ error: "Too many requests. Please wait a minute." });
    }

    const { lang, patient, messages } = req.body || {};
    if (!LANG_NAMES[lang] || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Invalid request payload." });
    }

    // Keep the last 15 turns and ensure conversation starts with a user turn
    const rawTurns = messages
      .slice(-15)
      .filter((m) => m && (m.role === "user" || m.role === "assistant"));

    while (rawTurns.length && rawTurns[0].role !== "user") {
      rawTurns.shift();
    }

    if (!rawTurns.length) {
      return res.status(400).json({ error: "Conversation must contain at least one user message." });
    }

    const ai = getGenAI();

    // Map conversation turns to Gemini's { role: 'user' | 'model', parts: [...] }
    const geminiContents = rawTurns.map((turn, idx) => {
      const parts: any[] = [];

      // Add attached file if present in this user turn
      if (turn.role === "user" && turn.file && turn.file.data) {
        const mimeType = turn.file.mediaType || "application/pdf";
        if (FILE_TYPES.includes(mimeType)) {
          parts.push({
            inlineData: {
              mimeType,
              data: turn.file.data,
            },
          });
        }
      }

      let textContent = String(turn.text || "(no text content)").slice(0, 5000);

      // Crucial directive: if this is the final user turn, reinforce the required language
      if (idx === rawTurns.length - 1 && turn.role === "user") {
        if (lang === "te") {
          textContent += `\n\n[MANDATORY DIRECTIVE: Reply strictly and 100% in TELUGU using Telugu script (తెలుగు లిపి). Do NOT write English sentences. The patient specifically requested Telugu language.]`;
        } else if (lang === "hi") {
          textContent += `\n\n[MANDATORY DIRECTIVE: Reply strictly and 100% in HINDI using Devanagari script (हिन्दी लिपि). Do NOT write English sentences. The patient specifically requested Hindi language.]`;
        }
      }

      parts.push({
        text: textContent,
      });

      return {
        role: turn.role === "assistant" ? "model" : "user",
        parts,
      };
    });

    let response: any;
    let lastErr: any;

    for (const currentModel of MODELS) {
      try {
        response = await ai.models.generateContent({
          model: currentModel,
          contents: geminiContents,
          config: {
            systemInstruction: systemPrompt(lang, patient),
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                reply: {
                  type: Type.STRING,
                  description: `Warm, empathetic plain-text explanation strictly in ${TARGET_SCRIPT[lang] || "English"}. If Telugu, write in Telugu script (తెలుగు); if Hindi, write in Devanagari script (हिन्दी). Use blank lines between short paragraphs.`,
                },
                hasDocumentExtracted: {
                  type: Type.BOOLEAN,
                  description: "True if a medical report, prescription, or lab document was attached and analyzed; false otherwise.",
                },
                extracted: {
                  type: Type.OBJECT,
                  description: "Structured medical document data if a document was attached.",
                  properties: {
                    documentType: { type: Type.STRING, description: "Type of document, e.g. Lab Report, Prescription, Discharge Summary" },
                    date: { type: Type.STRING, description: "Date printed on document" },
                    provider: { type: Type.STRING, description: "Laboratory, hospital, or physician name" },
                    patientName: { type: Type.STRING, description: "Patient name on the document" },
                    labResults: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          test: { type: Type.STRING },
                          value: { type: Type.STRING },
                          unit: { type: Type.STRING },
                          referenceRange: { type: Type.STRING },
                          status: {
                            type: Type.STRING,
                            enum: ["low", "normal", "high", "abnormal", "unknown"],
                          },
                        },
                        required: ["test", "value"],
                      },
                    },
                    medicines: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          dose: { type: Type.STRING },
                          frequency: { type: Type.STRING },
                          duration: { type: Type.STRING },
                        },
                        required: ["name"],
                      },
                    },
                    diagnoses: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    notes: { type: Type.STRING },
                  },
                },
                followUps: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: `Up to 3 short follow-up questions the patient might ask next, strictly written in ${TARGET_SCRIPT[lang] || "English"}.`,
                },
              },
              required: ["reply", "followUps"],
            },
          },
        });
        if (response) break;
      } catch (err: any) {
        lastErr = err;
        console.warn(`Model ${currentModel} error:`, err?.message || err);
      }
    }

    if (!response) {
      throw lastErr || new Error("Failed to generate content after retries.");
    }

    const rawText = response.text || "";
    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      const s = rawText.indexOf("{");
      const e = rawText.lastIndexOf("}");
      if (s >= 0 && e > s) {
        try {
          parsed = JSON.parse(rawText.slice(s, e + 1));
        } catch {
          parsed = { reply: rawText, extracted: null, followUps: [] };
        }
      } else {
        parsed = { reply: rawText, extracted: null, followUps: [] };
      }
    }

    // Determine if structured document extraction has real content
    let finalExtracted: any = null;
    if (parsed.hasDocumentExtracted && parsed.extracted) {
      const ex = parsed.extracted;
      const hasMeaningfulData =
        (Array.isArray(ex.labResults) && ex.labResults.length > 0) ||
        (Array.isArray(ex.medicines) && ex.medicines.length > 0) ||
        (Array.isArray(ex.diagnoses) && ex.diagnoses.length > 0) ||
        Boolean(ex.documentType);

      if (hasMeaningfulData) {
        finalExtracted = ex;
      }
    }

    res.json({
      reply: typeof parsed.reply === "string" ? parsed.reply : rawText,
      extracted: finalExtracted,
      followUps: Array.isArray(parsed.followUps) ? parsed.followUps.slice(0, 3) : [],
    });
  } catch (err: any) {
    console.error("Copilot backend error:", err?.message || err);
    res.status(500).json({
      error: "Health Copilot service unavailable",
      details: err?.message || "Internal error",
    });
  }
});

// In-memory backend data stores with persistent in-memory state
interface PatientRecord {
  uid: string;
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  authMethod: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  address?: string;
  medicalHistory?: string;
  createdAt: string;
  updatedAt: string;
}

interface DoctorRecord {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  rating: number;
  phone: string;
  email: string;
  availableDays: string;
  consultationFee: string;
  hospital: string;
  bio: string;
  avatar: string;
  createdAt: string;
}

interface AppointmentRecord {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  symptoms?: string;
  status: "confirmed" | "completed" | "cancelled";
  createdAt: string;
}

const serverPatients = new Map<string, PatientRecord>();
const serverDoctors = new Map<string, DoctorRecord>([
  [
    "doc-1",
    {
      id: "doc-1",
      name: "Dr. Ananya Sharma",
      specialty: "Senior Cardiologist & Heart Specialist",
      experience: "14 years exp",
      rating: 4.9,
      phone: "+91 98450 12345",
      email: "ananya.sharma@smartmedx.org",
      availableDays: "Mon - Fri (10:00 AM - 04:00 PM)",
      consultationFee: "₹800",
      hospital: "SmartMedX Heart & Vascular Center",
      bio: "Specializes in preventive cardiology, coronary interventions, hypertension, and arrhythmia management with over 5,000 successful clinical cases.",
      avatar: "👩‍⚕️",
      createdAt: new Date().toISOString(),
    },
  ],
  [
    "doc-2",
    {
      id: "doc-2",
      name: "Dr. Rajesh K. Varma",
      specialty: "Consultant Neurologist & Stroke Care",
      experience: "18 years exp",
      rating: 4.85,
      phone: "+91 98450 23456",
      email: "rajesh.varma@smartmedx.org",
      availableDays: "Mon, Wed, Sat (11:00 AM - 05:00 PM)",
      consultationFee: "₹950",
      hospital: "NeuroHealth Advanced Institute",
      bio: "Expert in neuro-diagnostics, chronic migraine therapy, neuro-rehabilitation, and acute stroke treatment protocols.",
      avatar: "👨‍⚕️",
      createdAt: new Date().toISOString(),
    },
  ],
  [
    "doc-3",
    {
      id: "doc-3",
      name: "Dr. Priya Sundaram",
      specialty: "Chief Pediatrician & Child Wellness",
      experience: "11 years exp",
      rating: 4.95,
      phone: "+91 98450 34567",
      email: "priya.sundaram@smartmedx.org",
      availableDays: "Daily except Sun (09:00 AM - 02:00 PM)",
      consultationFee: "₹650",
      hospital: "Little Blossoms Pediatric Care",
      bio: "Compassionate pediatrician with expertise in neonatal care, developmental milestones, childhood immunization, and pediatric nutrition.",
      avatar: "👩‍⚕️",
      createdAt: new Date().toISOString(),
    },
  ],
  [
    "doc-4",
    {
      id: "doc-4",
      name: "Dr. Vikram Reddy",
      specialty: "General Physician & Internal Medicine",
      experience: "16 years exp",
      rating: 4.8,
      phone: "+91 98450 45678",
      email: "vikram.reddy@smartmedx.org",
      availableDays: "Mon - Sat (08:30 AM - 01:30 PM, 05:00 PM - 08:00 PM)",
      consultationFee: "₹500",
      hospital: "Apex Multispecialty Clinic",
      bio: "Dedicated family physician with extensive experience in managing lifestyle conditions (diabetes, cholesterol), viral infections, and holistic medicine.",
      avatar: "👨‍⚕️",
      createdAt: new Date().toISOString(),
    },
  ],
  [
    "doc-5",
    {
      id: "doc-5",
      name: "Dr. Sneha Mukherjee",
      specialty: "Consultant Pulmonologist & Chest Physician",
      experience: "12 years exp",
      rating: 4.88,
      phone: "+91 98450 56789",
      email: "sneha.m@smartmedx.org",
      availableDays: "Tue, Thu, Sat (12:00 PM - 06:00 PM)",
      consultationFee: "₹750",
      hospital: "BreatheWell Pulmonary Clinic",
      bio: "Leading specialist in asthma, respiratory infections, COPD, allergy therapies, and post-viral pulmonary rehabilitation.",
      avatar: "👩‍⚕️",
      createdAt: new Date().toISOString(),
    },
  ],
]);
const getTodayDateStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const serverAppointments: AppointmentRecord[] = [
  {
    id: "appt-seed-1",
    patientId: "pt-seed-1",
    patientName: "Rahul Verma",
    doctorId: "doc-1",
    doctorName: "Dr. Ananya Sharma",
    specialty: "Senior Cardiologist & Heart Specialist",
    date: getTodayDateStr(),
    time: "10:30 AM",
    symptoms: "Routine cardiac evaluation and ECG review",
    status: "confirmed",
    createdAt: new Date().toISOString(),
  },
  {
    id: "appt-seed-2",
    patientId: "pt-seed-2",
    patientName: "Sunita Devi",
    doctorId: "doc-2",
    doctorName: "Dr. Rajesh K. Varma",
    specialty: "Consultant Neurologist & Stroke Care",
    date: getTodayDateStr(),
    time: "02:00 PM",
    symptoms: "Migraine follow-up and prescription refill",
    status: "confirmed",
    createdAt: new Date().toISOString(),
  },
];
const serverCopilotLogs: any[] = [];

// API: Save or update patient login/signup profile
app.post("/api/patients", (req, res) => {
  try {
    const data = req.body;
    if (!data || (!data.uid && !data.id && !data.phone && !data.email)) {
      return res.status(400).json({ error: "Missing required patient identification" });
    }
    const uid = data.uid || data.id || `pt-${Date.now()}`;
    const existing = serverPatients.get(uid);
    const updated: PatientRecord = {
      uid,
      id: uid,
      name: data.name || (existing ? existing.name : "Patient"),
      email: data.email || (existing ? existing.email : undefined),
      phone: data.phone || (existing ? existing.phone : undefined),
      authMethod: data.authMethod || (existing ? existing.authMethod : "email"),
      age: data.age !== undefined ? Number(data.age) : existing?.age,
      gender: data.gender || existing?.gender,
      bloodGroup: data.bloodGroup || existing?.bloodGroup,
      emergencyContact: data.emergencyContact || existing?.emergencyContact,
      address: data.address || existing?.address,
      medicalHistory: data.medicalHistory || existing?.medicalHistory,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    serverPatients.set(uid, updated);
    console.log(`[Backend] Stored patient details for UID: ${uid} (${updated.name})`);
    res.json({ success: true, patient: updated });
  } catch (err: any) {
    console.error("Failed to store patient details:", err);
    res.status(500).json({ error: "Failed to store patient details" });
  }
});

// API: Get patient profile by UID
app.get("/api/patients/:uid", (req, res) => {
  const uid = req.params.uid;
  const pt = serverPatients.get(uid);
  if (pt) {
    return res.json({ success: true, patient: pt });
  }
  res.status(404).json({ error: "Patient record not found" });
});

// API: Get all doctors
app.get("/api/doctors", (_req, res) => {
  const doctors = Array.from(serverDoctors.values());
  res.json({ success: true, doctors });
});

// API: Add or update a doctor's details
app.post("/api/doctors", (req, res) => {
  try {
    const data = req.body;
    if (!data || !data.name || !data.specialty) {
      return res.status(400).json({ error: "Doctor name and specialty are required" });
    }
    const id = data.id || `doc-${Date.now()}`;
    const newDoc: DoctorRecord = {
      id,
      name: data.name,
      specialty: data.specialty,
      experience: data.experience || "10+ years exp",
      rating: data.rating ? Number(data.rating) : 4.9,
      phone: data.phone || "+91 98450 00000",
      email: data.email || `${data.name.toLowerCase().replace(/[^a-z]/g, "")}@smartmedx.org`,
      availableDays: data.availableDays || "Mon - Fri (10:00 AM - 04:00 PM)",
      consultationFee: data.consultationFee || "₹600",
      hospital: data.hospital || "SmartMedX Healthcare Network",
      bio: data.bio || "Dedicated specialist providing evidence-based patient consultations and compassionate medical care.",
      avatar: data.avatar || "👨‍⚕️",
      createdAt: new Date().toISOString(),
    };
    serverDoctors.set(id, newDoc);
    console.log(`[Backend] Stored doctor details for: ${newDoc.name} (${id})`);
    res.json({ success: true, doctor: newDoc });
  } catch (err: any) {
    console.error("Failed to store doctor details:", err);
    res.status(500).json({ error: "Failed to store doctor details" });
  }
});

// API: Book appointment with collision prevention & past date rejection
app.post("/api/appointments", (req, res) => {
  try {
    const data = req.body;
    if (!data || !data.patientId || !data.doctorId || !data.date || !data.time) {
      return res.status(400).json({ error: "Missing appointment booking fields" });
    }

    const todayStr = getTodayDateStr();
    if (data.date < todayStr) {
      return res.status(400).json({
        error: "Cannot book an appointment for a past date. Please select today or an upcoming date.",
        invalidDate: true,
      });
    }

    // Collision check: prevent double booking the same doctor at the same date and time
    const collision = serverAppointments.find(
      (a) =>
        a.doctorId === data.doctorId &&
        a.date === data.date &&
        a.time === data.time &&
        a.status !== "cancelled"
    );

    if (collision) {
      return res.status(409).json({
        error: `Slot collision: Dr. ${collision.doctorName || "Doctor"} is already booked for ${data.time} on ${data.date}. Please pick an open slot.`,
        collision: true,
      });
    }

    const appt: AppointmentRecord = {
      id: data.id || `appt-${Date.now()}`,
      patientId: data.patientId,
      patientName: data.patientName || "Patient",
      doctorId: data.doctorId,
      doctorName: data.doctorName || "Doctor",
      specialty: data.specialty || "General Medicine",
      date: data.date,
      time: data.time,
      symptoms: data.symptoms || "",
      status: "confirmed",
      createdAt: new Date().toISOString(),
    };
    serverAppointments.push(appt);
    console.log(`[Backend] Stored appointment ${appt.id} for ${appt.patientName} with ${appt.doctorName} on ${appt.date} at ${appt.time}`);
    res.json({ success: true, appointment: appt });
  } catch (err: any) {
    console.error("Failed to book appointment:", err);
    res.status(500).json({ error: "Failed to book appointment" });
  }
});

// API: Get appointments with filters by patient, doctor, and date
app.get("/api/appointments", (req, res) => {
  const patientId = req.query.patientId as string;
  const doctorId = req.query.doctorId as string;
  const date = req.query.date as string;

  let list = serverAppointments;
  if (patientId) {
    list = list.filter((a) => a.patientId === patientId);
  }
  if (doctorId) {
    list = list.filter((a) => a.doctorId === doctorId);
  }
  if (date) {
    list = list.filter((a) => a.date === date);
  }
  res.json({ success: true, appointments: list });
});

// API: Cancel an appointment and free up the slot
app.delete("/api/appointments/:id", (req, res) => {
  const id = req.params.id;
  const appt = serverAppointments.find((a) => a.id === id);
  if (appt) {
    appt.status = "cancelled";
    console.log(`[Backend] Cancelled appointment ${id}. Slot ${appt.time} on ${appt.date} freed up.`);
    return res.json({ success: true, message: "Appointment cancelled and slot freed up" });
  }
  res.status(404).json({ error: "Appointment not found" });
});

// API: Log copilot conversation
app.post("/api/chat/sync", (req, res) => {
  const data = req.body;
  if (data) {
    serverCopilotLogs.push({ ...data, receivedAt: new Date().toISOString() });
  }
  res.json({ success: true });
});


app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "SMART-MEDX Health Copilot API",
    provider: "Google Gemini",
    model: MODELS[0],
  });
});

// Vite middleware for dev or static serving for prod
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SMART-MEDX Health Copilot server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
