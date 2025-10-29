import React, { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebase";
import { useGlobalState } from "../context/GlobalStateContext";
import {
  fetchCurrentCompany,
  determineUserRoleAndRedirect,
} from "../services/firestore";
import { useNavigate, useLocation } from "react-router-dom";

export const AuthListener: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { dispatch } = useGlobalState();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        const userEmail = user.email;

        if (!userEmail) {
          console.error("❌ User email not found");
          return;
        }

        // Determine user role and redirect path
        try {
          const roleInfo = await determineUserRoleAndRedirect(userEmail);

          if (!roleInfo) {
            console.error("❌ User role not found in any collection");
            // Sign out the user if they're not authorized
            dispatch({ type: "SET_USER", payload: null });
            dispatch({ type: "SET_COMPANY", payload: null });
            dispatch({ type: "SET_AUTHENTICATED", payload: false });
            navigate("/");
            return;
          }

          // Update global state with correct role
          dispatch({
            type: "SET_USER",
            payload: {
              id: user.uid,
              name: user.displayName || user.email || "مستخدم",
              email: user.email || "",
              avatar: user.photoURL || "",
              role: roleInfo.userType,
            },
          });
          dispatch({ type: "SET_AUTHENTICATED", payload: true });
          console.log(
            "✅ User authenticated:",
            user.email,
            "- Role:",
            roleInfo.userType
          );

          // Fetch company data if user is a company
          if (roleInfo.userType === "company") {
            try {
              const company = await fetchCurrentCompany();
              if (company) {
                dispatch({ type: "SET_COMPANY", payload: company as any });
                console.log("✅ Company data loaded:", company);
              }
            } catch (error) {
              console.error("❌ Failed to fetch company data:", error);
            }
          }

          // Only redirect if user is on login page
          if (location.pathname === "/" || location.pathname === "/login") {
            console.log(
              `🎯 Redirecting authenticated user to: ${roleInfo.redirectPath}`
            );
            navigate(roleInfo.redirectPath);
          }
        } catch (error) {
          console.error("❌ Error determining user role:", error);
        }
      } else {
        // User is signed out
        dispatch({ type: "SET_USER", payload: null });
        dispatch({ type: "SET_COMPANY", payload: null });
        dispatch({ type: "SET_AUTHENTICATED", payload: false });
        console.log("User signed out");

        // Redirect to login if not already there
        if (location.pathname !== "/") {
          navigate("/");
        }
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [dispatch, navigate, location.pathname]);

  return <>{children}</>;
};
