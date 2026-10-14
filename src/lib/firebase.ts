import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Standard Google Provider for regular login (requests only standard profile/email)
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({ prompt: "select_account" });
export const googleLoginProvider = googleAuthProvider;

// In-memory token storage (never localStorage for OAuth tokens)
let cachedAccessToken: string | null = null;

export const getAccessToken = () => cachedAccessToken;
export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

// Sign in with Google
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }
    return { user: result.user, accessToken: cachedAccessToken, cancelled: false };
  } catch (err: any) {
    const isCancelled =
      err?.code === "auth/user-cancelled" ||
      err?.code === "auth/popup-closed-by-user" ||
      err?.code === "auth/cancelled-popup-request" ||
      (typeof err?.message === "string" && err.message.includes("user-cancelled"));

    if (isCancelled) {
      console.warn("Google sign-in popup was cancelled or permission declined.");
      return { user: null, accessToken: null, cancelled: true, error: err };
    }

    console.warn("Google sign-in notice:", err?.message || err);
    return { user: null, accessToken: null, cancelled: false, error: err };
  }
}

// Sign up with Email & Password
export async function signUpWithEmail(email: string, pass: string, name: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (name && cred.user) {
    await updateProfile(cred.user, { displayName: name });
  }
  return cred.user;
}

// Log in with Email & Password
export async function loginWithEmail(email: string, pass: string) {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return cred.user;
}

// Sign out
export async function logoutUser() {
  cachedAccessToken = null;
  await signOut(auth);
}

// Default Seed Doctors
export const SEED_DOCTORS = [
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
  },
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
  },
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
  },
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
  },
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
  },
];

// Patient Profile Operations
export async function savePatientToFirestore(patientData: any) {
  try {
    const docRef = doc(db, "patients", patientData.uid || patientData.id);
    await setDoc(docRef, {
      ...patientData,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn("Firestore patient save (using local fallback if permission/offline):", err);
    return false;
  }
}

export async function fetchPatientFromFirestore(uid: string) {
  try {
    const docRef = doc(db, "patients", uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (err) {
    console.warn("Firestore patient fetch fallback:", err);
  }
  return null;
}

// Doctors Operations
export async function fetchDoctorsFromFirestore() {
  try {
    const colRef = collection(db, "doctors");
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
    // Seed initial verified doctors if collection is empty
    for (const d of SEED_DOCTORS) {
      await setDoc(doc(db, "doctors", d.id), {
        ...d,
        createdAt: new Date().toISOString(),
      });
    }
    return SEED_DOCTORS;
  } catch (err) {
    console.warn("Firestore doctors fetch fallback to seeds:", err);
    return SEED_DOCTORS;
  }
}

export async function saveDoctorToFirestore(doctorData: any) {
  try {
    const docRef = doc(db, "doctors", doctorData.id || `doc-${Date.now()}`);
    await setDoc(docRef, {
      ...doctorData,
      createdAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn("Firestore doctor save fallback:", err);
    return false;
  }
}

// Appointments Operations
export async function createAppointmentInFirestore(appt: any) {
  try {
    const colRef = collection(db, "appointments");
    const res = await addDoc(colRef, {
      ...appt,
      createdAt: new Date().toISOString(),
    });
    return res.id;
  } catch (err) {
    console.warn("Firestore appointment save fallback:", err);
    return `appt-${Date.now()}`;
  }
}

export async function fetchAppointmentsForPatient(patientId: string) {
  try {
    const colRef = collection(db, "appointments");
    const q = query(colRef, where("patientId", "==", patientId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn("Firestore appointments query fallback:", err);
    return [];
  }
}

// Google Chat API Helpers

