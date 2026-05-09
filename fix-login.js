// FIXED Login/script.js - Replace entire file content
// DOM Elements (unchanged)
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const showSignup = document.getElementById('showSignup');
const showLogin = document.getElementById('showLogin');
const showForgotPassword = document.getElementById('showForgotPassword');
const showLoginFromForgot = document.getElementById('showLoginFromForgot');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const successText = document.getElementById('successText');
const errorText = document.getElementById('errorText');
const successButton = document.getElementById('successButton');
const errorButton = document.getElementById('errorButton');

// Import Supabase
import { supabaseAuth, supabaseDB, upsertProfile } from './supabase.js';

// Utility Functions (unchanged)
function showSuccess(message) { hideAll(); successText.textContent = message; successMessage.classList.remove('hidden'); }
function showError(message) { hideAll(); errorText.textContent = message; errorMessage.classList.remove('hidden'); }
function hideAll() { ['loginForm', 'signupForm', 'forgotPasswordForm', 'successMessage', 'errorMessage'].forEach(id => document.getElementById(id)?.classList.add('hidden')); }
function showLoginForm() { hideAll(); loginForm.classList.remove('hidden'); }
function showSignupForm() { hideAll(); signupForm.classList.remove('hidden'); }
function showForgotPasswordForm() { hideAll(); forgotPasswordForm.classList.remove('hidden'); }

// Local storage (unchanged)
function setCurrentUser(user) { localStorage.setItem('fitcheck_current_user', JSON.stringify(user)); }
function getCurrentUser() { return JSON.parse(localStorage.getItem('fitcheck_current_user') || 'null'); }

// Event listeners (unchanged)
showSignup?.addEventListener('click', (e) => { e.preventDefault(); showSignupForm(); });
showLogin?.addEventListener('click', (e) => { e.preventDefault(); showLoginForm(); });
showForgotPassword?.addEventListener('click', (e) => { e.preventDefault(); showForgotPasswordForm(); });
showLoginFromForgot?.addEventListener('click', (e) => { e.preventDefault(); showLoginForm(); });
successButton?.addEventListener('click', () => window.location.href = '../Home/Home.html');
errorButton?.addEventListener('click', () => showLoginForm());

// LOGIN
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const rememberMe = document.getElementById('rememberMe').checked;

  try {
    const { data: { user }, error } = await supabaseAuth.signInWithPassword({ email, password });
    if (error) throw error;

    const { data: userData } = await supabaseDB('profiles').select('*').eq('id', user.id).single();
    const userInfo = { uid: user.id, name: userData?.name || user.email.split('@')[0], email: user.email };
    
    (rememberMe ? localStorage : sessionStorage).setItem('fitcheck_current_user', JSON.stringify(userInfo));
    window.location.href = '../Home/Home.html';
  } catch (error) {
    console.error('Login error:', error);
    showError(error.message || 'Login failed');
  }
});

// SIGNUP 
signupForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (password !== confirmPassword) return showError('Passwords do not match');
  if (password.length < 6) return showError('Password too short');

  try {
    const { data: { user }, error } = await supabaseAuth.signUp({ email, password, options: { data: { name } } });
    if (error) throw error;

    await upsertProfile({ id: user.id, name, email });
    const userInfo = { uid: user.id, name, email };
    
    localStorage.setItem('fitcheck_current_user', JSON.stringify(userInfo));
    showSuccess('Account created! Redirecting...');
    setTimeout(() => window.location.href = '../Home/Home.html', 1500);
  } catch (error) {
    console.error('Signup error:', error);
    showError(error.message || 'Signup failed');
  }
});

// FORGOT PASSWORD
forgotPasswordForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('forgotEmail').value.trim();

  try {
    const { error } = await supabaseAuth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) throw error;
    showSuccess('Reset link sent! Check your email.');
  } catch (error) {
    console.error('Reset error:', error);
    showError(error.message || 'Reset failed');
  }
});

// Auth listener
supabaseAuth.onAuthStateChange((event, session) => {
  if (session?.user && event === 'SIGNED_IN') {
    const userInfo = { uid: session.user.id, name: session.user.user_metadata?.name || session.user.email.split('@')[0], email: session.user.email };
    setCurrentUser(userInfo);
    window.location.href = '../Home/Home.html';
  }
});

document.addEventListener('DOMContentLoaded', () => {
  if (getCurrentUser()) window.location.href = '../Home/Home.html';
});

// Global functions
window.logout = async () => {
  await supabaseAuth.signOut();
  localStorage.clear();
  sessionStorage.clear();
  window.location.reload();
};
window.getCurrentUser = getCurrentUser;
