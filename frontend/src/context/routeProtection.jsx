import { useAuth } from "../context/authContext";
import { Navigate } from "react-router-dom";
import { LoadingSpinner } from "../pinner";

const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { loading, isAuthenticated, role } = useAuth();

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default ProtectedRoute;
