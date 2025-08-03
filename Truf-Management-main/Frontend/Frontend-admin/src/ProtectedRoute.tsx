import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ isAuth }: { isAuth: boolean }) => {
  return isAuth ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;
