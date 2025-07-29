// Import React and related libraries
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

// Import assets and styles
import back from "../assets/back.svg";
import print from "../assets/print.svg";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "../styles/Booking.css";

// Define the structure/type for booking data
type BookingItem = {
  username: string;
  no: number;
  date: string;
  name: string;
  phone: string;
  time: string;
  price: number;
  status: string;
};

// List of available booking views (used for filtering)
const views: ("past" | "today" | "upcoming")[] = ["past", "today", "upcoming"];

const Booking = () => {
  const navigate = useNavigate(); // For navigating back to the previous page

  // State variables
  const [viewIndex, setViewIndex] = useState(1); // Current selected tab index
  const [bookingData, setBookingData] = useState<BookingItem[]>([]); // Bookings fetched from API
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(""); // Error message
  const [filterText, setFilterText] = useState("");
  const currentView = views[viewIndex]; // Determine view type based on index
  const filteredData = bookingData.filter((entry) => {
    const lower = filterText.toLowerCase();
    return (
      entry.name.toLowerCase().includes(lower) ||
      entry.phone.toLowerCase().includes(lower) ||
      entry.date.toLowerCase().includes(lower) ||
      entry.status.toLowerCase().includes(lower)
    );
  });

  // Fetch bookings from API when component loads or view changes
  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true); // Start loading indicator
      setError(""); // Clear previous errors
      try {
        // Make GET request to fetch bookings for the selected view
        const response = await axios.get<BookingItem[]>(
          `http://localhost:5127/api/AdminBooking?status=${currentView}`
        );
        setBookingData(response.data); // Store the received bookings
      } catch (err) {
        setError("Failed to fetch bookings."); // Show error if fetch fails
      } finally {
        setLoading(false); // Stop loading indicator
      }
    };

    fetchBookings();
  }, [currentView]); // Re-run when view changes

  // Go to previous view (e.g., today → past)
  const handlePrevView = () => {
    setViewIndex((prev) => (prev === 0 ? 0 : prev - 1));
  };

  // Go to next view (e.g., today → upcoming)
  const handleNextView = () => {
    setViewIndex((prev) => (prev === views.length - 1 ? prev : prev + 1));
  };

  // Export bookings table to Excel file
  const handleExport = () => {
    // Convert booking data into an array format suitable for Excel
    const data = [
      ["No", "Date", "Name", "Phone No.", "Time", "Price in ₹", "Status"],
      ...bookingData.map((item) => [
        item.no,
        item.date,
        item.name,
        item.phone,
        item.time,
        item.price,
        item.status,
      ]),
    ];

    // Create a new Excel worksheet and workbook
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings");

    // Write Excel data to a Blob and trigger file download
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const file = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    // Download the Excel file with the current view name
    saveAs(file, `Booking_${currentView}.xlsx`);
  };

  return (
    <div className="booking-wrapper">
      {/* Back Button */}
      <button className="back-button" onClick={() => navigate(-1)}>
        <img src={back} alt="Back" />
        Booking
      </button>

      {/* Top section: view selector and export button */}
      <div className="booking-content">
        <input
          type="text"
          placeholder="Search by name, phone or booking..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="search-input"
        />

        {/* View Selector (Past / Today / Upcoming) */}
        <div className="date">
          <img
            src={back}
            alt="Previous"
            className="back-icon"
            onClick={handlePrevView}
            style={{ opacity: viewIndex === 0 ? 0.3 : 1 }}
          />
          {currentView.toUpperCase()}
          <img
            src={back}
            alt="Next"
            className="next-icon"
            onClick={handleNextView}
            style={{ opacity: viewIndex === views.length - 1 ? 0.3 : 1 }}
          />
        </div>

        {/* Export Button */}
        <button className="expert-button" onClick={handleExport}>
          <img src={print} alt="print" className="print-icon" />
          Export table
        </button>
      </div>

      {/* Booking Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Date</th>
              <th>Name</th>
              <th>Phone No.</th>
              <th>Time</th>
              <th>Price in ₹</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Loading row
              <tr>
                <td colSpan={7}>Loading...</td>
              </tr>
            ) : error ? (
              // Error row
              <tr>
                <td colSpan={7} style={{ color: "red" }}>
                  {error}
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              // No data row
              <tr>
                <td colSpan={7}>No bookings found.</td>
              </tr>
            ) : (
              // Render bookings
              filteredData.map((item) => (
                <tr
                  key={item.no}
                  className="clickable-row"
                  onClick={() =>
                    navigate("/admin/userdetail/user", {
                      state: {
                        no: item.no,
                        date: item.date,
                        name: item.name,
                        phone: item.phone,
                        upcoming: item.status,
                        bookinghours: item.time,
                      },
                    })
                  }
                >
                  <td>{item.no}</td>
                  <td>{item.date}</td>
                  <td>{item.name}</td>
                  <td>{item.phone}</td>
                  <td>{item.time}</td>
                  <td>{item.price}</td>
                  <td className="status">{item.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Booking;
