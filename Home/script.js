// Full Home script - migrated to shared Supabase (lib/supabase.js)
// Integrates with existing UI + Supabase async clients

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Home script loaded - shared Supabase');
  
  // Import shared Supabase
  const { supabaseAuth, onAuthStateChange, getUserProfile } = await import('./supabase.js');
  const authClient = await supabaseAuth;
  console.log('Home shared Supabase ready');

  // Import Supabase-migrated functions
  const { 
    outfitImages, getCurrentUser, checkOutfit, saveOutfitItem, 
    updateCurrentOutfit, saveFavorite, deleteItem, getUserOutfits, 
    getFavorites, loadCurrentOutfits, checkAuth, logout 
  } = await import('./script-supabase.js');

  // Show UI for logged-in user
  const userInfo = getCurrentUser();
  if (userInfo.uid) {
    document.getElementById('header').classList.remove('hidden');
    document.getElementById('mainContent').classList.remove('hidden');
    document.getElementById('greetingText').textContent = `Hello, ${userInfo.name}`;
    document.getElementById('displayUserName').textContent = userInfo.name;
    
    // Load current outfits
    loadCurrentOutfits().catch(console.error);
  }

  // Auth listener
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
    
    // Update UI
    document.getElementById('header').classList.remove('hidden');
    document.getElementById('mainContent').classList.remove('hidden');
    document.getElementById('greetingText').textContent = `Hello, ${userInfo.name}`;
    document.getElementById('displayUserName').textContent = userInfo.name;
    
    loadCurrentOutfits().catch(console.error);
  });

// Global functions for HTML onclick handlers
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

  console.log('Home fully loaded - all buttons ready');
});
