# FitCheck — Your Digital Closet

FitCheck is a web application that allows users to manage their digital wardrobe, upload clothing items, and get outfit suggestions.

## Features

- User Authentication: Sign up and login using Firebase Authentication
- Digital Wardrobe: Add clothing items (tops, bottoms, shoes, accessories) to your closet
- Outfit Preview: Visualize how your clothes look together
- Outfit Suggestions: Get AI-powered outfit recommendations
- Wardrobe Management: Remove items from your closet

## Project Structure

Fitcheck/
├── index.html          # Main entry point
├── package.json        # Node.js dependencies
├── README.md           # This file
├── Home/               # Home/Dashboard page
│   ├── Home.html       # Main app interface
│   ├── firebase.js     # Firebase configuration
│   └── styles.css      # Home page styles
└── Login/              # Authentication pages
    ├── index.html      # Login page
    ├── firebase.js     # Firebase configuration
    ├── script.js       # Login/Signup logic
    └── styles.css      # Login page styles

## Technology Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Firebase (Authentication, Firestore)
- Storage: Firebase Firestore for data persistence

## Getting Started

1. Clone the repository
2. Install dependencies: npm install
3. Set up Firebase at firebase.google.com - Enable Authentication (Email/Password) and Firestore Database
4. Copy your Firebase config to firebase.js files
5. Open index.html in a web browser

## Usage

1. Sign Up: Create an account on the login page
2. Add Clothes: Click "+ Add New Piece" to upload clothing images
3. Preview Outfits: See how your items look together
4. Get Suggestions: Click "Suggest Outfit" for recommendations
5. Manage Wardrobe: Click "- Manage Wardrobe" to remove items

## License

MIT License
