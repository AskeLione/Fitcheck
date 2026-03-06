// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAFP2zieiS0_HEpoU9BUxb3BgkF2NQrgaM",
  authDomain: "fitcheck-5c860.firebaseapp.com",
  projectId: "fitcheck-5c860",
  storageBucket: "fitcheck-5c860.firebasestorage.app",
  messagingSenderId: "369638029947",
  appId: "1:369638029947:web:263605c83aaac94c5d40de",
  measurementId: "G-ZBHY2ZXYVG"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

