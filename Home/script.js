// Full Home script
// This file must NOT be broken because Home.html uses inline onclick="..." handlers

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Home script loaded');

  // Import Supabase helpers (single source of truth)
  const { supabaseAuth, onAuthStateChange } = await import('../lib/supabase-config.js');

  await supabaseAuth; // ensure init

  // Import the main Home logic (this file is responsible for wiring window.*)
  const {
    checkOutfit,
    saveFavorite,
    showUploadSection,
    showRemoveCategory,
    showFavorites,
    logout,
    closeUploadSection,
    closeRemoveSection,
    closeFavorites,
    handleImageUpload,
    toggleTheme,
    showRemoveItems,
    closeConfirmModal
  } = await import('./script-supabase.js');

  // Burger menu wiring (Home.html uses ids: menuBtn + userDropdown)
  const menuBtn = document.getElementById('menuBtn');
  const userDropdown = document.getElementById('userDropdown');
  if (menuBtn && userDropdown) {
    menuBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      // CSS expects .active (not .open)
      userDropdown.classList.toggle('active');
    });

    document.addEventListener('click', () => {
      userDropdown.classList.remove('open');
    });

    userDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  // Auth: redirect if not logged in
  onAuthStateChange((event, session) => {
    if (!session?.user) {
      window.location.href = '../Login/index.html';
      return;
    }

    const userInfo = {
      uid: session.user.id,
      name: session.user.user_metadata?.name || session.user.email.split('@')[0],
      email: session.user.email
    };

    localStorage.setItem('fitcheck_current_user', JSON.stringify(userInfo));

    document.getElementById('header')?.classList.remove('hidden');
    document.getElementById('mainContent')?.classList.remove('hidden');
    document.getElementById('greetingText').textContent = `Hello, ${userInfo.name}`;
    document.getElementById('displayUserName').textContent = userInfo.name;
  });

  // Initial paint (based on localStorage snapshot)
  try {
    const userRaw = localStorage.getItem('fitcheck_current_user');
    if (userRaw) {
      const user = JSON.parse(userRaw);
      if (user?.uid) {
        document.getElementById('header')?.classList.remove('hidden');
        document.getElementById('mainContent')?.classList.remove('hidden');
        document.getElementById('greetingText').textContent = `Hello, ${user.name}`;
        document.getElementById('displayUserName').textContent = user.name;
      }
    }
  } catch {}

  // Ensure all globals exist for inline onclick handlers in Home.html
  window.checkOutfit = checkOutfit;
  window.saveFavorite = saveFavorite;
  window.showUploadSection = showUploadSection;
  window.showRemoveCategory = showRemoveCategory;
  window.showFavorites = showFavorites;
  window.logout = logout;
  window.closeUploadSection = closeUploadSection;
  window.closeRemoveSection = closeRemoveSection;
  window.closeFavorites = closeFavorites;
  window.handleImageUpload = handleImageUpload;

  window.toggleTheme = toggleTheme;
  window.showRemoveItems = showRemoveItems;
  window.closeConfirmModal = closeConfirmModal;

  console.log('Home fully loaded - buttons wired');
});
