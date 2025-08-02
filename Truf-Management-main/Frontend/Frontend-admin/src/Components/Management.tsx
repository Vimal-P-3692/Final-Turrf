import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import back from "../assets/back.svg";
import "../styles/Management.css";
import LoadingPage from "./LoadingPage";

/* ------------------------------------------------------------------ */
/*  Constants & helpers                                               */
/* ------------------------------------------------------------------ */

// Array of weekday abbreviations starting from Monday
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Today's date with time set to midnight
const today = new Date();
today.setHours(0, 0, 0, 0);

// Type definitions for slot status and slot object structure
type SlotStatus = "available" | "booked" | "disabled" | "maintenance";

type Slot = {
  time: string; // Display format e.g. "1 AM to 2 AM"
  status: SlotStatus;
  startTime?: string; // Normalized format e.g. "1 AM"
};

// Type for slot data received from API
type APISlot = {
  slotId: number;
  slotDate: string;
  slotTime: string; // API format e.g. "01:00 AM"
  status: "Unavailable" | "Maintenance";
};

// Helper function to format hour number to AM/PM time string
const formatTime = (hour: number): string => {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour} ${period}`;
};

// Helper to convert display time to API time format
const formatToApiTime = (time: string): string => {
  const [hourStr, period] = time.trim().split(" ");
  const hour = hourStr.padStart(2, "0");
  return `${hour}:00 ${period}`;
};

// Generates all 24 time slots for a day with default 'available' status
const getAllSlots = (): Slot[] => {
  const slots: Slot[] = [];
  for (let i = 0; i < 24; i++) {
    const from = formatTime(i);
    const to = formatTime((i + 1) % 24);
    slots.push({
      time: `${from} to ${to}`,
      status: "available",
      startTime: from.toUpperCase().trim(),
    });
  }
  return slots;
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

const Management = () => {
  // Navigation hook for back button functionality
  const navigate = useNavigate();

  /* ----------------------- State Management ----------------------- */

  // Currently displayed week/month in calendar view
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  // The date that's currently clicked/selected
  const [clickedDate, setClickedDate] = useState<Date | null>(null);

  // Array of all time slots for the selected date
  const [slots, setSlots] = useState<Slot[]>(getAllSlots());

  // Array of indices of selected slots for bulk operations
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);

  // Index of slot opened in maintenance popup
  const [popupSlotIndex, setPopupSlotIndex] = useState<number | null>(null);

  // Index of slot opened in booked slot popup
  const [popupBookedIndex, setPopupBookedIndex] = useState<number | null>(null);

  // Flag to show/hide mark-as-maintenance confirmation popup
  const [showMarkPopup, setShowMarkPopup] = useState(false);

  // Flag for "select all available slots" checkbox
  const [selectAll, setSelectAll] = useState(false);

  // Refs for slot DOM elements for potential future use
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);

  /* -------------------- Navigation Helpers ------------------------ */

  // Move calendar view to next week
  const nextWeek = () =>
    setSelectedDate((prev) => new Date(prev.getTime() + 7 * 86400000));

  // Move calendar view to previous week (won't go before today)
  const prevWeek = () => {
    const newDate = new Date(selectedDate.getTime() - 7 * 86400000);
    if (newDate >= today) setSelectedDate(newDate);
  };

  // Move calendar view to next month
  const nextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
  };

  // Move calendar view to previous month (won't go before today)
  const prevMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    if (newDate >= today) setSelectedDate(newDate);
  };

  // Get array of 7 Date objects representing the current week
  const getWeekDates = () => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(selectedDate);
      d.setDate(selectedDate.getDate() + i);
      days.push(d);
    }
    return days;
  };

  async function cancelBooking(
    reason: string,
    phoneNumber: string
  ): Promise<void> {
    try {
      const response = await fetch("http://localhost:5126/booking/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Booking cancellation failed");
      }
      window.location.reload();
    } catch (err) {
      alert("Failed to cancel the booking. Please try again later.");
      window.location.reload();
    }
  }

  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    reason: string;
    dateStr: string;
    time: string;
  } | null>(null);

  useEffect(() => {
    if (loading && pendingAction) {
      const timeout = setTimeout(async () => {
        try {
          const res = await fetch(
            "http://localhost:5127/api/CancelSlots/cancel",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                slots: [
                  {
                    slotDate: new Date(`${pendingAction.dateStr}`),
                    slotTime: pendingAction.time,
                  },
                ],
                reason: pendingAction.reason,
                cancelledBy: "Admin",
              }),
            }
          );

          // console.log(res);
          if (!res.ok) throw new Error("Cancellation failed");
          const data = await res.json();
          console.log("📞 Phone number returned from backend:", data.phoneno);

          // You can use it here if needed
          await cancelBooking(pendingAction.reason, data.phoneno);
          // await cancelBooking(pendingAction.reason, res);
          // update local state
          setSlots((prev) =>
            prev.map((s, i) =>
              i === popupBookedIndex ? { ...s, status: "available" } : s
            )
          );
          setPopupBookedIndex(null);
        } catch (err) {
          console.error("❌ Cancel booking error:", err);
          alert("Failed to cancel booking. Please try again.");
        } finally {
          setLoading(false);
        }
      }, 2500); // 2.5 seconds simulated loading delay

      return () => clearTimeout(timeout);
    }
  }, [loading, pendingAction]);

  /* ----------------------- Effects ------------------------------- */

  // Initialize clickedDate to today when component mounts
  useEffect(() => setClickedDate(today), []);

  // Fetch slot data whenever clickedDate changes
  useEffect(() => {
    if (!clickedDate) return;

    (async () => {
      try {
        // Format date for API request
        const y = clickedDate.getFullYear();
        const m = String(clickedDate.getMonth() + 1).padStart(2, "0");
        const d = String(clickedDate.getDate()).padStart(2, "0");
        const dateStr = `${y}-${m}-${d}`;

        // Fetch slot data from API
        const res = await fetch(`http://localhost:5127/api/Slots/${dateStr}`);
        const apiSlots = (await res.json()) as APISlot[];

        // Create sets of unavailable and maintenance times from API response
        const unavailable = new Set(
          apiSlots
            .filter((s) => s.status === "Unavailable")
            .map((s) => s.slotTime.replace(/\s+/g, " ").trim().toUpperCase())
        );

        const maintenance = new Set(
          apiSlots
            .filter((s) => s.status === "Maintenance")
            .map((s) => s.slotTime.replace(/\s+/g, " ").trim().toUpperCase())
        );

        // Update slots with status from API
        const updated = getAllSlots().map((slot) => {
          const t = slot.startTime!.replace(/\s+/g, " ").trim().toUpperCase();
          if (unavailable.has(t))
            return { ...slot, status: "disabled" as SlotStatus };
          if (maintenance.has(t))
            return { ...slot, status: "maintenance" as SlotStatus };
          return { ...slot, status: "available" as SlotStatus };
        });

        // Reset selection state when slots update
        setSlots(updated);
        setSelectedSlots([]);
        setSelectAll(false);
      } catch (err) {
        console.error("❌ Failed to fetch slot data:", err);
      }
    })();
  }, [clickedDate]);

  /* ---------------------- Utility Functions ---------------------- */

  // Check if a date is in the past (before today)
  const isPastDate = (d: Date) => d < today;

  // Format date for display (just day number)
  const formatDate = (d: Date) => `${d.getDate()}`;

  /* ------------------- Interaction Handlers ---------------------- */

  // Handle date selection in calendar
  const handleDateClick = (d: Date) => {
    if (!isPastDate(d)) setClickedDate(d);
  };

  // Check if a slot's time is in the past (only applies to today)
  const isPastSlot = (slot: Slot): boolean => {
  if (!clickedDate) return false;

  // Only apply to today
  if (clickedDate.toDateString() !== today.toDateString()) return false;

  const [hourStr, period] = slot.startTime!.split(" ");
  let hour = parseInt(hourStr);

  // Convert to 24-hour format
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  const now = new Date();
  const slotTime = new Date(now);
  slotTime.setHours(hour, 15, 0, 0); // Set to the slot start hour + 15 minutes

  return now >= slotTime; // Disable if time is 15+ minutes past slot start
};


  // Handle slot click - different behavior based on slot status
  const handleSlotClick = (idx: number) => {
    const slot = slots[idx];

    // 🔴 Block interaction with past time slots on today
    if (isPastSlot(slot)) {
      return; // Do nothing
    }

    if (slot.status === "maintenance") {
      setPopupSlotIndex(idx);
      return;
    }
    if (slot.status === "disabled") {
      setPopupBookedIndex(idx);
      return;
    }
    if (slot.status === "booked") {
      return;
    }

    // Toggle selection for available slots
    setSelectedSlots((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  // Handle select-all checkbox change
  const handleSelectAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    setSelectedSlots(
      checked
        ? slots
            .map((s, i) => (s.status === "available" ? i : -1))
            .filter((i) => i !== -1)
        : []
    );
  };

  // Mark selected slots as maintenance (local state only)
  const handleMarkAsMaintenance = () => {
    setSlots((prev) =>
      prev.map((s, i) =>
        selectedSlots.includes(i) ? { ...s, status: "maintenance" } : s
      )
    );
    setSelectedSlots([]);
    setSelectAll(false);
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                          */
  /* ---------------------------------------------------------------- */

  // Get dates for current week view
  const weekDates = getWeekDates();

  // Loading Page
  if (loading) return <LoadingPage />;

  return (
    <div className="main-container">
      {/* Back button to navigate to previous page */}
      <button className="back-button" onClick={() => navigate(-1)}>
        <img src={back} alt="Back" />
        Management
      </button>

      {/* Month navigation header */}
      <div className="calendar-nav">
        <button className="left-calendar" onClick={prevMonth}>
          &#x276E;
        </button>
        <span>
          {selectedDate.toLocaleString("default", { month: "long" })}{" "}
          {selectedDate.getFullYear()}
        </span>
        <button className="right-calendar" onClick={nextMonth}>
          &#x276F;
        </button>
      </div>

      {/* Week navigation with day cells */}
      <div className="calendar-nav weekdays-inside-nav">
        <button className="left-calendar" onClick={prevWeek}>
          &#x276E;
        </button>

        <div className="weekdays">
          {weekDates.map((d, i) => {
            const isSelected = clickedDate?.toDateString() === d.toDateString();
            return (
              <div
                key={i}
                className={`day ${isSelected ? "selected" : ""} ${
                  isPastDate(d) ? "disabled" : ""
                }`}
                onClick={() => handleDateClick(d)}
              >
                <span>{formatDate(d)}</span>
                <span>{weekdays[d.getDay() === 0 ? 6 : d.getDay() - 1]}</span>
              </div>
            );
          })}
        </div>

        <button className="right-calendar" onClick={nextWeek}>
          &#x276F;
        </button>
      </div>

      {/* Bulk select controls */}
      <h1 className="slot-title">Time Slots</h1>
      <section className="select-container">
        <label className="select-label">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={handleSelectAllChange}
          />
          <span>Select all</span>
        </label>
      </section>

      {/* Grid of time slots */}
      <div className="slot-grid">
        {slots.map((slot, i) => (
          <div
            key={i}
            ref={(el) => {
              slotRefs.current[i] = el;
            }}
            className={`slot-box ${slot.status} ${
              selectedSlots.includes(i) ? "selected" : ""
            } ${isPastSlot(slot) ? "past-slot disabled" : ""}`}
            onClick={() => handleSlotClick(i)}
          >
            <div>{slot.time.split(" to ")[0]}</div>
            <div className="slot-to">to</div>
            <div>{slot.time.split(" to ")[1]}</div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="end-buttons">
        <button
          className="mark-maintanance"
          onClick={() => setShowMarkPopup(true)}
          disabled={selectedSlots.length === 0}
        >
          Mark as Maintenance
        </button>
      </div>

      {/* --------------------------- MODALS ------------------------- */}

      {/* Remove maintenance confirmation modal */}
      {popupSlotIndex !== null && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-content-inner">
              <h2>Remove Maintenance</h2>
              <p>
                Do you want to remove maintenance for slot:{" "}
                <strong>{slots[popupSlotIndex].time}</strong>?
              </p>
              <div className="modal-actions">
                <button
                  className="remove-maintanance-button"
                  onClick={async () => {
                    if (!clickedDate) return;
                    // Format date and time for API request
                    const y = clickedDate.getFullYear();
                    const m = String(clickedDate.getMonth() + 1).padStart(
                      2,
                      "0"
                    );
                    const d = String(clickedDate.getDate()).padStart(2, "0");
                    const dateStr = `${y}-${m}-${d}`;
                    const raw = slots[popupSlotIndex].startTime!;
                    const time = formatToApiTime(raw);

                    try {
                      // Call API to remove maintenance
                      const res = await fetch(
                        "http://localhost:5127/api/AdminSlotManagement/delete-maintenance",
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            date: dateStr,
                            timeSlots: [time],
                          }),
                        }
                      );
                      if (!res.ok) throw new Error("Delete failed");

                      // Update local state on success
                      setSlots((prev) =>
                        prev.map((s, i) =>
                          i === popupSlotIndex
                            ? { ...s, status: "available" }
                            : s
                        )
                      );
                      setPopupSlotIndex(null);
                    } catch (err) {
                      console.error("❌ Failed to delete maintenance:", err);
                      alert("Failed to remove maintenance.");
                    }
                  }}
                >
                  Yes, Remove
                </button>
                <button
                  className="cancel-popup-button"
                  onClick={() => setPopupSlotIndex(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove booking confirmation modal */}
      {popupBookedIndex !== null && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-content-inner">
              <p>
                Cancelling: <strong>{slots[popupBookedIndex].time}</strong>
              </p>

              {/* Cancellation Form */}
              <div className="cancellation-form">
                <div className="form-group">
                  <label htmlFor="reason">Reason for Cancellation:</label>
                  <select id="reason" className="form-input">
                    <option value="">Select a reason</option>
                    <option value="No Show">No Show</option>
                    <option value="Facility Maintenance">
                      Facility Maintenance
                    </option>
                    <option value="User Request">User Request</option>
                    <option value="Policy Violation">Policy Violation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="remove-maintanance-button"
                  onClick={() => {
                    if (!clickedDate) return;

                    const reason = (
                      document.getElementById("reason") as HTMLSelectElement
                    ).value;

                    if (!reason) {
                      alert("Please fill in all required fields");
                      return;
                    }

                    const y = clickedDate.getFullYear();
                    const m = String(clickedDate.getMonth() + 1).padStart(
                      2,
                      "0"
                    );
                    const d = String(clickedDate.getDate()).padStart(2, "0");
                    const dateStr = `${y}-${m}-${d}`;
                    const time = slots[popupBookedIndex].startTime!;

                    // Set action and start loading
                    setPendingAction({ reason, dateStr, time });
                    setLoading(true);
                  }}
                >
                  Confirm
                </button>
                <button
                  className="cancel-popup-button"
                  onClick={() => setPopupBookedIndex(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mark-as-maintenance confirmation modal */}
      {showMarkPopup && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-content-inner">
              <h2>Mark as Maintenance</h2>
              <p>
                Are you sure you want to mark{" "}
                <strong>{selectedSlots.length}</strong> slot
                {selectedSlots.length !== 1 && "s"} as maintenance?
              </p>
              <div className="modal-actions">
                <button
                  className="remove-maintanance-button"
                  onClick={async () => {
                    if (!clickedDate) return;
                    // Format date and times for API request
                    const y = clickedDate.getFullYear();
                    const m = String(clickedDate.getMonth() + 1).padStart(
                      2,
                      "0"
                    );
                    const d = String(clickedDate.getDate()).padStart(2, "0");
                    const dateStr = `${y}-${m}-${d}`;
                    const timeSlots = selectedSlots.map((i) =>
                      formatToApiTime(slots[i].startTime!)
                    );

                    try {
                      // Call API to mark maintenance
                      const res = await fetch(
                        "http://localhost:5127/api/AdminSlotManagement/mark-maintenance",
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ date: dateStr, timeSlots }),
                        }
                      );
                      if (!res.ok) throw new Error("Mark failed");

                      // Update local state on success
                      handleMarkAsMaintenance();
                      setShowMarkPopup(false);
                    } catch (err) {
                      alert("Failed to mark maintenance.");
                    }
                  }}
                >
                  Yes, Confirm
                </button>
                <button
                  className="cancel-popup-button"
                  onClick={() => setShowMarkPopup(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Management;
