# Add Driver - Firebase Cloud Function Integration

## Overview

This document describes the integration of the Firebase Cloud Function `registerUserWithPhoneNumber` into the "Add Driver" workflow in the company dashboard.

## Implementation Summary

### Files Modified

1. **`src/services/auth.ts`**

   - Added `formatPhoneNumber()` utility function
   - Added `registerUserWithPhoneNumber()` function to call the Cloud Function

2. **`src/screens/AddDriver/sections/VehicleInformationSection/VehicleInformationSection.tsx`**
   - Updated to import and call `registerUserWithPhoneNumber()` after successful Firestore driver addition

## Key Features

### 1. Phone Number Formatting

The `formatPhoneNumber()` utility ensures all phone numbers are properly formatted with the `+966` prefix:

**Handles multiple input formats:**

- `+966512345678` → `+966512345678` (already formatted)
- `966512345678` → `+966512345678` (adds +)
- `0512345678` → `+966512345678` (removes leading 0, adds +966)
- `512345678` → `+966512345678` (adds +966)

**Example usage:**

```typescript
formatPhoneNumber("0512345678"); // Returns: "+966512345678"
formatPhoneNumber("+966512345678"); // Returns: "+966512345678"
formatPhoneNumber("512345678"); // Returns: "+966512345678"
```

### 2. Cloud Function Integration

The `registerUserWithPhoneNumber()` function:

**Cloud Function URL:**

```
https://us-central1-car-station-6393f.cloudfunctions.net/registerUserWithPhoneNumber
```

**Request Format:**

```json
{
  "phoneNumber": "+966512345678"
}
```

**Response Handling:**

| Status Code   | Description                        | Action                                                       |
| ------------- | ---------------------------------- | ------------------------------------------------------------ |
| `201`         | User created successfully          | Show success message, log UID                                |
| `400`         | Bad request or user already exists | If "already exists" → treat as success, otherwise show error |
| `500`         | Server error                       | Show error message to user                                   |
| Network error | Connection failed                  | Show network error message                                   |

### 3. Add Driver Workflow

The updated workflow in `VehicleInformationSection.tsx`:

```typescript
async function handleSubmit() {
  // 1. Add driver to Firestore
  const result = await addCompanyDriver(driverData);

  // 2. Register user in Firebase Auth via Cloud Function
  const authResult = await registerUserWithPhoneNumber(form.values.phone);

  // 3. Handle results
  if (authResult.success) {
    // Show success message
    addToast({
      title: "Success",
      message: "Driver added and auth account created",
    });
  } else {
    // Show warning (Firestore succeeded, but Auth failed)
    addToast({ title: "Warning", message: "Driver added, but auth failed" });
  }

  // 4. Continue with UI updates
  addDriver(newDriver);
  navigate("/drivers");
}
```

## Error Handling

### Graceful Degradation

The implementation uses **graceful degradation**:

- If Firestore succeeds but Cloud Function fails → Driver is still added, warning shown
- If Cloud Function returns "user already exists" → Treated as success
- Network errors → Logged and shown to user, but don't block the process

### Console Logging

Comprehensive logging for debugging:

```typescript
// Success logs
console.log("✅ User created successfully in Firebase Auth:", data);
console.log("Firebase Auth UID:", authResult.uid);

// Warning logs
console.warn("⚠️ Bad request or user already exists:", errorData);
console.error("⚠️ Firebase Auth registration failed:", authResult.message);

// Error logs
console.error("❌ Server error:", errorData);
console.error("❌ Network error calling Cloud Function:", error);
```

### User Feedback

**Success (Both operations succeed):**

```
تم إضافة السائق وإنشاء حساب المصادقة بنجاح
(Driver added and authentication account created successfully)
```

**Warning (Firestore succeeds, Auth fails):**

```
تمت إضافة السائق إلى Firestore، لكن حدث خطأ في إنشاء حساب المصادقة: [error message]
(Driver added to Firestore, but error creating authentication account: [error message])
```

**Error (Firestore fails):**

```
حدث خطأ أثناء إضافة السائق. يرجى المحاولة مرة أخرى.
(Error adding driver. Please try again.)
```

## Testing Guide

### Prerequisites

1. Ensure the Cloud Function is deployed and accessible
2. Verify the function URL matches your Firebase project configuration
3. Check that the function has CORS enabled for your domain

### Test Cases

#### Test Case 1: Successful Driver Addition

**Steps:**

1. Navigate to Add Driver page
2. Fill in all required fields with valid data
3. Enter phone: `0512345678`
4. Submit form

**Expected Result:**

- Driver added to Firestore
- Cloud Function called with `+966512345678`
- Success message shown
- Redirected to drivers list

**Console Output:**

```
Submitting driver data to Firestore: {...}
Driver added to Firestore: {id: "..."}
Registering user in Firebase Auth with phone: 0512345678
Calling Cloud Function: https://us-central1-car-station-6393f.cloudfunctions.net/registerUserWithPhoneNumber
Cloud Function response status: 201
✅ User created successfully in Firebase Auth: {uid: "..."}
```

#### Test Case 2: User Already Exists

**Steps:**

1. Add a driver with a phone number that's already registered
2. Submit form

**Expected Result:**

