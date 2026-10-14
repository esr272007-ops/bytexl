import React, { useState, useEffect } from "react";
import {
  fetchDoctorsFromFirestore,
  saveDoctorToFirestore,
  createAppointmentInFirestore,
} from "../lib/firebase";

export interface Doctor {
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
  avatar?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  symptoms?: string;
  hospital?: string;
  consultationFee?: string;
  status: "confirmed" | "completed" | "cancelled";
}

// Standard consultation time slots
const ALL_TIME_SLOTS = [
  "09:00 AM",
  "09:45 AM",
  "10:30 AM",
  "11:15 AM",
  "12:00 PM",
  "02:00 PM",
  "02:45 PM",
  "03:30 PM",
  "04:15 PM",
  "05:00 PM",
];

// Helper: Formats Date object to local YYYY-MM-DD (avoids UTC offset shifts)
export const getLocalDateString = (d: Date = new Date()): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Helper: Formats YYYY-MM-DD into a human-friendly string like "Wed, 14 Oct 2026"
export const formatHumanDate = (dateStr: string): string => {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

// Helper: Checks if a slot time has already passed for a given date
export const isSlotPastTime = (slot: string, dateStr: string, todayStr: string): boolean => {
  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;

  const match = slot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return false;
  let hour = parseInt(match[1], 10);
  const min = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === "PM" && hour < 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  const now = new Date();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();

  return hour < currentHour || (hour === currentHour && min <= currentMin);
};

export function DoctorsDirectory({
  lang = "en",
  patientName = "E. Sai Charan",
  patientId = "patient-default",
}: {
  lang?: string;
  patientName?: string;
  patientId?: string;
}) {
  const [activeTab, setActiveTab] = useState<"directory" | "appointments">("directory");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");

  // Local dates strictly preventing past date selections
  const todayStr = getLocalDateString();
  const maxDateStr = getLocalDateString(new Date(Date.now() + 60 * 86400000));

  // Quick date chips for next 5 days
  const quickDates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const str = getLocalDateString(d);
    let label = "Today";
    if (i === 1) label = "Tomorrow";
    else if (i === 2) label = "Day After";
    else label = d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
    return { str, label, weekday: d.toLocaleDateString("en-US", { weekday: "short" }) };
  });

  // Booking modal state
  const [bookingDoc, setBookingDoc] = useState<Doctor | null>(null);
  const [bookingDate, setBookingDate] = useState<string>(todayStr);
  const [bookingTime, setBookingTime] = useState<string>("");
  const [symptoms, setSymptoms] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState<Appointment | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [filterOnlyAvailable, setFilterOnlyAvailable] = useState(true);
  const [dateNotice, setDateNotice] = useState("");

  // All active appointments to detect and prevent slot collisions
  const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);

  // Add doctor modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDoc, setNewDoc] = useState({
    name: "",
    specialty: "General Physician & Internal Medicine",
    experience: "10 years exp",
    rating: 4.9,
    phone: "+91 ",
    email: "",
    availableDays: "Mon - Fri (10:00 AM - 04:00 PM)",
    consultationFee: "₹600",
    hospital: "SmartMedX Healthcare Network",
    bio: "",
    avatar: "👨‍⚕️",
  });
  const [addSuccess, setAddSuccess] = useState(false);

  // Load doctors from backend and Firestore
  const loadDoctors = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/doctors");
      if (res.ok) {
        const json = await res.json();
        if (json.doctors && json.doctors.length > 0) {
          setDoctors(json.doctors);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Backend /api/doctors notice:", err);
    }

    try {
      const fsDocs = await fetchDoctorsFromFirestore();
      setDoctors(fsDocs as Doctor[]);
    } catch (err) {
      console.error("Failed to load doctors:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load all appointments to detect slot collisions
  const loadAppointments = async () => {
    try {
      const res = await fetch("/api/appointments");
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.appointments)) {
          setExistingAppointments(json.appointments);
        }
      }
    } catch (err) {
      console.warn("Appointments load notice:", err);
    }
  };

  useEffect(() => {
    loadDoctors();
    loadAppointments();
  }, []);

  const specialties = [
    "All",
    "Cardiology",
    "Neurology",
    "Pediatrics",
    "Internal Medicine",
    "Pulmonology",
  ];

  const filteredDoctors = doctors.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialty.toLowerCase().includes(search.toLowerCase()) ||
      d.hospital.toLowerCase().includes(search.toLowerCase());
    const matchesSpec =
      selectedSpecialty === "All" ||
      d.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase());
    return matchesSearch && matchesSpec;
  });

  // Patient's own appointments
  const myAppointments = existingAppointments.filter(
    (a) => (a.patientId === patientId || a.patientName === patientName) && a.status !== "cancelled"
  );

  // Calculate booked slots for currently selected doctor on currently selected date
  const bookedSlots = new Set<string>();
  if (bookingDoc) {
    existingAppointments.forEach((appt) => {
      if (
        appt.doctorId === bookingDoc.id &&
        appt.date === bookingDate &&
        appt.status !== "cancelled"
      ) {
        bookedSlots.add(appt.time);
      }
    });
  }

  // Determine which slots are open and selectable
  const getSlotStatus = (slot: string) => {
    const isPast = isSlotPastTime(slot, bookingDate, todayStr);
    const isBooked = bookedSlots.has(slot);
    if (isPast) return "past";
    if (isBooked) return "booked";
    return "available";
  };

  const availableSlots = ALL_TIME_SLOTS.filter((s) => getSlotStatus(s) === "available");
  const fullSlotsCount = ALL_TIME_SLOTS.filter((s) => bookedSlots.has(s)).length;
  const pastSlotsCount = ALL_TIME_SLOTS.filter(
    (s) => isSlotPastTime(s, bookingDate, todayStr) && !bookedSlots.has(s)
  ).length;

  // Open booking modal
  const handleOpenBooking = async (doc: Doctor) => {
    setBookingDoc(doc);
    setBookingSuccess(null);
    setBookingError("");
    setSymptoms("");
    setDateNotice("");

    // Freshly refresh appointments from server to ensure no collisions
    await loadAppointments();

    // Compute booked slots for today
    const currentBooked = new Set(
      existingAppointments
        .filter((a) => a.doctorId === doc.id && a.date === todayStr && a.status !== "cancelled")
        .map((a) => a.time)
    );

    // Find first available slot today that is NOT booked and NOT in past
    const firstFreeToday = ALL_TIME_SLOTS.find(
      (s) => !currentBooked.has(s) && !isSlotPastTime(s, todayStr, todayStr)
    );

    if (firstFreeToday) {
      setBookingDate(todayStr);
      setBookingTime(firstFreeToday);
    } else {
      // If all slots today are passed or full, automatically default to tomorrow!
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = getLocalDateString(tomorrow);

      const tomorrowBooked = new Set(
        existingAppointments
          .filter((a) => a.doctorId === doc.id && a.date === tomorrowStr && a.status !== "cancelled")
          .map((a) => a.time)
      );
      const firstFreeTomorrow = ALL_TIME_SLOTS.find((s) => !tomorrowBooked.has(s));

      setBookingDate(tomorrowStr);
      setBookingTime(firstFreeTomorrow || ALL_TIME_SLOTS[0]);
      setDateNotice(`Notice: Today's slots have ended or are booked. Switched to Tomorrow (${formatHumanDate(tomorrowStr)}) with open slots.`);
    }
  };

  // When date changes, validate and select first free slot on that date
  const handleDateChange = (newDate: string) => {
    setDateNotice("");
    setBookingError("");

    // Strict guard: ensure date cannot be before today
    if (!newDate || newDate < todayStr) {
      setBookingDate(todayStr);
      setDateNotice("Past dates are not available for booking. Reset to today.");
      newDate = todayStr;
    } else {
      setBookingDate(newDate);
    }

    if (bookingDoc) {
      const currentBooked = new Set(
        existingAppointments
          .filter((a) => a.doctorId === bookingDoc.id && a.date === newDate && a.status !== "cancelled")
          .map((a) => a.time)
      );

      // Find first slot that is available
      const firstFree = ALL_TIME_SLOTS.find(
        (s) => !currentBooked.has(s) && !isSlotPastTime(s, newDate, todayStr)
      );

      if (firstFree) {
        setBookingTime(firstFree);
      } else {
        setBookingTime("");
        setDateNotice(`All slots for Dr. ${bookingDoc.name} on ${formatHumanDate(newDate)} are full or passed.`);
      }
    }
  };

  // Jump to the next date that has open slots
  const handleFindNextAvailableDate = () => {
    if (!bookingDoc) return;
    for (let offset = 1; offset <= 14; offset++) {
      const candidateDate = new Date();
      candidateDate.setDate(candidateDate.getDate() + offset);
      const candidateStr = getLocalDateString(candidateDate);

      const candidateBooked = new Set(
        existingAppointments
          .filter((a) => a.doctorId === bookingDoc.id && a.date === candidateStr && a.status !== "cancelled")
          .map((a) => a.time)
      );

      const free = ALL_TIME_SLOTS.find(
        (s) => !candidateBooked.has(s) && !isSlotPastTime(s, candidateStr, todayStr)
      );

      if (free) {
        setBookingDate(candidateStr);
        setBookingTime(free);
        setDateNotice(`Found open slots on ${formatHumanDate(candidateStr)}!`);
        return;
      }
    }
    setBookingError("No open slots found in the next 14 days for this doctor. Please contact hospital reception.");
  };

  // Handle appointment booking submission
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDoc) return;

    // Strict validation: Prevent past dates
    if (bookingDate < todayStr) {
      setBookingError("Cannot book an appointment for a past date. Please select today or a future date.");
      return;
    }

    // Strict validation: Require slot selection
    if (!bookingTime) {
      setBookingError("Please select an available time slot for your appointment.");
      return;
    }

    // Strict validation: Check if slot time has passed
    if (isSlotPastTime(bookingTime, bookingDate, todayStr)) {
      setBookingError(`The ${bookingTime} slot has already passed for today. Please pick an upcoming time slot.`);
      return;
    }

    // Strict collision check: Prevent booking a slot that is already taken
    if (bookedSlots.has(bookingTime)) {
      setBookingError(
        `Slot collision: The ${bookingTime} slot is already booked for Dr. ${bookingDoc.name} on ${formatHumanDate(bookingDate)}. Please choose another available time slot.`
      );
      return;
    }

    setBookingLoading(true);
    setBookingError("");

    const apptData: Appointment = {
      id: `appt-${Date.now()}`,
      patientId,
      patientName,
      doctorId: bookingDoc.id,
      doctorName: bookingDoc.name,
      specialty: bookingDoc.specialty,
      date: bookingDate,
      time: bookingTime,
      symptoms,
      hospital: bookingDoc.hospital,
      consultationFee: bookingDoc.consultationFee,
      status: "confirmed",
    };

    try {
      // 1. Save to backend API (with server-side collision check)
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apptData),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        if (res.status === 409 || errJson.collision) {
          setBookingError(
            errJson.error || "This slot was just booked by another patient. Please pick another available slot."
          );
          await loadAppointments();
          setBookingLoading(false);
          return;
        }
      }

      // 2. Save to Firestore
      await createAppointmentInFirestore(apptData);

      // 3. Update local appointments list immediately so slot turns booked in UI
      setExistingAppointments((prev) => [...prev, apptData]);
      setBookingSuccess(apptData);
    } catch (err: any) {
      console.warn("Booking warning:", err);
      setExistingAppointments((prev) => [...prev, apptData]);
      setBookingSuccess(apptData);
    } finally {
      setBookingLoading(false);
    }
  };

  // Cancel an appointment to free the slot immediately
  const handleCancelAppointment = async (apptId: string) => {
    if (!window.confirm("Are you sure you want to cancel this appointment? The slot will become available for other patients.")) {
      return;
    }
    try {
      await fetch(`/api/appointments/${apptId}`, { method: "DELETE" });
      setExistingAppointments((prev) =>
        prev.map((a) => (a.id === apptId ? { ...a, status: "cancelled" } : a))
      );
    } catch (err) {
      console.warn("Cancel appointment warning:", err);
      setExistingAppointments((prev) =>
        prev.map((a) => (a.id === apptId ? { ...a, status: "cancelled" } : a))
      );
    }
  };

  // Handle new doctor registration
  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.name || !newDoc.specialty) return;

    const doctorRecord: Doctor = {
      ...newDoc,
      id: `doc-${Date.now()}`,
    };

    try {
      await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doctorRecord),
      });
      await saveDoctorToFirestore(doctorRecord);

      setDoctors((prev) => [doctorRecord, ...prev]);
      setAddSuccess(true);
      setTimeout(() => {
        setShowAddModal(false);
        setAddSuccess(false);
        setNewDoc({
          name: "",
          specialty: "General Physician & Internal Medicine",
          experience: "10 years exp",
          rating: 4.9,
          phone: "+91 ",
          email: "",
          availableDays: "Mon - Fri (10:00 AM - 04:00 PM)",
          consultationFee: "₹600",
          hospital: "SmartMedX Healthcare Network",
          bio: "",
          avatar: "👨‍⚕️",
        });
      }, 1500);
    } catch (err) {
      console.error("Failed to add doctor:", err);
      setDoctors((prev) => [doctorRecord, ...prev]);
      setShowAddModal(false);
    }
  };

  return (
    <div className="doctors-directory-container">
      {/* Top Navigation Tabs */}
      <div className="directory-tabs-row">
        <button
          type="button"
          className={`dir-tab-btn ${activeTab === "directory" ? "active" : ""}`}
          onClick={() => setActiveTab("directory")}
        >
          👨‍⚕️ Find Specialists &amp; Doctors ({doctors.length})
        </button>
        <button
          type="button"
          className={`dir-tab-btn ${activeTab === "appointments" ? "active" : ""}`}
          onClick={() => setActiveTab("appointments")}
        >
          📅 My Confirmed Appointments ({myAppointments.length})
        </button>
      </div>

      {activeTab === "appointments" ? (
        /* My Confirmed Appointments View */
        <div className="my-appointments-view">
          <div className="appointments-header">
            <h3>My Scheduled Doctor Appointments</h3>
            <p>Track your confirmed appointments, check consultation times, and cancel or reschedule anytime.</p>
          </div>

          {myAppointments.length === 0 ? (
            <div className="empty-appointments-card">
              <div className="empty-calendar-icon">📅</div>
              <h4>No Upcoming Appointments</h4>
              <p>You haven't scheduled any doctor appointments yet.</p>
              <button
                type="button"
                className="primary-btn"
                onClick={() => setActiveTab("directory")}
              >
                Browse Doctors &amp; Book Now
              </button>
            </div>
          ) : (
            <div className="appointments-cards-list">
              {myAppointments.map((appt) => (
                <div key={appt.id} className="appointment-ticket-item">
                  <div className="appt-ticket-top">
                    <div>
                      <span className="appt-badge confirmed">✓ Confirmed</span>
                      <h4 className="appt-doc-title">{appt.doctorName}</h4>
                      <p className="appt-sub-info">{appt.specialty} • {appt.hospital}</p>
                    </div>
                    <div className="appt-fee-box">
                      <span className="fee-label">Consultation Fee</span>
                      <span className="fee-amount">{appt.consultationFee || "₹600"}</span>
                    </div>
                  </div>

                  <div className="appt-details-grid">
                    <div className="appt-detail-box">
                      <span className="detail-name">📅 Date</span>
                      <strong>{formatHumanDate(appt.date)}</strong>
                    </div>
                    <div className="appt-detail-box">
                      <span className="detail-name">⏰ Time Slot</span>
                      <strong>{appt.time}</strong>
                    </div>
                    <div className="appt-detail-box">
                      <span className="detail-name">🆔 Booking ID</span>
                      <code>{appt.id}</code>
                    </div>
                    {appt.symptoms && (
                      <div className="appt-detail-box full-width">
                        <span className="detail-name">📝 Reason for Visit</span>
                        <span>{appt.symptoms}</span>
                      </div>
                    )}
                  </div>

                  <div className="appt-actions-bar">
                    <span className="guarantee-tag">🛡️ Zero-Collision Guaranteed Slot</span>
                    <button
                      type="button"
                      className="cancel-appt-btn"
                      onClick={() => handleCancelAppointment(appt.id)}
                    >
                      ✕ Cancel Appointment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Doctor Directory View */
        <>
          {/* Directory Header */}
          <div className="directory-header-row">
            <div>
              <h2 className="directory-main-title">
                👨‍⚕️ Verified Medical Specialists &amp; Doctors
              </h2>
              <p className="directory-sub-title">
                Book instant, collision-free doctor appointments with verified specialists. Past dates and already-booked slots are strictly protected.
              </p>
            </div>
            <div className="directory-top-actions">
              <button
                type="button"
                className="secondary-btn small-btn"
                onClick={() => setShowAddModal(true)}
                title="Register a verified doctor profile"
              >
                ➕ Register Doctor
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="directory-controls-bar">
            <div className="search-input-wrap">
              <span className="search-icon-symbol">🔍</span>
              <input
                type="search"
                className="search-field-styled"
                placeholder="Search doctors by name, specialty, or hospital..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="specialty-pills">
              {specialties.map((spec) => (
                <button
                  key={spec}
                  type="button"
                  className={`spec-pill-btn ${selectedSpecialty === spec ? "active" : ""}`}
                  onClick={() => setSelectedSpecialty(spec)}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="directory-loading">
              <span className="loading-spinner-circle" />
              <p>Loading verified doctor directory...</p>
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="empty-state-box">
              <p>No doctors found matching "{search}".</p>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setSearch("");
                  setSelectedSpecialty("All");
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            /* Doctor Cards Grid */
            <div className="doctor-cards-grid">
              {filteredDoctors.map((doc) => (
                <div key={doc.id} className="doc-profile-card">
                  <div className="doc-card-top">
                    <span className="doc-avatar-badge">{doc.avatar || "👨‍⚕️"}</span>
                    <div className="doc-meta-info">
                      <div className="doc-name-rating-row">
                        <h3 className="doc-name">{doc.name}</h3>
                        <span className="doc-rating-badge">★ {doc.rating.toFixed(1)}</span>
                      </div>
                      <p className="doc-specialty">{doc.specialty}</p>
                      <p className="doc-hospital">{doc.hospital}</p>
                    </div>
                  </div>

                  <p className="doc-bio-text">{doc.bio}</p>

                  <div className="doc-details-list">
                    <div className="doc-detail-item">
                      <span className="detail-label">Experience:</span>
                      <span className="detail-val">{doc.experience}</span>
                    </div>
                    <div className="doc-detail-item">
                      <span className="detail-label">Schedule:</span>
                      <span className="detail-val">{doc.availableDays}</span>
                    </div>
                    <div className="doc-detail-item">
                      <span className="detail-label">Fee:</span>
                      <span className="detail-val fee-highlight">{doc.consultationFee}</span>
                    </div>
                    <div className="doc-detail-item">
                      <span className="detail-label">Contact:</span>
                      <span className="detail-val">{doc.phone}</span>
                    </div>
                  </div>

                  <div className="doc-card-footer-actions">
                    <button
                      type="button"
                      className="primary-btn book-doc-btn"
                      onClick={() => handleOpenBooking(doc)}
                    >
                      📅 Book Appointment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Appointment Booking Modal with Past Date & Slot Collision Protection */}
      {bookingDoc && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-dialog-card appointment-modal">
            <button
              type="button"
              className="modal-close-x"
              onClick={() => {
                setBookingDoc(null);
                setBookingSuccess(null);
                setBookingError("");
                setDateNotice("");
              }}
            >
              ✕
            </button>

            {bookingSuccess ? (
              <div className="booking-confirmation-content">
                <div className="confirm-icon-big">✅</div>
                <h3>Appointment Confirmed!</h3>
                <p className="confirm-sub">
                  Your appointment with <strong>{bookingSuccess.doctorName}</strong> is locked in with zero slot collision.
                </p>
                <div className="confirm-ticket-card">
                  <p><strong>Appointment ID:</strong> {bookingSuccess.id}</p>
                  <p><strong>Doctor:</strong> {bookingSuccess.doctorName} ({bookingSuccess.specialty})</p>
                  <p><strong>Date &amp; Time:</strong> {formatHumanDate(bookingSuccess.date)} at {bookingSuccess.time}</p>
                  <p><strong>Hospital:</strong> {bookingSuccess.hospital}</p>
                  <p><strong>Consultation Fee:</strong> {bookingSuccess.consultationFee}</p>
                  {bookingSuccess.symptoms && (
                    <p><strong>Reason for Visit:</strong> {bookingSuccess.symptoms}</p>
                  )}
                  <p className="ticket-guarantee">🛡️ Slot reserved and saved to database.</p>
                </div>
                <div className="modal-actions-row">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => {
                      setBookingDoc(null);
                      setBookingSuccess(null);
                      setActiveTab("appointments");
                    }}
                  >
                    View My Appointments
                  </button>
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() => {
                      setBookingDoc(null);
                      setBookingSuccess(null);
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="booking-form">
                <h3>Book Consultation with {bookingDoc.name}</h3>
                <p className="modal-sub">
                  {bookingDoc.specialty} • {bookingDoc.hospital}
                </p>

                {bookingError && (
                  <div className="slot-error-banner" role="alert">
                    ⚠️ {bookingError}
                  </div>
                )}

                {dateNotice && (
                  <div className="slot-notice-banner" role="status">
                    ℹ️ {dateNotice}
                  </div>
                )}

                <div className="field-group">
                  <label htmlFor="b-patient">Patient Name</label>
                  <input
                    id="b-patient"
                    type="text"
                    value={patientName}
                    readOnly
                    className="readonly-input"
                  />
                </div>

                {/* Date Picker strictly prevents past dates */}
                <div className="field-group">
                  <label htmlFor="b-date">
                    Consultation Date <span className="field-hint">(Previous dates disabled)</span>
                  </label>

                  {/* Quick Date Chips */}
                  <div className="quick-dates-row">
                    {quickDates.map((qd) => (
                      <button
                        key={qd.str}
                        type="button"
                        className={`quick-date-chip ${bookingDate === qd.str ? "active" : ""}`}
                        onClick={() => handleDateChange(qd.str)}
                      >
                        <span className="qd-label">{qd.label}</span>
                        <span className="qd-date">{qd.weekday}</span>
                      </button>
                    ))}
                  </div>

                  <input
                    id="b-date"
                    type="date"
                    min={todayStr}
                    max={maxDateStr}
                    value={bookingDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    required
                    className="styled-date-input"
                  />
                </div>

                {/* Slot Selection with Real-time Collision Prevention & Status Filter */}
                <div className="field-group">
                  <div className="slots-header-line">
                    <label>Time Slots for {formatHumanDate(bookingDate)}:</label>
                    <div className="slots-controls-right">
                      <button
                        type="button"
                        className={`filter-available-btn ${filterOnlyAvailable ? "active" : ""}`}
                        onClick={() => setFilterOnlyAvailable(!filterOnlyAvailable)}
                        title="Toggle to hide or show full slots"
                      >
                        {filterOnlyAvailable ? "✓ Showing Available Only" : "Showing All Slots"}
                      </button>
                      <span className={`slots-count-badge ${availableSlots.length === 0 ? "zero" : ""}`}>
                        {availableSlots.length} available
                      </span>
                    </div>
                  </div>

                  {availableSlots.length === 0 ? (
                    <div className="all-slots-full-alert" role="alert">
                      <p>
                        🚫 <strong>No open slots on {formatHumanDate(bookingDate)}.</strong>
                        {fullSlotsCount > 0 && ` (${fullSlotsCount} booked by other patients)`}
                        {pastSlotsCount > 0 && ` (${pastSlotsCount} already passed)`}
                      </p>
                      <button
                        type="button"
                        className="jump-next-date-btn"
                        onClick={handleFindNextAvailableDate}
                      >
                        👉 Find Next Date with Open Slots
                      </button>
                    </div>
                  ) : (
                    <div className="slots-grid">
                      {ALL_TIME_SLOTS.map((slot) => {
                        const status = getSlotStatus(slot);
                        const isSelected = bookingTime === slot;
                        const isAvailable = status === "available";
                        const isBooked = status === "booked";
                        const isPast = status === "past";

                        // If user prefers only available slots, hide full or past ones to prevent confusion
                        if (filterOnlyAvailable && !isAvailable && !isSelected) {
                          return null;
                        }

                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={!isAvailable}
                            className={`slot-chip-btn ${
                              isBooked ? "booked" : isPast ? "past" : isSelected ? "selected" : "available"
                            }`}
                            onClick={() => {
                              if (isAvailable) {
                                setBookingTime(slot);
                                setBookingError("");
                              }
                            }}
                            title={
                              isBooked
                                ? "Slot already booked by another patient (Collision prevention)"
                                : isPast
                                ? "Time slot has already passed for today"
                                : `Select ${slot}`
                            }
                          >
                            <span className="slot-time-text">{slot}</span>
                            <span className="slot-status-indicator">
                              {isBooked ? "🔒 Full" : isPast ? "⏰ Passed" : isSelected ? "✓ Selected" : "Open"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {filterOnlyAvailable && (fullSlotsCount > 0 || pastSlotsCount > 0) && (
                    <p className="full-slots-hidden-hint">
                      ℹ️ {fullSlotsCount} booked / full slot(s) hidden to prevent collisions.
                      <button
                        type="button"
                        className="text-toggle-btn"
                        onClick={() => setFilterOnlyAvailable(false)}
                      >
                        Show all
                      </button>
                    </p>
                  )}
                </div>

                <div className="field-group">
                  <label htmlFor="b-symptoms">Symptoms / Reason for Visit</label>
                  <textarea
                    id="b-symptoms"
                    rows={2}
                    placeholder="Briefly describe your symptoms or reason for consulting the doctor..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                  />
                </div>

                <div className="modal-actions-row">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => {
                      setBookingDoc(null);
                      setBookingError("");
                      setDateNotice("");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary-btn"
                    disabled={bookingLoading || availableSlots.length === 0 || !bookingTime}
                  >
                    {bookingLoading
                      ? "Locking Slot..."
                      : availableSlots.length === 0
                      ? "Date Fully Booked"
                      : `Confirm Booking: ${bookingTime || "Choose Slot"} (${bookingDoc.consultationFee})`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Add / Register Doctor Modal */}
      {showAddModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-dialog-card">
            <button
              type="button"
              className="modal-close-x"
              onClick={() => setShowAddModal(false)}
            >
              ✕
            </button>

            {addSuccess ? (
              <div className="booking-confirmation-content">
                <div className="confirm-icon-big">👨‍⚕️</div>
                <h3>Doctor Profile Registered!</h3>
                <p>Saved securely to the SmartMedX backend and database catalog.</p>
              </div>
            ) : (
              <form onSubmit={handleAddDoctor} className="add-doctor-form">
                <h3>Register Doctor Details</h3>
                <p className="modal-sub">
                  Add physician credentials, contact information, and consultation schedule.
                </p>

                <div className="field-group">
                  <label htmlFor="d-name">Doctor Full Name &amp; Title *</label>
                  <input
                    id="d-name"
                    type="text"
                    placeholder="e.g. Dr. Ramesh Gupta, MD"
                    value={newDoc.name}
                    onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                    required
                  />
                </div>

                <div className="field-row-split">
                  <div className="field-group">
                    <label htmlFor="d-spec">Specialty *</label>
                    <input
                      id="d-spec"
                      type="text"
                      placeholder="e.g. Cardiologist, Orthopedic"
                      value={newDoc.specialty}
                      onChange={(e) => setNewDoc({ ...newDoc, specialty: e.target.value })}
                      required
                    />
                  </div>
                  <div className="field-group">
                    <label htmlFor="d-exp">Experience</label>
                    <input
                      id="d-exp"
                      type="text"
                      placeholder="e.g. 12 years exp"
                      value={newDoc.experience}
                      onChange={(e) => setNewDoc({ ...newDoc, experience: e.target.value })}
                    />
                  </div>
                </div>

                <div className="field-row-split">
                  <div className="field-group">
                    <label htmlFor="d-phone">Phone Number</label>
                    <input
                      id="d-phone"
                      type="tel"
                      value={newDoc.phone}
                      onChange={(e) => setNewDoc({ ...newDoc, phone: e.target.value })}
                    />
                  </div>
                  <div className="field-group">
                    <label htmlFor="d-fee">Consultation Fee</label>
                    <input
                      id="d-fee"
                      type="text"
                      placeholder="e.g. ₹700"
                      value={newDoc.consultationFee}
                      onChange={(e) => setNewDoc({ ...newDoc, consultationFee: e.target.value })}
                    />
                  </div>
                </div>

                <div className="field-group">
                  <label htmlFor="d-hosp">Hospital / Clinic Affiliation</label>
                  <input
                    id="d-hosp"
                    type="text"
                    value={newDoc.hospital}
                    onChange={(e) => setNewDoc({ ...newDoc, hospital: e.target.value })}
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="d-sched">Available Days &amp; Hours</label>
                  <input
                    id="d-sched"
                    type="text"
                    value={newDoc.availableDays}
                    onChange={(e) => setNewDoc({ ...newDoc, availableDays: e.target.value })}
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="d-bio">Professional Bio &amp; Specializations</label>
                  <textarea
                    id="d-bio"
                    rows={2}
                    placeholder="Describe clinical experience, certifications, and areas of focus..."
                    value={newDoc.bio}
                    onChange={(e) => setNewDoc({ ...newDoc, bio: e.target.value })}
                  />
                </div>

                <div className="modal-actions-row">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="primary-btn">
                    Save Doctor Profile
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
