# NDS Attendance Tracking System

## 🔥 Firebase Cloud Firestore Setup Instructions

### Step 1: Enable Firestore in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `attendancends-50477`
3. In the left sidebar, click on **"Firestore Database"**
4. Click **"Create database"**
5. Choose **"Start in test mode"** (for now)
6. Select a location (choose closest to your users, e.g., `asia-southeast1`)
7. Click **"Done"**

### Step 2: Configure Firestore Security Rules

In the Firebase Console, go to Firestore Database → Rules and replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      // Admin can read all user profiles
      allow read: if request.auth != null && request.auth.token.email == 'admin@nds.com';
    }
    
    // Attendance collection
    match /attendance/{attendanceId} {
      // Users can read/write their own attendance records
      allow read, write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         request.auth.token.email == 'admin@nds.com');
      // Allow creation if user is authenticated and setting their own userId
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
      // Admin can create/update any attendance record
      allow create, update: if request.auth != null && 
        request.auth.token.email == 'admin@nds.com';
    }
    
    // IP Settings collection - IT admin can read/write
    match /ipSettings/{document=**} {
      allow read, write: if request.auth != null && request.auth.token.email == 'it@nds.com';
    }
    
    // Admin access to everything
    match /{document=**} {
      allow read, write: if request.auth != null && request.auth.token.email == 'admin@nds.com';
    }
  }
}
```

Click **"Publish"** to save the rules.

### Step 3: Enable Authentication

1. In Firebase Console, go to **"Authentication"**
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Enable **"Email/Password"** provider
5. Click **"Save"**

### Step 4: Create Firestore Collections

The app will automatically create these collections when users start using it:
- `users` - User profiles
- `attendance` - Attendance records

## 🚀 How to Use the System

### For Employees:
1. **Sign Up**: Create account with email, full name, and department
2. **Sign In**: Use your email and password
3. **Clock In/Out**: Use the attendance tracker interface

### For Admin:
1. **Admin Login**: 
   - Email: `admin@nds.com`
   - Password: `admin062198`
2. **Dashboard**: Automatically redirected to admin dashboard
3. **View Data**: See all employee attendance from any device
4. **Export**: Download CSV reports
5. **Manage**: Clear all data if needed

## 🔧 Features

### ✅ Cross-Device Data Sharing
- All data stored in Firebase Cloud Firestore
- Admin can see all employee data from any device
- Real-time updates across all devices

### ✅ Real-time Updates
- Live dashboard updates
- Instant synchronization when employees clock in/out
- No page refresh needed

### ✅ Secure Authentication
- Firebase Authentication
- Role-based access (Admin vs Employee)
- Secure password requirements

### ✅ Professional UI
- Modern, responsive design
- Intuitive user interface
- Mobile-friendly

## 🛠️ Technical Details

### Environment Variables
The `.env` file contains your Firebase configuration:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

### Database Structure
```
users/
  {userId}/
    - uid: string
    - email: string
    - fullName: string
    - department: string
    - createdAt: string

attendance/
  {recordId}/
    - id: string
    - name: string
    - department: string
    - clockIn: string
    - clockOut: string | null
    - date: string
    - totalHours: number | null
    - userId: string
    - createdAt: Date
    - updatedAt: Date
```

## 🔍 Troubleshooting

### If Clock-in Doesn't Work:
1. Check browser console for errors
2. Ensure Firestore is enabled in Firebase Console
3. Verify security rules allow read/write access
4. Make sure user profile was created during signup

### If Admin Dashboard Shows No Data:
1. Ensure employees have clocked in from other devices
2. Check Firestore Console to see if data exists
3. Verify real-time listeners are working
4. Check browser console for connection errors

### If Cross-Device Data Doesn't Sync:
1. Ensure all devices have internet connection
2. Check Firestore security rules
3. Verify Firebase project ID is correct
4. Check browser console for authentication errors

## 📱 Departments Available
- Ohio
- NYS
- NYC
- Scheduling
- GIS
- Private
- Specials
- CM
- Admin
- ALG

## 🔐 Security Notes
- Test mode rules allow all access (change for production)
- Admin credentials are hardcoded (change for production)
- All data is stored securely in Firebase
- Authentication required for all operations