# Quick Fix: Cloud Function 500 Error

## 🔴 Current Problem

Your Cloud Function is returning a 500 error. The client-side code is **working correctly** - the issue is in your **Cloud Function implementation**.

## ✅ Quick Solution

Replace your entire Cloud Function with this working code:

### File: `functions/src/index.ts`

```typescript
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as cors from "cors";

// ⚠️ CRITICAL: Initialize Firebase Admin SDK
admin.initializeApp();

// Configure CORS to allow requests from your web app
const corsHandler = cors({ origin: true });

export const registerUserWithPhoneNumber = functions.https.onRequest(
  async (request, response) => {
    return corsHandler(request, response, async () => {
      // Handle preflight OPTIONS request
      if (request.method === "OPTIONS") {
        response.status(204).send("");
        return;
      }

      // Only allow POST requests
      if (request.method !== "POST") {
        response.status(405).json({ error: "Method not allowed" });
        return;
      }

      try {
        const { phoneNumber } = request.body;

        // Validate input
        if (!phoneNumber) {
          response.status(400).json({ error: "Phone number is required" });
          return;
        }

        // Validate phone number format
        if (!phoneNumber.startsWith("+966")) {
          response.status(400).json({
            error: "Phone number must start with +966",
          });
          return;
        }

        console.log(`📞 Creating user with phone: ${phoneNumber}`);

        // Check if user already exists
        try {
          const existingUser = await admin
            .auth()
            .getUserByPhoneNumber(phoneNumber);

          console.log(`⚠️ User already exists: ${existingUser.uid}`);
          response.status(400).json({
            error: "User already exists",
            message: "A user with this phone number already exists",
            uid: existingUser.uid,
          });
          return;
        } catch (error: any) {
          if (error.code !== "auth/user-not-found") {
            throw error; // Re-throw unexpected errors
          }
          // User doesn't exist - continue to create
        }

        // Create new user
        const userRecord = await admin.auth().createUser({
          phoneNumber: phoneNumber,
        });

        console.log(`✅ User created successfully: ${userRecord.uid}`);

        response.status(201).json({
          success: true,
          uid: userRecord.uid,
          phoneNumber: userRecord.phoneNumber,
          message: "User created successfully",
        });
      } catch (error: any) {
        console.error("❌ Error creating user:", error);

        response.status(500).json({
          error: "Failed to create user",
          details: {
            code: error.code || "unknown",
            message: error.message || "Unknown error",
          },
        });
      }
    });
  }
);
```

### File: `functions/package.json`

Make sure you have these dependencies:

```json
{
  "name": "functions",
  "scripts": {
    "build": "tsc",
    "serve": "npm run build && firebase emulators:start --only functions",
    "shell": "npm run build && firebase functions:shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": {
    "node": "18"
  },
  "main": "lib/index.js",
  "dependencies": {
    "cors": "^2.8.5",
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^4.5.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "typescript": "^5.0.0"
  }
}
```

## 📝 Deployment Steps

```bash
# 1. Navigate to functions directory
cd functions

# 2. Install dependencies (including CORS)
npm install

# 3. Build (if using TypeScript)
npm run build

# 4. Deploy the function
firebase deploy --only functions:registerUserWithPhoneNumber

# 5. Wait for deployment to complete
# You should see: ✔ Deploy complete!
```

## 🧪 Test the Function

After deploying, test with curl:

```bash
curl -X POST \
  https://us-central1-car-station-6393f.cloudfunctions.net/registerUserWithPhoneNumber \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+966512345678"}'
```

**Expected response (201):**

```json
{
  "success": true,
  "uid": "abc123...",
  "phoneNumber": "+966512345678",
  "message": "User created successfully"
}
```

**If user exists (400):**

```json
{
  "error": "User already exists",
  "message": "A user with this phone number already exists",
  "uid": "existing-uid..."
}
```

## 🔍 View Logs

To see what's happening:

```bash
firebase functions:log --only registerUserWithPhoneNumber
```

Or in Firebase Console:

1. Go to Firebase Console
2. Click **Functions**
3. Click **registerUserWithPhoneNumber**
4. Click **Logs** tab

## ⚡ Common Issues & Fixes

### Issue 1: `admin.initializeApp()` Missing

**Symptom:** "Firebase Admin SDK not initialized"
**Fix:** Add `admin.initializeApp();` at the top of your file

### Issue 2: CORS Error

**Symptom:** Browser shows CORS policy error
**Fix:** Install and use the `cors` package (already in the code above)

### Issue 3: Missing Dependencies

**Symptom:** `Cannot find module 'cors'`
**Fix:**

```bash
cd functions
npm install cors @types/cors
```

### Issue 4: Wrong Node Version

**Symptom:** Deployment fails with version error
**Fix:** Update `engines` in package.json to `"node": "18"`

## 🎯 What Changed in Client-Side Code

The client-side now logs more details:

**Before:**

```
❌ Server error: {error: 'Failed to create user'}
```

**After:**

```
❌ Server error: {error: 'Failed to create user', details: {...}}
Error details: {code: 'auth/phone-number-already-exists', message: '...'}
```

This helps you debug faster!

## ✅ Checklist

Before testing again:

- [ ] Cloud Function has `admin.initializeApp()`
- [ ] CORS is configured
- [ ] Package.json has all dependencies
- [ ] Function is deployed: `firebase deploy --only functions:registerUserWithPhoneNumber`
- [ ] Test with curl returns 201 or 400
- [ ] Check Firebase Console > Functions shows the function is active
- [ ] Logs show "✅ User created successfully" message

## 🆘 Still Not Working?

1. **Check Firebase Admin SDK permissions:**

   - Go to Google Cloud Console
   - IAM & Admin > IAM
   - Find service account: `car-station-6393f@appspot.gserviceaccount.com`
   - Should have role: **Firebase Admin SDK Administrator Service Agent**

2. **View detailed logs:**

   ```bash
   firebase functions:log --only registerUserWithPhoneNumber --limit 50
   ```

3. **Test function locally:**
   ```bash
   cd functions
   npm run serve
   # Then test against localhost:5001/...
   ```

## 📞 Next Steps

Once the function is deployed and working:

1. Go to your web app
2. Try adding a driver with phone number: `0512345678`
3. Check browser console for: `✅ User created successfully in Firebase Auth`
4. Check Firebase Console > Authentication > Users to see the new user

The client-side code is already perfect - just fix the Cloud Function and you're good to go! 🚀
