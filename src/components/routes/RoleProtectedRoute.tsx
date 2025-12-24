import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useGlobalState";
import { LoadingSpinner } from "../shared/Spinner/LoadingSpinner";
import { ROUTES } from "../../constants/routes";

type UserRole = "admin" | "company" | "service-distributer";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: UserRole | UserRole[];
}

/**
 * RoleProtectedRoute - Extends ProtectedRoute with role-based access control
 * Checks if user is authenticated AND has the required role(s)
 * Redirects to user's appropriate dashboard if wrong role
 */
export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner fullPage message="جارٍ التحقق من الهوية..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // If no user or no role, redirect to login
  if (!user || !user.role) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Check if user has required role
  const requiredRoles = Array.isArray(requiredRole)
    ? requiredRole
    : [requiredRole];
  const hasRequiredRole = requiredRoles.includes(user.role);

  // If user has the required role, allow access
  if (hasRequiredRole) {
    return <>{children}</>;
  }

  // User doesn't have required role - redirect to their appropriate dashboard
  const getDashboardPath = (role: UserRole): string => {
    switch (role) {
      case "admin":
        return ROUTES.ADMIN_DASHBOARD;
      case "company":
        return ROUTES.DASHBOARD;
      case "service-distributer":
        return ROUTES.SERVICE_DISTRIBUTER_DASHBOARD;
      default:
        return ROUTES.LOGIN;
    }
  };

  const redirectPath = getDashboardPath(user.role);

  return (
    <Navigate
      to={redirectPath}
      state={{
        from: location,
        message: "ليس لديك صلاحية للوصول إلى هذه الصفحة",
      }}
      replace
    />
  );
};