- Driver added to Firestore
- Cloud Function returns 400 with "user already exists"
- Treated as success (warning logged but success message shown)
- Redirected to drivers list

**Console Output:**

```
Cloud Function response status: 400
⚠️ Bad request or user already exists: {message: "User already exists"}
✅ Firebase Auth registration successful: المستخدم موجود بالفعل في Firebase Auth
```

#### Test Case 3: Cloud Function Unavailable

**Steps:**

1. Temporarily disable the Cloud Function or simulate network error
2. Submit form

**Expected Result:**

- Driver added to Firestore
- Network error caught
- Warning message shown to user
- Driver still visible in drivers list

**Console Output:**

```
Driver added to Firestore: {id: "..."}
❌ Network error calling Cloud Function: [error details]
⚠️ Firebase Auth registration failed: فشل الاتصال بخادم Firebase...
```

#### Test Case 4: Phone Number Formatting

**Test various formats:**

```typescript
// Test in browser console:
import { formatPhoneNumber } from "./services/auth";

console.log(formatPhoneNumber("0512345678")); // +966512345678
console.log(formatPhoneNumber("+966512345678")); // +966512345678
console.log(formatPhoneNumber("966512345678")); // +966512345678
console.log(formatPhoneNumber("512345678")); // +966512345678
console.log(formatPhoneNumber("05 1234 5678")); // +966512345678 (spaces removed)
```

### Manual Testing Checklist

- [ ] Test with phone starting with `0` (e.g., `0512345678`)
- [ ] Test with phone starting with `5` (e.g., `512345678`)
- [ ] Test with phone starting with `+966` (e.g., `+966512345678`)
- [ ] Test with phone starting with `966` (e.g., `966512345678`)
- [ ] Test with phone containing spaces (e.g., `05 1234 5678`)
- [ ] Test with existing phone number (should handle gracefully)
- [ ] Test with network disconnected (should show error)
- [ ] Test with invalid phone format
- [ ] Verify driver appears in Firestore
- [ ] Verify user appears in Firebase Auth (if successful)

## Configuration

### Firebase Project Settings

**Project ID:** `car-station-6393f`
**Region:** `us-central1` (default)

**To change region:** Update `region` constant in `src/services/auth.ts`:

```typescript
const region = "us-central1"; // Change to your region if different
```

**Common regions:**

- `us-central1` (US)
- `europe-west1` (Belgium)
- `asia-northeast1` (Tokyo)

### Environment Variables (Optional)

For better maintainability, consider moving to environment variables:

**`.env`:**

```env
VITE_FIREBASE_PROJECT_ID=car-station-6393f
VITE_FIREBASE_REGION=us-central1
```

**Usage:**

```typescript
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const region = import.meta.env.VITE_FIREBASE_REGION;
```

## Troubleshooting

### Issue: Cloud Function returns 404

**Possible causes:**

- Function not deployed
- Wrong region
- Wrong function name

**Solution:**

1. Verify function is deployed: `firebase deploy --only functions:registerUserWithPhoneNumber`
2. Check Firebase Console > Functions to see deployed functions
3. Verify region matches your deployment

### Issue: CORS Error

**Error message:** `Access-Control-Allow-Origin` error in console

**Solution:**
Add CORS headers to your Cloud Function:

```typescript
// In your Cloud Function
import * as cors from "cors";
const corsHandler = cors({ origin: true });

export const registerUserWithPhoneNumber = functions.https.onRequest(
  (request, response) => {
    corsHandler(request, response, () => {
      // Your function logic
    });
  }
);
```

### Issue: Network Error

**Error message:** `Failed to fetch` or `Network request failed`

**Possible causes:**

- Internet connection issues
- Firewall blocking request
- Cloud Function not accessible

**Solution:**

1. Test Cloud Function URL directly in browser
2. Check network tab in DevTools
3. Verify Cloud Function permissions

### Issue: Phone Number Format Invalid

**Error message:** `Invalid phone number format`

**Solution:**

- Ensure phone has at least 9 digits after +966
- Valid format: `+966512345678` (Saudi mobile numbers start with 5)
- Update validation if needed for landlines or other formats

## Future Enhancements

### Recommendations

1. **Add SMS Verification**

   - Send verification code via SMS after creating auth account
   - Verify code before finalizing driver registration

2. **Store Auth UID in Firestore**

   - Update driver document with Firebase Auth UID
   - Enables linking between Auth and Firestore records

3. **Retry Logic**

   - Implement automatic retry for failed Cloud Function calls
   - Exponential backoff for network errors

4. **Background Queue**

   - Queue failed registrations for retry
   - Process in background without blocking UI

5. **Admin Dashboard**
   - Show registration status for each driver
   - Manual retry option for failed registrations

## Summary

This implementation successfully integrates the Firebase Cloud Function for user registration into the Add Driver workflow with:

✅ Automatic phone number formatting with +966 prefix
✅ Proper error handling for all response codes (201, 400, 500)
✅ Graceful degradation (Firestore succeeds even if Auth fails)
✅ Comprehensive logging for debugging
✅ User-friendly feedback in Arabic
✅ Network error handling
✅ "User already exists" handling

The integration is production-ready and follows best practices for error handling and user experience.
