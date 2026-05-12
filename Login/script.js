document.addEventListener('DOMContentLoaded', async () => {
  console.log('Login script loaded');

  // Import shared Supabase client & await initialization
  const { supabase, supabaseAuth } = await import('../lib/supabase-config.js');

  const authClient = await supabaseAuth;
  const dbClient = await supabase;
  console.log('Supabase clients ready:', authClient, dbClient);

  // DOM Elements
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
    const forms = ['loginForm', 'signupForm', 'forgotPasswordForm', 'successMessage', 'errorMessage'];
    forms.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
  }

  function showLoginForm() {
    hideAll();
    loginForm.classList.remove('hidden');
  }

  function showSignupForm() {
    hideAll();
    signupForm.classList.remove('hidden');
  }

  function showForgotPasswordForm() {
    hideAll();
    forgotPasswordForm.classList.remove('hidden');
  }

  // Local storage utils
  function setCurrentUser(user) {
    localStorage.setItem('fitcheck_current_user', JSON.stringify(user));
  }

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem('fitcheck_current_user') || 'null');
    } catch {
      return null;
    }
  }

  // Toggle events
  showSignup?.addEventListener('click', (e) => {
    e.preventDefault();
    showSignupForm();
  });
  showLogin?.addEventListener('click', (e) => {
    e.preventDefault();
    showLoginForm();
  });
  showForgotPassword?.addEventListener('click', (e) => {
    e.preventDefault();
    showForgotPasswordForm();
  });
  showLoginFromForgot?.addEventListener('click', (e) => {
    e.preventDefault();
    showLoginForm();
  });
  successButton?.addEventListener('click', () => {
    window.location.href = '../Home/Home.html';
  });
  errorButton?.addEventListener('click', () => {
    showLoginForm();
  });

  // LOGIN
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
      showError('Please fill in all fields');
      return;
    }

    try {
      console.log('Login attempt:', email);
      const { data: { user }, error } = await authClient.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: userData } = await dbClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // In case the profile row doesn't exist, single() may return { data: null, error: ... }
      // Normalize to {} so downstream code doesn't crash.
      const safeUserData = userData || {};

      const userInfo = {
        uid: user.id,
        name: userData?.name || user.email.split('@')[0],
        email: user.email
      };

      setCurrentUser(userInfo);
      window.location.href = '../Home/Home.html';
    } catch (error) {
      console.error('Login error:', error);
      let msg = error.message;
      if (error.code === 'auth/invalid-email') msg = 'Invalid email';
      else if (error.code === 'auth/wrong-password') msg = 'Incorrect password';
      showError(msg);
    }
  });

  // SIGNUP
  signupForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!name || !email || !password || !confirmPassword) {
      showError('Please fill in all fields');
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
      console.log('Creating user:', email);
      const { data: { user }, error } = await authClient.signUp({
        email,
        password,
        options: { data: { name } }
      });
      if (error) throw error;

      // Profile (non-blocking)
      await dbClient.from('profiles').upsert({ id: user.id, name, email });

      const userInfo = { uid: user.id, name, email };
      setCurrentUser(userInfo);

      showSuccess('Account created! Redirecting...');
      setTimeout(() => window.location.href = '../Home/Home.html', 1500);
    } catch (error) {
      console.error('Signup error:', error);
      let msg = error.message;
      if (error.code === 'auth/email-already-in-use') msg = 'Email already registered';
      showError(msg);
    }
  });

  // FORGOT PASSWORD
  forgotPasswordForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value.trim();
    if (!email) {
      showError('Please enter email');
      return;
    }

    try {
      const { error } = await authClient.resetPasswordForEmail(email);
      if (error) throw error;
      showSuccess('Reset email sent!');
    } catch (error) {
      showError(error.message);
    }
  });

  // Auth listener
  authClient.onAuthStateChange((event, session) => {
    if (session?.user && event === 'SIGNED_IN') {
      window.location.href = '../Home/Home.html';
    }
  });

  window.logout = async () => {
    await authClient.signOut();
    localStorage.removeItem('fitcheck_current_user');
    location.reload();
  };
});
