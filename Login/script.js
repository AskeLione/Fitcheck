// DOM Elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const showSignup = document.getElementById('showSignup');
const showLogin = document.getElementById('showLogin');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const successText = document.getElementById('successText');
const errorText = document.getElementById('errorText');
const successButton = document.getElementById('successButton');
const errorButton = document.getElementById('errorButton');

// Utility Functions
function showSuccess(message) {
    hideAll();
    successText.textContent = message;
    successMessage.classList.remove('hidden');
}

function showError(message) {
    hideAll();
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
}

function hideAll() {
    loginForm.classList.add('hidden');
    signupForm.classList.add('hidden');
    successMessage.classList.add('hidden');
    errorMessage.classList.add('hidden');
}

function showLoginForm() {
    hideAll();
    loginForm.classList.remove('hidden');
}

function showSignupForm() {
    hideAll();
    signupForm.classList.remove('hidden');
}

// Store user session locally for app access
function setCurrentUser(user) {
    localStorage.setItem('fitcheck_current_user', JSON.stringify(user));
}

function getCurrentUser() {
    const user = localStorage.getItem('fitcheck_current_user');
    return user ? JSON.parse(user) : null;
}

function clearCurrentUser() {
    localStorage.removeItem('fitcheck_current_user');
}

// Event Listeners
showSignup.addEventListener('click', (e) => {
    e.preventDefault();
    showSignupForm();
});

showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    showLoginForm();
});

successButton.addEventListener('click', () => {
    window.location.href = '../Home/index.html';
});

errorButton.addEventListener('click', () => {
    showLoginForm();
});

// Handle Login with Firebase
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }

    try {
        // Sign in with Firebase
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Get user data from Firestore
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            const userInfo = {
                uid: user.uid,
                name: userData.name,
                email: user.email
            };
            
            if (rememberMe) {
                setCurrentUser(userInfo);
            } else {
                sessionStorage.setItem('fitcheck_current_user', JSON.stringify(userInfo));
            }
            
            window.location.href = '../Home/index.html';
        } else {
            showError('User data not found');
        }
    } catch (error) {
        console.error('Login error:', error);
        if (error.code === 'auth/invalid-email') {
            showError('Invalid email address');
        } else if (error.code === 'auth/user-not-found') {
            showError('No account found with this email');
        } else if (error.code === 'auth/wrong-password') {
            showError('Incorrect password');
        } else {
            showError('Login failed: ' + error.message);
        }
    }
});

// Handle Signup with Firebase
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!name || !email || !password || !confirmPassword) {
        showError('Please fill in all fields');
        return;
    }

    if (name.length < 2) {
        showError('Name must be at least 2 characters');
        return;
    }

    if (password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
    }

    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }

    try {
        // Create user with Firebase
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Save user data to Firestore
        await db.collection('users').doc(user.uid).set({
            name: name,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Set current user
        const userInfo = {
            uid: user.uid,
            name: name,
            email: email
        };
        
        setCurrentUser(userInfo);
        
        window.location.href = '../Home/index.html';
    } catch (error) {
        console.error('Signup error:', error);
        if (error.code === 'auth/email-already-in-use') {
            showError('An account with this email already exists');
        } else if (error.code === 'auth/invalid-email') {
            showError('Invalid email address');
        } else if (error.code === 'auth/weak-password') {
            showError('Password is too weak');
        } else {
            showError('Signup failed: ' + error.message);
        }
    }
});

// Check if user is already logged in
function checkAuth() {
    auth.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
            try {
                const userDoc = await db.collection('users').doc(firebaseUser.uid).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    const userInfo = {
                        uid: firebaseUser.uid,
                        name: userData.name,
                        email: userData.email
                    };
                    setCurrentUser(userInfo);
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', checkAuth);

// Logout function
window.logout = async function() {
    try {
        await auth.signOut();
    } catch (error) {
        console.error('Logout error:', error);
    }
    clearCurrentUser();
    sessionStorage.removeItem('fitcheck_current_user');
    window.location.href = '../Login/index.html';
};

// Check auth status function
window.isAuthenticated = function() {
    return getCurrentUser() !== null || sessionStorage.getItem('fitcheck_current_user') !== null;
};

// Get logged in user function
window.getUser = function() {
    return getCurrentUser() || JSON.parse(sessionStorage.getItem('fitcheck_current_user'));
};

