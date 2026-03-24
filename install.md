# FitCheck Installation Guide

This guide will help you set up and run the FitCheck web application locally.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** (optional, for cloning) - [Download here](https://git-scm.com/)
- A modern web browser (Chrome, Firefox, Edge, or Safari)

---

## Installation Steps

### 1. Clone or Download the Project

If you have Git installed:
```bash
git clone <repository-url>
cd Fitcheck
```

Or download and extract the ZIP file to your desired location.

### 2. Install Dependencies

Open your terminal in the project root directory and run:

```bash
npm install
```

This will install all required dependencies defined in `package.json`:
- firebase (v12.10.0)

### 3. Firebase Setup

FitCheck uses Firebase for authentication and database storage. Follow these steps to set up Firebase:

#### Step 3.1: Create a Firebase Project

1. Go to [firebase.google.com](https://firebase.google.com) and sign in with your Google account
2. Click "Go to Console" in the top-right corner
3. Click "Add project" and enter "FitCheck" as the project name
4. Disable Google Analytics (optional) and create the project
5. Wait for Firebase to create your project

#### Step 3.2: Enable Authentication

1. In the Firebase Console, click **Build** → **Authentication** in the left sidebar
2. Click **Get Started**
3. Go to the **Sign-in method** tab
4. Find **Email/Password** in the list and click on it
5. Toggle **Enable** to turn it on
6. Click **Save**

#### Step 3.3: Enable Firestore Database

1. In the Firebase Console, click **Build** → **Firestore Database** in the left sidebar
2. Click **Create Database**
3. Select a location near you (or use the default)
4. Choose **Start in production mode** (or test mode)
5. Click **Create**

#### Step 3.4: Get Firebase Configuration

1. In the Firebase Console, click the **gear icon** (⚙️) next to **Project Overview** in the left sidebar
2. Click **Project settings**
3. Scroll down to the **Your apps** section
4. Click the **</>** (web) icon to register a web app
5. Enter "FitCheck" as the app nickname
6. Click **Register app**
7. Copy the `firebaseConfig` object (it looks like the example below):

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 4. Configure Firebase in the Project

You need to update the Firebase configuration in two files:

#### 4.1. Update `Login/firebase.js`

Open `Login/firebase.js` and replace the `firebaseConfig` object with your own config:

```javascript
// Login/firebase.js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
```

#### 4.2. Update `Home/firebase.js`

Open `Home/firebase.js` and do the same:

```javascript
// Home/firebase.js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
```

---

## Running the Application

### Option 1: Open Directly in Browser

Simply open the `index.html` file in your web browser:

```bash
# On Windows
start index.html

# On macOS
open index.html

# On Linux
xdg-open index.html
```

Or navigate to the project folder and double-click `index.html`.

### Option 2: Use a Local Server (Recommended)

For the best experience, use a local development server:

#### Using Python:
```bash
# Python 3
python -m http.server 8000
```

#### Using Node.js (http-server):
```bash
npx http-server
```

Then open your browser and go to:
- `http://localhost:8000` (if using Python)
- `http://localhost:8080` (if using http-server)

---

## Troubleshooting

### Common Issues

1. **Firebase connection error**
   - Make sure you copied the correct `firebaseConfig` values
   - Verify Authentication and Firestore are enabled in Firebase Console

2. **Page not loading**
   - Check browser console (F12) for errors
   - Ensure you're running from a local server or opening index.html correctly

3. **Authentication not working**
   - Verify you're using the latest version of Firebase SDK
   - Check that Email/Password authentication is enabled in Firebase Console

4. **CORS errors (if using local server)**
   - Use a local server instead of opening file:// directly

### Getting Help

If you encounter any issues:
1. Check the browser console for error messages
2. Verify your Firebase configuration is correct
3. Ensure all dependencies are installed (`npm install`)
4. Check the main README.md for additional information

---

## Project Structure

```
Fitcheck/
├── index.html              # Main entry point
├── package.json            # Node.js dependencies
├── install.md              # This installation guide
├── README.md               # Project documentation
├── Home/                   # Home/Dashboard page
│   ├── Home.html           # Main app interface
│   ├── firebase.js         # Firebase configuration
│   ├── script.js           # App logic
│   └── styles.css          # Styles
└── Login/                  # Authentication pages
    ├── index.html          # Login page
    ├── firebase.js         # Firebase configuration
    ├── script.js           # Auth logic
    └── styles.css          # Styles
```

---

## Next Steps

Once the application is running:
1. Create an account on the login page
2. Add clothing items to your digital wardrobe
3. Preview outfits and get AI suggestions
4. Manage your wardrobe by removing items

Happy coding! 🚀

