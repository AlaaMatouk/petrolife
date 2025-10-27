# Troubleshooting: Cloud Function 500 Error

## Error Description

```
POST https://us-central1-car-station-6393f.cloudfunctions.net/registerUserWithPhoneNumber 500 (Internal Server Error)
❌ Server error: {error: 'Failed to create user', details: {...}}
```

## Root Causes

The 500 error from the Cloud Function indicates an issue on the **server side** (Cloud Function), not the client side. Here are the most common causes:

### 1. Firebase Admin SDK Not Properly Initialized

**Problem:** The Cloud Function may not have the Firebase Admin SDK initialized correctly.

**Solution - Check your Cloud Function code:**

```typescript
// functions/src/index.ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK (REQUIRED)
admin.initializeApp();

export const registerUserWithPhoneNumber = functions.https.onRequest(
  async (req, res) => {
    // Enable CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        res.status(400).json({ error: "Phone number is required" });
        return;
      }

      // Create user with phone number
      const userRecord = await admin.auth().createUser({
        phoneNumber: phoneNumber,
      });

      res.status(201).json({
        success: true,
        uid: userRecord.uid,
        message: "User created successfully",
      });
    } catch (error: any) {
      console.error("Error creating user:", error);
      res.status(500).json({
        error: "Failed to create user",
        details: error.message || error.toString(),
      });
    }
  }
);
```

### 2. Missing Firebase Admin Permissions

**Problem:** The Cloud Function service account doesn't have permission to create users.

**Solution:**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project: `car-station-6393f`
3. Navigate to **IAM & Admin** > **IAM**
4. Find the service account: `[PROJECT_ID]@appspot.gserviceaccount.com`
5. Ensure it has the role: **Firebase Admin SDK Administrator Service Agent**

### 3. Phone Number Already Exists with Different Auth Method

**Problem:** A user might already exist with that phone number but created with a different method (email, Google, etc.).

**Solution - Update Cloud Function to handle existing users:**

```typescript
try {
  // Try to get existing user first
  let userRecord;
  try {
    userRecord = await admin.auth().getUserByPhoneNumber(phoneNumber);
    // User already exists
    res.status(400).json({
      error: "User already exists",
      details: { uid: userRecord.uid },
    });
    return;
  } catch (error: any) {
    if (error.code === "auth/user-not-found") {
      // User doesn't exist, create new one
      userRecord = await admin.auth().createUser({
        phoneNumber: phoneNumber,
      });
      res.status(201).json({
        success: true,
        uid: userRecord.uid,
        message: "User created successfully",
      });
    } else {
      throw error; // Re-throw other errors
    }
  }
} catch (error: any) {
  console.error("Error:", error);
  res.status(500).json({
    error: "Failed to create user",
    details: {
      message: error.message,
      code: error.code,
    },
  });
}
```

### 4. Invalid Phone Number Format for Firebase

**Problem:** Firebase Admin SDK has strict phone number format requirements.

**Requirements:**

- Must start with `+` followed by country code
- Must be a valid E.164 format phone number
- Example: `+966512345678`

**Our client-side code already handles this**, but verify the Cloud Function logs to see what phone number it's receiving.

### 5. Firebase Admin SDK Version Issue

**Problem:** Outdated Firebase Admin SDK version.

**Solution - Update package.json in functions folder:**

```json
{
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^4.0.0"
  }
}
```

Then run:

```bash
cd functions
npm install
firebase deploy --only functions:registerUserWithPhoneNumber
```

## Debugging Steps

### Step 1: Check Cloud Function Logs

```bash
firebase functions:log --only registerUserWithPhoneNumber
```

Look for detailed error messages like:

- `Error: Firebase Admin SDK not initialized`
- `Error: invalid phone number`
- `Error: permission denied`

### Step 2: Test Cloud Function Directly

Use curl or Postman to test:

```bash
curl -X POST \
  https://us-central1-car-station-6393f.cloudfunctions.net/registerUserWithPhoneNumber \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+966512345678"}'
```

### Step 3: Check Firebase Console

1. Go to Firebase Console > Functions
2. Verify the function is deployed and active
3. Click on the function to see recent invocations and errors
4. Check the "Logs" tab for detailed error messages

### Step 4: Enable More Detailed Logging in Cloud Function

Add extensive logging:

