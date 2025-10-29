import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  UserCredential,
} from "firebase/auth";
import { auth } from "../config/firebase";

// Sign up with email and password
export const signUpUser = async (
  username: string,
  email: string,
  password: string
): Promise<UserCredential> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Update user profile with username
    if (userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: username,
      });
    }

    return userCredential;
  } catch (error: any) {
    console.error("Error signing up:", error);
    throw error;
  }
};

// Sign in with email and password
export const signInUser = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential;
  } catch (error: any) {
    console.error("Error signing in:", error);
    throw error;
  }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return userCredential;
  } catch (error: any) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

// Sign out
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Format phone number to ensure +966 prefix
export const formatPhoneNumber = (phone: string): string => {
  // Remove all spaces, dashes, and special characters
  let cleanedPhone = phone.replace(/[\s\-\(\)]/g, "");

  // If phone starts with +966, return as is
  if (cleanedPhone.startsWith("+966")) {
    return cleanedPhone;
  }

  // If phone starts with 966 (without +), add the +
  if (cleanedPhone.startsWith("966")) {
    return `+${cleanedPhone}`;
  }

  // If phone starts with 05 or 5, remove the leading 0 and add +966
  if (cleanedPhone.startsWith("05")) {
    return `+966${cleanedPhone.substring(1)}`;
  }

  if (cleanedPhone.startsWith("5")) {
    return `+966${cleanedPhone}`;
  }

  // Default: just add +966 prefix
  return `+966${cleanedPhone}`;
};

// Register user with phone number via Firebase Cloud Function
export const registerUserWithPhoneNumber = async (
  phoneNumber: string
): Promise<{ success: boolean; message: string; uid?: string }> => {
  try {
    // Format phone number to ensure +966 prefix
    const formattedPhone = formatPhoneNumber(phoneNumber);

    console.log("Registering user with phone number:", formattedPhone);

    // Get Firebase project ID from config
    const projectId = "car-station-6393f";
    const region = "us-central1"; // Default region for Firebase Cloud Functions

    // Construct the Cloud Function URL
    const cloudFunctionUrl = `https://${region}-${projectId}.cloudfunctions.net/registerUserWithPhoneNumber`;

    console.log("Calling Cloud Function:", cloudFunctionUrl);

    // Make POST request to Cloud Function
    const response = await fetch(cloudFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumber: formattedPhone,
      }),
    });

    console.log("Cloud Function response status:", response.status);

    // Handle different response status codes
    if (response.status === 201) {
      // Success - user created
      const data = await response.json();
      console.log("✅ User created successfully in Firebase Auth:", data);

      return {
        success: true,
        message: "تم إنشاء حساب المستخدم في Firebase Auth بنجاح",
        uid: data.uid,
      };
    } else if (response.status === 400) {
      // Bad request or user already exists
      const errorData = await response.json();
      console.warn("⚠️ Bad request or user already exists:", errorData);

      // Check if the error is "user already exists" - this might not be an error
      if (
        errorData.message?.includes("already exists") ||
        errorData.error?.includes("already exists")
      ) {
        return {
          success: true, // Consider this a success since the user exists
          message: "المستخدم موجود بالفعل في Firebase Auth",
        };
      }

      return {
        success: false,
        message:
          errorData.message || errorData.error || "خطأ في البيانات المرسلة",
      };
    } else if (response.status === 500) {
      // Server error
      const errorData = await response.json();
      console.error("❌ Server error:", errorData);

      // Log detailed error information if available
      if (errorData.details) {
        console.error("Error details:", errorData.details);
      }

      // Construct detailed error message
      let errorMessage =
        errorData.error || errorData.message || "خطأ في الخادم";

      // Add details if available
      if (errorData.details) {
        const detailsStr =
          typeof errorData.details === "string"
            ? errorData.details
            : JSON.stringify(errorData.details);
        errorMessage += ` - ${detailsStr}`;
      }

      return {
        success: false,
        message: errorMessage,
      };
    } else {
      // Other errors
      const errorText = await response.text();
      console.error("❌ Unexpected error:", response.status, errorText);

      return {
        success: false,
        message: `خطأ غير متوقع: ${response.status}`,
      };
    }
  } catch (error: any) {
    // Network error or other exceptions
    console.error("❌ Network error calling Cloud Function:", error);

    return {
      success: false,
      message:
        error.message ||
        "فشل الاتصال بخادم Firebase. يرجى التحقق من الاتصال بالإنترنت.",
    };
  }
};
