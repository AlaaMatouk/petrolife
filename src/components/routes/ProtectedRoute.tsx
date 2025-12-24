import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useGlobalState";
import { LoadingSpinner } from "../shared/Spinner/LoadingSpinner";
import { ROUTES } from "../../constants/routes";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute - Base component that checks if user is authenticated
 * Redirects to login if not authenticated
 * Shows loading state during auth check
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner fullPage message="جارٍ التحقق من الهوية..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate
        to={ROUTES.LOGIN}
        state={{ from: location }}
        replace
      />
    );
  }

  // User is authenticated, allow access
  return <>{children}</>;
};