```typescript
export const registerUserWithPhoneNumber = functions.https.onRequest(
  async (req, res) => {
    console.log("=== Cloud Function Invoked ===");
    console.log("Method:", req.method);
    console.log("Body:", req.body);
    console.log("Headers:", req.headers);

    try {
      const { phoneNumber } = req.body;
      console.log("Phone number received:", phoneNumber);

      if (!phoneNumber) {
        console.error("Missing phone number");
        res.status(400).json({ error: "Phone number is required" });
        return;
      }

      console.log("Attempting to create user...");
      const userRecord = await admin.auth().createUser({
        phoneNumber: phoneNumber,
      });

      console.log("User created successfully:", userRecord.uid);
      res.status(201).json({
        success: true,
        uid: userRecord.uid,
        message: "User created successfully",
      });
    } catch (error: any) {
      console.error("=== ERROR CREATING USER ===");
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Full error:", error);

      res.status(500).json({
        error: "Failed to create user",
        details: {
          code: error.code,
          message: error.message,
        },
      });
    }
  }
);
```

### Step 5: Verify Firebase Project Configuration

Ensure your Cloud Function is using the correct Firebase project:

```bash
cd functions
cat .firebaserc
```

Should show:

```json
{
  "projects": {
    "default": "car-station-6393f"
  }
}
```

## Complete Working Cloud Function Example

Here's a complete, production-ready implementation:

```typescript
// functions/src/index.ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as cors from "cors";

// Initialize Firebase Admin
admin.initializeApp();

// Configure CORS
const corsHandler = cors({ origin: true });

export const registerUserWithPhoneNumber = functions.https.onRequest(
  async (request, response) => {
    return corsHandler(request, response, async () => {
      // Only allow POST requests
      if (request.method !== "POST") {
        response.status(405).json({ error: "Method not allowed" });
        return;
      }

      try {
        const { phoneNumber } = request.body;

        // Validate input
        if (!phoneNumber) {
          response.status(400).json({
            error: "Phone number is required",
          });
          return;
        }

        // Validate phone number format
        if (!phoneNumber.startsWith("+966") || phoneNumber.length < 13) {
          response.status(400).json({
            error: "Invalid phone number format. Must be +966XXXXXXXXX",
          });
          return;
        }

        console.log(`Attempting to create user with phone: ${phoneNumber}`);

        // Check if user already exists
        try {
          const existingUser = await admin
            .auth()
            .getUserByPhoneNumber(phoneNumber);
          console.log(`User already exists with UID: ${existingUser.uid}`);

          response.status(400).json({
            error: "User already exists",
            details: {
              uid: existingUser.uid,
              message: "A user with this phone number already exists",
            },
          });
          return;
        } catch (error: any) {
          if (error.code !== "auth/user-not-found") {
            throw error;
          }
          // User doesn't exist, continue to create
        }

        // Create new user
        const userRecord = await admin.auth().createUser({
          phoneNumber: phoneNumber,
        });

        console.log(`User created successfully with UID: ${userRecord.uid}`);

        response.status(201).json({
          success: true,
          uid: userRecord.uid,
          message: "User created successfully",
        });
      } catch (error: any) {
        console.error("Error creating user:", error);

        // Provide detailed error information
        response.status(500).json({
          error: "Failed to create user",
          details: {
            code: error.code || "unknown",
            message: error.message || "Unknown error occurred",
          },
        });
      }
    });
  }
);
```

## Quick Fix Checklist

- [ ] Verify `admin.initializeApp()` is called in Cloud Function
- [ ] Check Firebase Admin SDK version is up to date
- [ ] Verify service account has correct permissions
- [ ] Check Cloud Function logs for detailed error messages
- [ ] Test Cloud Function directly with curl/Postman
- [ ] Verify phone number format is `+966XXXXXXXXX`
- [ ] Check if user already exists in Firebase Auth Console
- [ ] Redeploy Cloud Function after changes
- [ ] Clear browser cache and retry

## Deployment Command

After fixing the Cloud Function:

```bash
cd functions
npm install
npm run build  # If using TypeScript
firebase deploy --only functions:registerUserWithPhoneNumber
```

## Client-Side Changes (Already Implemented)

The client-side code now provides better error details. After fixing the Cloud Function, you'll see:

**Console output with detailed error:**

```
❌ Server error: {error: 'Failed to create user', details: {...}}
Error details: {code: 'auth/invalid-phone-number', message: '...'}
```

**User will see:**

```
تمت إضافة السائق إلى Firestore، لكن حدث خطأ في إنشاء حساب المصادقة: Failed to create user - {code: '...', message: '...'}
```

## Need More Help?

1. Run `firebase functions:log` and share the output
2. Check Firebase Console > Functions > registerUserWithPhoneNumber > Logs
3. Test with curl and share the response
4. Verify the phone number being sent: check Network tab in browser DevTools

The error is definitely in the Cloud Function implementation, not in the client-side code which is working correctly.
