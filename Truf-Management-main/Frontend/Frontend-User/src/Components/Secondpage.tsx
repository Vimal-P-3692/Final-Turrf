import { useEffect, useState } from "react";
import "../styles/Secondpage.css";
import image1 from "../assets/herosectionbgg.jpg";
import image2 from "../assets/logo.png";
import image3 from "../assets/heroImage.svg";
import image4 from "../assets/img.jpeg";
import { getIndianTime } from "../services/api";

const images = [image1, image2, image3, image4];
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
};

const getWeekDates = (baseDate: Date): Date[] => {
  const start = getStartOfWeek(baseDate);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
};

type SecondpageProps = {
  onDateClick: (date: Date) => void;
};

const Secondpage: React.FC<SecondpageProps> = ({ onDateClick }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);

  useEffect(() => {
    const fetchTime = async () => {
      const now = new Date(await getIndianTime());
      setCurrentDateTime(now);
      setSelectedDate(now);
      setWeekDates(getWeekDates(now));
    };
    fetchTime();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (diff > 50) {
      nextWeek();
    } else if (diff < -50) {
      prevWeek();
    }
    setTouchStartX(null);
  };

  const isPastDate = (date: Date) => {
    const today = new Date(currentDateTime);
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isCurrentWeek = () => {
    const today = currentDateTime;
    const startOfThisWeek = getStartOfWeek(today).toDateString();
    const startOfSelectedWeek = getStartOfWeek(selectedDate).toDateString();
    return startOfThisWeek === startOfSelectedWeek;
  };

  const isCurrentMonth = () => {
    return (
      selectedDate.getFullYear() === currentDateTime.getFullYear() &&
      selectedDate.getMonth() === currentDateTime.getMonth()
    );
  };

  const prevWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    const startOfNewWeek = getStartOfWeek(newDate);
    const startOfThisWeek = getStartOfWeek(currentDateTime);
    if (startOfNewWeek < startOfThisWeek) return; // Block going before current week
    setSelectedDate(newDate);
    setWeekDates(getWeekDates(newDate));
  };

  const nextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
    setWeekDates(getWeekDates(newDate));
  };

  const prevMonth = () => {
    if (isCurrentMonth()) return;
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    if (
      newDate.getFullYear() < currentDateTime.getFullYear() ||
      (newDate.getFullYear() === currentDateTime.getFullYear() &&
        newDate.getMonth() < currentDateTime.getMonth())
    ) {
      return;
    }
    setSelectedDate(newDate);
    setWeekDates(getWeekDates(newDate));
  };

  const nextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
    setWeekDates(getWeekDates(newDate));
  };

  const handleDateClick = (date: Date) => {
    if (isPastDate(date)) return;
    setSelectedDate(date);
    onDateClick(date);
  };

  const formatDate = (date: Date) => date.getDate();

  return (
    <div className="container">
      {/* Image Carousel */}
      <div className="slider">
        <button
          className="nav-btn nav-left"
          onClick={() =>
            setCurrentSlide(
              (prev) => (prev - 1 + images.length) % images.length
            )
          }
        >
          &#x276E;
        </button>

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
                  loading="lazy"
              />
            ))}
          </div>
        </div>

        <button
          className="nav-btn nav-right"
          onClick={() => setCurrentSlide((prev) => (prev + 1) % images.length)}
        >
          &#x276F;
        </button>
      </div>

      {/* Month Navigation */}
      <div className="calendar-nav">
        <button
          className="left-calendar"
          onClick={prevMonth}
          disabled={isCurrentMonth()}
        >
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

      {/* Week Navigation */}
      <div className="calendar-nav weekdays-inside-nav">
        <button
          className="left-calendar"
          onClick={prevWeek}
          disabled={isCurrentWeek()}
        >
          &#x276E;
        </button>

        <div
          className="weekdays"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {weekDates.map((d, i) => {
            const isSelected = selectedDate.toDateString() === d.toDateString();
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

      <div className="footer-msg">Book The Slot And Enjoy Your Day!</div>
    </div>
  );
};

export default Secondpage;
