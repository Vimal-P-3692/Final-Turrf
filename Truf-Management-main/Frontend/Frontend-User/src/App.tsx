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
import Footer from "./Components/Footer";
import { getIndianTime } from "./services/api";

async function fetchTime() {
  return new Date(await getIndianTime());
}

const currentDate = await fetchTime();


function App() {
  const secondPageRef = useRef<HTMLDivElement>(null);
  const thirdPageRef = useRef<HTMLDivElement>(null);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date(currentDate));
  const { currentUser, loading } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
              <Secondpage onDateClick={(date) => setSelectedDate(date)} />
              </div>
              <div ref={thirdPageRef}>
                <Thirdpage selectedDate={selectedDate} />
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
