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

// Get users from localStorage
function getUsers() {
    const users = localStorage.getItem('fitcheck_users');
    return users ? JSON.parse(users) : [];
}

// Save users to localStorage
function saveUsers(users) {
    localStorage.setItem('fitcheck_users', JSON.stringify(users));
}

// Get current user from localStorage
function getCurrentUser() {
    const user = localStorage.getItem('fitcheck_current_user');
    return user ? JSON.parse(user) : null;
}

// Set current user
function setCurrentUser(user) {
    localStorage.setItem('fitcheck_current_user', JSON.stringify(user));
}

// Clear current user (logout)
function clearCurrentUser() {
    localStorage.removeItem('fitcheck_current_user');
}

// Validate email format
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate password strength
function validatePassword(password) {
    return password.length >= 6;
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
    // Redirect to main app or dashboard
    window.location.href = '../index.html';
});

errorButton.addEventListener('click', () => {
    // Go back to login form
    showLoginForm();
});

// Handle Login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    // Validate inputs
    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }

    if (!validateEmail(email)) {
        showError('Please enter a valid email address');
        return;
    }

    // Check if user exists
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        showError('Invalid email or password. Please try again.');
        return;
    }

    // Login successful
    if (rememberMe) {
        setCurrentUser(user);
    } else {
        // Session only (expires when browser closes)
        sessionStorage.setItem('fitcheck_current_user', JSON.stringify(user));
    }

    showSuccess(`Welcome back, ${user.name}!`);
});

// Handle Signup
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validate inputs
    if (!name || !email || !password || !confirmPassword) {
        showError('Please fill in all fields');
        return;
    }

    if (name.length < 2) {
        showError('Name must be at least 2 characters');
        return;
    }

    if (!validateEmail(email)) {
        showError('Please enter a valid email address');
        return;
    }

    if (!validatePassword(password)) {
        showError('Password must be at least 6 characters');
        return;
    }

    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }

    // Check if user already exists
    const users = getUsers();
    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
        showError('An account with this email already exists. Please login.');
        return;
    }

    // Create new user
    const newUser = {
        id: Date.now(),
        name: name,
        email: email,
        password: password,
        createdAt: new Date().toISOString()
    };

    // Save user
    users.push(newUser);
    saveUsers(users);

    // Auto login
    setCurrentUser(newUser);

    showSuccess('Account created successfully! Welcome to Fitcheck!');
});

// Check if user is already logged in
function checkAuth() {
    const currentUser = getCurrentUser();
    if (currentUser) {
        // User is logged in, show welcome
        console.log('User is logged in:', currentUser.name);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', checkAuth);

// Logout function (to be called from other pages)
window.logout = function() {
    clearCurrentUser();
    sessionStorage.removeItem('fitcheck_current_user');
    window.location.href = 'Login/index.html';
};

// Check auth status function
window.isAuthenticated = function() {
    return getCurrentUser() !== null || sessionStorage.getItem('fitcheck_current_user') !== null;
};

// Get logged in user function
window.getUser = function() {
    return getCurrentUser() || JSON.parse(sessionStorage.getItem('fitcheck_current_user'));
};

