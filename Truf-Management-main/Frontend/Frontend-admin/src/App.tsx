// import { useEffect, useState } from "react";
// import {
//   BrowserRouter as Router,
//   Routes,
//   Route,
//   Navigate,
// } from "react-router-dom";

// import Login from "./Login/Login";
// import Layout from "./layout";
// import Dashboard from "./Components/Dashboard";
// import Booking from "./Components/Booking";
// import Management from "./Components/Management";
// import UserDetail from "./Components/UserDetail";
// import User from "./Components/User";
// import LoadingPage from "./Components/LoadingPage";
// import ProtectedRoute from "./Components/ProtectedRoute";
// import { useAuth } from "./context/AuthContext";

// function App() {
//   const [loading, setLoading] = useState(true);
//   const { isAuthenticated, loading: authLoading } = useAuth();

//   // Show loading screen for 2 seconds (simulate load)
//   useEffect(() => {
//     window.scrollTo(0, 0);
//     const timer = setTimeout(() => {
//       setLoading(false);
//     }, 2000);
//     return () => clearTimeout(timer);
//   }, []);

//   // Show loading page while app or auth is loading
//   if (loading || authLoading) return <LoadingPage />;

//   return (
//     <Router>
//       <Routes>
//         <Route path="/login" element={<Login />} />

//         {/* Redirect root to login if not authenticated, otherwise to dashboard */}
//         <Route
//           path="/"
//           element={
//             isAuthenticated ? (
//               <Navigate to="/admin/dashboard" replace />
//             ) : (
//               <Navigate to="/login" replace />
//             )
//           }
//         />

//         {/* PROTECTED ADMIN ROUTES */}
//         <Route
//           path="/admin"
//           element={
//             <ProtectedRoute>
//               <Layout />
//             </ProtectedRoute>
//           }
//         >
//           <Route path="dashboard" element={<Dashboard />} />
//           <Route path="booking" element={<Booking />} />
//           <Route path="userdetail" element={<UserDetail />} />
//           <Route path="management" element={<Management />} />
//           <Route path="userdetail/user" element={<User />} />
//         </Route>

//         {/* Fallback route - redirect to appropriate page based on auth status */}
//         <Route
//           path="*"
//           element={
//             isAuthenticated ? (
//               <Navigate to="/admin/dashboard" replace />
//             ) : (
//               <Navigate to="/login" replace />
//             )
//           }
//         />
//       </Routes>
//     </Router>
//   );
// }

// export default App;



import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./Login/Login";
import Layout from "./layout";
import Dashboard from "./Components/Dashboard";
import Booking from "./Components/Booking";
import Management from "./Components/Management";
import UserDetail from "./Components/UserDetail";
import User from "./Components/User";
import LoadingPage from "./Components/LoadingPage";

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <LoadingPage />;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Direct root to dashboard */}
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

        {/* ADMIN ROUTES WITHOUT PROTECTION */}
        <Route path="/admin" element={<Layout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="booking" element={<Booking />} />
          <Route path="userdetail" element={<UserDetail />} />
          <Route path="management" element={<Management />} />
          <Route path="userdetail/user" element={<User />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
