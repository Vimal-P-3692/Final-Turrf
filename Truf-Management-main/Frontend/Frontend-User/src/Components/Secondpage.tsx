import { useEffect, useState } from "react";
import "../styles/Secondpage.css";

// Image carousel assets
import image1 from "../assets/herosectionbgg.jpg";
import image2 from "../assets/logo.png";
import image3 from "../assets/heroImage.svg";

// Array of images for the top image slider
const images = [image1, image2, image3];

// Array of weekday labels for the calendar slider
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const Secondpage = ({
  onScrollToThirdPage,
}: {
  onScrollToThirdPage: (date: Date) => void;
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time for accurate date comparison

  const [currentSlide, setCurrentSlide] = useState(0); // Controls current image in carousel
  const [clickedDate, setClickedDate] = useState<Date>(today); // Stores the selected calendar date
  const [dateSlide, setDateSlide] = useState(0); // Index of current calendar date slide
  const [daysPerSlide, setDaysPerSlide] = useState(getDaysPerSlide()); // Responsive number of days per calendar slide

  const maxDays = 15; // Total number of future dates displayed

  // Determine how many days to show per slide based on screen width
  function getDaysPerSlide() {
    const width = window.innerWidth;
    if (width <= 360) return 3;
    if (width <= 480) return 4;
    return 5;
  }

  // Calculate total number of calendar slides needed
  const totalSlides = Math.ceil(maxDays / (daysPerSlide || 1));

  // Auto-switch carousel images every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Adjust daysPerSlide on window resize
  useEffect(() => {
    const handleResize = () => {
      setDaysPerSlide(getDaysPerSlide());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Generate date objects from today up to maxDays
  const allDates: Date[] = Array.from({ length: maxDays }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    return date;
  });

  // Slice out the currently visible dates for the date slider
  const visibleDates = allDates.slice(
    dateSlide * daysPerSlide,
    dateSlide * daysPerSlide + daysPerSlide
  );

  // Move to next/previous image in slider
  const nextImage = () => setCurrentSlide((prev) => (prev + 1) % images.length);
  const prevImage = () =>
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);

  // Move to next/previous calendar date slide
  const nextDateSlide = () => {
    if (dateSlide < totalSlides - 1) setDateSlide((prev) => prev + 1);
  };

  const prevDateSlide = () => {
    if (dateSlide > 0) setDateSlide((prev) => prev - 1);
  };

  // Handle user clicking a date
  const handleDateClick = (date: Date) => {
    setClickedDate(date);
    onScrollToThirdPage(date); // Trigger scroll or update in parent component
  };

  // Check if the given date is today
  const isToday = (date: Date) => date.toDateString() === today.toDateString();

  return (
    <div className="container">
      {/* ================= IMAGE SLIDER SECTION ================= */}
      <div className="slider">
        {/* Previous Button */}
        <button className="nav-btn nav-left" onClick={prevImage}>
          &#x276E;
        </button>

        {/* Image Slide Track */}
        <div className="slider-image-wrapper">
          <div
            className="slider-track"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {images.map((src, index) => (
              <img
                key={index}
                src={src}
                alt={`Slide ${index + 1}`}
                className="slider-image"
              />
            ))}
          </div>
        </div>

        {/* Next Button */}
        <button className="nav-btn nav-right" onClick={nextImage}>
          &#x276F;
        </button>
      </div>

      {/* ================= MONTH AND YEAR LABEL ================= */}
      <div className="calendar-nav">
        <span>
          {clickedDate.toLocaleString("default", { month: "long" })}{" "}
          {clickedDate.getFullYear()}
        </span>
      </div>

      {/* ================= DATE SELECTOR (SLIDER) ================= */}
      <div className="calendar-nav weekdays-inside-nav">
        {/* Previous Slide Button */}
        <button
          className="left-calendar"
          onClick={prevDateSlide}
          disabled={dateSlide === 0}
        >
          &#x276E;
        </button>

        {/* Visible Dates */}
        <div className="weekdays">
          {visibleDates.map((date, index) => {
            const isSelected =
              clickedDate?.toDateString() === date.toDateString();

            return (
              <div
                key={index}
                className={`day ${isSelected ? "selected" : ""} ${
                  isToday(date) ? "today" : ""
                }`}
                onClick={() => handleDateClick(date)}
              >
                <span>{date.getDate()}</span>
                <span>
                  {
                    weekdays[
                      date.getDay() === 0 ? 6 : date.getDay() - 1
                    ] /* Adjust for JS Sunday (0) */
                  }
                </span>
              </div>
            );
          })}
        </div>

        {/* Next Slide Button */}
        <button
          className="right-calendar"
          onClick={nextDateSlide}
          disabled={dateSlide === totalSlides - 1}
        >
          &#x276F;
        </button>
      </div>

      {/* ================= FOOTER MESSAGE ================= */}
      <div className="footer-msg">Book The Slot And Enjoy Your Day!</div>
    </div>
  );
};

export default Secondpage;