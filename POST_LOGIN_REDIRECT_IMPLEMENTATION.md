# Post-Login Role-Based Redirect Implementation

## Overview

Implemented role-based authentication and redirect logic that checks the authenticated user's email against Firestore collections and redirects them to the appropriate dashboard based on their role.

## Implementation Summary

### 1. New Function in `src/services/firestore.ts`

Created `determineUserRoleAndRedirect()` function that:

- Takes a user's email as input
- Queries three Firestore collections in priority order:
  1. **companies** collection → redirects to `/dashboard`
  2. **users** collection (with `isAdmin` or `isSuperAdmin` check) → redirects to `/admin-dashboard`
  3. **stationscompany** collection → redirects to `/service-distributer`
- Returns an object with:
  - `redirectPath`: The appropriate dashboard route
  - `userType`: The user's role type (company, admin, or service-distributer)
  - `userData`: Optional user data from Firestore
- Returns `null` if the email is not found in any collection

### 2. Updated Login Component (`src/screens/Login And Register/sections/Login/Login.tsx`)

**Changes:**

- Imported `determineUserRoleAndRedirect` from firestore service
- Updated `handleSubmit` function:
  - After successful authentication, calls `determineUserRoleAndRedirect()`
  - Shows error message if user is not found in any authorized collection
  - Sets the correct role in global state
  - Redirects to the appropriate dashboard
- Updated `handleGoogleLogin` function with the same logic

**User Experience:**

- Users now see a clear error message: "لا يمكن العثور على حسابك. يرجى التواصل مع المسؤول" if their email is not in any authorized collection
- Automatic redirect to the correct dashboard based on their role

### 3. Updated AuthListener (`src/components/AuthListener.tsx`)

**Changes:**

- Imported `determineUserRoleAndRedirect` and React Router hooks
- Added role-based authentication on app load/refresh:
  - Checks user role on auth state change
  - Sets correct role in global state
  - Only fetches company data if user is a company type
  - Redirects authenticated users from login page to their appropriate dashboard
  - Signs out users who are not found in any collection
  - Redirects signed-out users to login page

**User Experience:**

- Persistent sessions now maintain correct role information
- Users are automatically redirected to their appropriate dashboard on page refresh
- Unauthorized users are automatically signed out

## Role-Based Redirect Logic

### Priority Order:

1. **Companies Collection** (`companies`)

   - Check: Email exists in collection
   - Redirect: `/dashboard`
   - Role: `company`

2. **Users Collection** (`users`)

   - Check: Email exists AND (`isAdmin === true` OR `isSuperAdmin === true`)
   - Redirect: `/admin-dashboard`
   - Role: `admin`

3. **Stations Company Collection** (`stationscompany`)
   - Check: Email exists in collection
   - Redirect: `/service-distributer`
   - Role: `service-distributer`

### Authorization Flow:

```
User Login
    ↓
Check email in companies → Found? → /dashboard
    ↓ Not Found
Check email in users → Found & Admin? → /admin-dashboard
    ↓ Not Found or Not Admin
Check email in stationscompany → Found? → /service-distributer
    ↓ Not Found
Show Error & Prevent Login
```

## Security Improvements

1. **Authorization Check**: Users must exist in at least one authorized collection
2. **Admin Verification**: Users in the `users` collection must have admin privileges
3. **Role Validation**: User role is determined from Firestore, not hardcoded
4. **Automatic Sign-Out**: Unauthorized users are automatically signed out on refresh

## Files Modified

1. `src/services/firestore.ts`

   - Added `determineUserRoleAndRedirect()` function (lines 2857-2943)

2. `src/screens/Login And Register/sections/Login/Login.tsx`

   - Updated imports
   - Modified `handleSubmit()` function
   - Modified `handleGoogleLogin()` function

3. `src/components/AuthListener.tsx`
   - Updated imports
   - Modified auth state change handler
   - Added role-based redirect on app load

## Testing Recommendations

1. **Test Company Users**:

   - Login with email from `companies` collection
   - Should redirect to `/dashboard`

2. **Test Admin Users**:

   - Login with email from `users` collection with `isAdmin: true`
   - Should redirect to `/admin-dashboard`
   - Login with email from `users` collection with `isSuperAdmin: true`
   - Should redirect to `/admin-dashboard`

3. **Test Service Distributer Users**:

   - Login with email from `stationscompany` collection
   - Should redirect to `/service-distributer`

4. **Test Unauthorized Users**:

   - Login with email not in any collection
   - Should show error message and prevent login

5. **Test Persistent Sessions**:
   - Login and refresh page
   - Should maintain session and stay on correct dashboard
   - Should not redirect if already on correct dashboard

## Console Logging

The implementation includes helpful console logs:

- `🔍 Checking user role for email: [email]`
- `✅ User found in [collection] → [redirect path]`
- `⚠️ Email [email] not found in any authorized collection`
- `🎯 Redirecting to: [path]`
- `✅ User authenticated: [email] - Role: [role]`
- `❌ Error messages for debugging`

## Notes

- The implementation maintains backward compatibility with existing code
- Company data is only fetched for company-type users (performance optimization)
- Users are only redirected from the login page, not when navigating between protected routes
- Error messages are in Arabic for consistency with the application
