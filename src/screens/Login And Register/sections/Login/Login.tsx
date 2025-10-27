import React, { useState } from "react";
import PasswordInput from "../../../../components/shared/Inputs/PasswordInput";
import EmailInput from "../../../../components/shared/Inputs/EmailInput";
import { signInUser, signInWithGoogle } from "../../../../services/auth";
import { useNavigate } from "react-router-dom";
import { useGlobalState } from "../../../../context/GlobalStateContext";
import { determineUserRoleAndRedirect } from "../../../../services/firestore";

interface LoginProps {
  onSwitch: () => void;
}

export default function Login({ onSwitch }: LoginProps) {
  const { dispatch } = useGlobalState();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); // Clear error when user types
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signInUser(form.email, form.password);
      console.log("Login successful ✅", result.user);

      // Determine user role and redirect path
      const userEmail = result.user.email;
      if (!userEmail) {
        setError("البريد الإلكتروني غير متوفر");
        setLoading(false);
        return;
      }

      const roleInfo = await determineUserRoleAndRedirect(userEmail);

      if (!roleInfo) {
        setError("لا يمكن العثور على حسابك. يرجى التواصل مع المسؤول.");
        setLoading(false);
        return;
      }

      // Update global state
      dispatch({
        type: "SET_USER",
        payload: {
          id: result.user.uid,
          name: result.user.displayName || result.user.email || "مستخدم",
          email: result.user.email || "",
          avatar: result.user.photoURL || "",
          role: roleInfo.userType,
        },
      });
      dispatch({ type: "SET_AUTHENTICATED", payload: true });

      // Redirect to appropriate dashboard
      console.log(`🎯 Redirecting to: ${roleInfo.redirectPath}`);
      navigate(roleInfo.redirectPath);
    } catch (error: any) {
      console.error("Login error ❌:", error.message);
      setError(
        error.message ||
          "فشل تسجيل الدخول. يرجى التحقق من البريد الإلكتروني وكلمة المرور."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await signInWithGoogle();
      console.log("Google Login ✅", result.user);

      // Determine user role and redirect path
      const userEmail = result.user.email;
      if (!userEmail) {
        setError("البريد الإلكتروني غير متوفر");
        setLoading(false);
        return;
      }

      const roleInfo = await determineUserRoleAndRedirect(userEmail);

      if (!roleInfo) {
        setError("لا يمكن العثور على حسابك. يرجى التواصل مع المسؤول.");
        setLoading(false);
        return;
      }

      // Update global state
      dispatch({
        type: "SET_USER",
        payload: {
          id: result.user.uid,
          name: result.user.displayName || result.user.email || "مستخدم",
          email: result.user.email || "",
          avatar: result.user.photoURL || "",
          role: roleInfo.userType,
        },
      });
      dispatch({ type: "SET_AUTHENTICATED", payload: true });

      // Redirect to appropriate dashboard
      console.log(`🎯 Redirecting to: ${roleInfo.redirectPath}`);
      navigate(roleInfo.redirectPath);
    } catch (error: any) {
      console.error("Google login failed ❌", error.message);
      setError(error.message || "فشل تسجيل الدخول باستخدام Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="flex gap-3 flex-col justify-center text-center "
      >
        <h1 className="font-bold text-[var(--form-header-title-color)] ">
          تسجيل الدخول
        </h1>

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-right"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <EmailInput onChange={handleChange} value={form.email} />
        <PasswordInput onChange={handleChange} value={form.password} />
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            aria-label="Google logo"
            width="20"
            height="20"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
          >
            <g>
              <path d="m0 0H512V512H0" fill="#fff"></path>
              <path
                fill="#34a853"
                d="M153 292c30 82 118 95 171 60h62v48A192 192 0 0190 341"
              ></path>
              <path
                fill="#4285f4"
                d="m386 400a140 175 0 0053-179H260v74h102q-7 37-38 57"
              ></path>
              <path
                fill="#fbbc02"
                d="m90 341a208 200 0 010-171l63 49q-12 37 0 73"
              ></path>
              <path
                fill="#ea4335"
                d="m153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55"
              ></path>
            </g>
          </svg>
          <span className="text-gray-700 font-medium">
            تسجيل الدخول باستخدام جوجل
          </span>
        </button>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-wide rounded-full bg-color-mode-surface-primary-blue text-basewhite pl-4 pr-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
        </button>
      </form>
    </div>
  );
}
