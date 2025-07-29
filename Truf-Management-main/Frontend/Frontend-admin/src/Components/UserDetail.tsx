import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import back from "../assets/back.svg";
import print from "../assets/print.svg";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "../styles/UserDetail.css";

// Interface for each booking entry
interface BookingEntry {
  no: number;
  name: string;
  phoneNumber: string;
  lastBooking: string;
  upcomingBooking: string;
  totalBookings: number;
}

const Booking = () => {
  const navigate = useNavigate();

  // State to store all booking entries
  const [bookingData, setBookingData] = useState<BookingEntry[]>([]);

  // State for search/filter input
  const [filterText, setFilterText] = useState("");

  // Fetch data on component mount
  useEffect(() => {
    fetch("http://localhost:5127/api/AdminUser/details")
      .then((res) => res.json())
      .then((data) => setBookingData(data))
      .catch(() => {
        // Handle error
      });
  }, []);

  // Export data as Excel file
  const handleExport = () => {
    const worksheetData = [
      [
        "No",
        "Last booking",
        "Name",
        "Phone No.",
        "Upcoming booking",
        "Booking Hours",
      ],
      ...bookingData.map((entry) => [
        entry.no,
        entry.lastBooking,
        entry.name,
        entry.phoneNumber,
        entry.upcomingBooking,
        entry.totalBookings,
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(data, "Bookings.xlsx");
  };

  // Filter bookings based on search input
  const filteredData = bookingData.filter((entry) => {
    const lower = filterText.toLowerCase();
    return (
      entry.name.toLowerCase().includes(lower) ||
      entry.phoneNumber.toLowerCase().includes(lower) ||
      entry.lastBooking.toLowerCase().includes(lower) ||
      entry.upcomingBooking.toLowerCase().includes(lower)
    );
  });

  return (
    <div className="booking-page">
      {/* Back Button */}
      <button className="back" onClick={() => navigate(-1)}>
        <img src={back} alt="Go back" className="back-icon" />
        User
      </button>

      {/* Header section with search bar and export button */}
      <div className="booking-content">
        {/* Responsive Search Bar */}
        <input
          type="text"
          placeholder="Search by name, phone or booking..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="search-input"
        />

        {/* Export Button */}
        <button className="expert-button" onClick={handleExport}>
          <img src={print} alt="Export" className="print-icon" />
          Export Table
        </button>
      </div>

      {/* Booking Table */}
      <div className="table-container p-4">
        <table className="w-full border border-collapse">
          <thead>
            <tr className="bg-green-800 text-white text-left">
              <th className="p-2 border">No</th>
              <th className="p-2 border">Last booking</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Phone No.</th>
              <th className="p-2 border">Upcoming booking</th>
              <th className="p-2 border">Booking Hours</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((entry) => (
              <tr
                key={entry.no}
                className="border hover:bg-gray-100 cursor-pointer"
                onClick={() =>
                  navigate("/admin/userdetail/user", {
                    state: {
                      no: entry.no,
                      date: entry.lastBooking,
                      name: entry.name,
                      phone: entry.phoneNumber,
                      upcoming: entry.upcomingBooking,
                      bookinghours: entry.totalBookings,
                    },
                  })
                }
              >
                <td className="p-2 border">{entry.no}</td>
                <td className="p-2 border">{entry.lastBooking}</td>
                <td className="p-2 border">{entry.name}</td>
                <td className="p-2 border">{entry.phoneNumber}</td>
                <td className="p-2 border">{entry.upcomingBooking}</td>
                <td className="p-2 border">{entry.totalBookings}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Booking;
