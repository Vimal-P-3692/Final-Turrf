import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Hedder from "./Components/Hedder";
import Hero from "./Components/Hero";
import Login from "./Login/Login";
import Secondpage from "./Components/Secondpage";
import Thirdpage from "./Components/Thirdpage";
import { useRef, useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import User from "./Components/User";
import Footer from "./Components/Footer"; // Import Footer component

function App() {
  const secondPageRef = useRef<HTMLDivElement>(null);
  const thirdPageRef = useRef<HTMLDivElement>(null);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [shouldScrollToThirdPage, setShouldScrollToThirdPage] = useState(false);
  const { currentUser, loading } = useAuth();

  const userTriggeredScroll = useRef(false); // ✅ Track if user action triggered scroll
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Trigger scroll to Third Page from Second Page (user action)
  const scrollToThirdPage = (date: Date) => {
    setSelectedDate(date);
 
  };

  // Scroll to Thirdpage only when user explicitly triggered it
  useEffect(() => {
    if (shouldScrollToThirdPage && userTriggeredScroll.current) {
      const timer = setTimeout(() => {
        thirdPageRef.current?.scrollIntoView({ behavior: "smooth" });
        setShouldScrollToThirdPage(false);
        userTriggeredScroll.current = false; // ✅ Reset after scroll
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [selectedDate, shouldScrollToThirdPage]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "1.5rem",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={currentUser ? <Navigate to="/" /> : <Login />}
        />
        <Route
          path="/"
          element={
            <>
              <Hedder />
              <Hero
                onScrollClick={() => {
                  secondPageRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
              />
              <div ref={secondPageRef}>
                <Secondpage onScrollToThirdPage={scrollToThirdPage} />
              </div>
              <div ref={thirdPageRef}>
                <Thirdpage
                  key={selectedDate.toDateString()}
                  selectedDate={selectedDate}
                />
                <Footer />
              </div>
            </>
          }
        />
          <Route path="/user" element={<User />} />
      </Routes>
    </Router>
  );
}

export default App;
