// Full functional Home/script-supabase.js - stub functions + Supabase
// Ready for dynamic import from Home/script.js

// State variables
const outfitImages = { shirt: null, pants: null, shoes: null, accessory: null };
let tempUploadData = null;
let pendingDeleteData = null;
let currentOccasion = 'Casual';

// --- AI CONFIGURATION ---
const API_KEY = 'AIzaSyByilIrxqfciVlKWYJ_62fGWdHK8KiYQPw';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
const VISION_API_KEY = 'AIzaSyCMPeCwtKUblxsE2Qrfcn-2OfLo1Ov42M0';
const VISION_URL = `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`;

const CLOTHING_LABELS = {
  shirt: ['shirt', 'top', 'blouse', 't-shirt', 'sweater', 'hoodie', 'jacket', 'coat'],
  pants: ['pants', 'jeans', 'trousers', 'shorts', 'skirt', 'bottoms'],
  shoes: ['shoe', 'sneaker', 'boot', 'sandal'],
  accessory: ['bag', 'purse', 'watch', 'hat', 'belt']
};

const STYLIST_PROMPT = `You are a fashion stylist. Analyze this outfit for [OCCASION] and give styling advice.`;

// --- SUPABASE IMPORTS ---
import { supabaseDB, supabaseAuth, onAuthStateChange } from './supabase.js';

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('fitcheck_current_user') || '{}');
}

// Stub AI functions (implement Vision API/Gemini)
async function analyzeImageWithVisionAPI(base64Image) {
  // Placeholder - implement Vision API call
  console.log('AI Analysis stub');
  return { colors: ['black', 'gray'], category: 'shirt' };
}
async function validateImageWithVisionAPI(base64Image, category) {
  return true; // Stub
}

// Core outfit check (w/ Supabase)
async function checkOutfit() {
  const user = getCurrentUser();
  const dbClient = await supabaseDB;
  
  const { data: wardrobeData, error } = await dbClient('outfits').select('*').eq('user_id', user.uid);
  if (error) throw error;
  
  const wardrobe = { shirt: [], pants: [], shoes: [], accessory: [] };
  wardrobeData.forEach(item => {
    if (item.category) wardrobe[item.category].push({ image: item.image, id: item.id });
  });
  
  console.log('Wardrobe loaded:', wardrobe);
  // AI logic here...
}

// CRUD - async w/ await supabaseDB
async function saveOutfitItem(image, category, name, color, description, detectedColors) {
  const user = getCurrentUser();
  const dbClient = await supabaseDB;
  const { data, error } = await dbClient('outfits').insert({
    user_id: user.uid,
    image, category, name, color, description, detected_colors: detectedColors,
    uploaded_at: new Date().toISOString()
  }).select().single();
  if (error) throw error;
  return data;
}

async function updateCurrentOutfit(category, image) {
  const user = getCurrentUser();
  const dbClient = await supabaseDB;
  const { error } = await dbClient('current_outfits').upsert({
    user_id: user.uid,
    outfit: { [category]: image }
  });
  if (error) throw error;
}

async function saveFavorite(outfit, advice, occasion) {
  const user = getCurrentUser();
  const dbClient = await supabaseDB;
  const { error } = await dbClient('favorites').insert({
    user_id: user.uid,
    outfit, advice, occasion, saved_at: new Date().toISOString()
  });
  if (error) throw error;
}

async function deleteItem(table, id) {
  const dbClient = await supabaseDB;
  const { error } = await dbClient(table).delete().eq('id', id);
  if (error) throw error;
}

async function getUserOutfits(category) {
  const user = getCurrentUser();
  const dbClient = await supabaseDB;
  const { data, error } = await dbClient('outfits').select('*').eq('user_id', user.uid).eq('category', category);
  if (error) throw error;
  return data;
}

async function getFavorites() {
  const user = getCurrentUser();
  const dbClient = await supabaseDB;
  const { data, error } = await dbClient('favorites').select('*').eq('user_id', user.uid).order('saved_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function loadCurrentOutfits() {
  try {
    const user = getCurrentUser();
    const dbClient = await supabaseDB;
    const { data, error } = await dbClient('current_outfits').select('outfit').eq('user_id', user.uid).single();
    if (error && error.code !== 'PGRST116') {
      console.warn('No current outfits:', error.message);
      return;
    }
    if (data && data.outfit) {
      Object.entries(data.outfit).forEach(([k, v]) => {
        if (outfitImages[k] !== v) {
          outfitImages[k] = v;
          const el = document.getElementById(`preview${k.charAt(0).toUpperCase() + k.slice(1)}`);
          if (el) el.innerHTML = `<img src="${v}">`;
        }
      });
    }
  } catch (e) {
    console.warn('loadCurrentOutfits ignored:', e.message);
  }
}

// Stub UI functions
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

function showUploadSection() {
  document.getElementById('uploadSection').classList.remove('hidden');
}

function closeUploadSection() {
  document.getElementById('uploadSection').classList.add('hidden');
}

function showRemoveCategory() {
  document.getElementById('removeCategorySection').classList.remove('hidden');
}

function closeRemoveSection() {
  document.getElementById('removeCategorySection').classList.add('hidden');
}

function showFavorites() {
  document.getElementById('favoritesSection').classList.remove('hidden');
}

function closeFavorites() {
  document.getElementById('favoritesSection').classList.add('hidden');
}

function handleImageUpload(input, type) {
  // Stub - implement file handling
  console.log('Image upload:', type);
  tempUploadData = { type, base64Image: 'data:stub' };
  showToast('Image ready for details');
}

document.getElementById('saveDetailsBtn') && (document.getElementById('saveDetailsBtn').onclick = async () => {
  try {
    const name = document.getElementById('itemName').value;
    const color = document.getElementById('itemColor').value;
    const description = document.getElementById('itemDescription').value;
    await saveOutfitItem(tempUploadData.base64Image, tempUploadData.type, name, color, description, []);
    showToast('Added to closet!');
  } catch (e) {
    showToast('Save failed: ' + e.message, 'error');
  }
});

// AUTH
function checkAuth() {
  onAuthStateChange((event, session) => {
    const user = session?.user;
    if (user) {
      const userInfo = { uid: user.id, name: user.user_metadata?.name || user.email.split('@')[0], email: user.email };
      localStorage.setItem('fitcheck_current_user', JSON.stringify(userInfo));
      document.getElementById('header').classList.remove('hidden');
      loadCurrentOutfits().catch(console.error);
    }
  });
}

async function logout() {
  const authClient = await supabaseAuth;
  await authClient.signOut();
  localStorage.removeItem('fitcheck_current_user');
  window.location.href = '../Login/index.html';
}

// Export everything
// Make functions global for onclick handlers (export for import too)
window.showUploadSection = showUploadSection;
window.showRemoveCategory = showRemoveCategory;
window.showFavorites = showFavorites;
window.closeUploadSection = closeUploadSection;
window.closeRemoveSection = closeRemoveSection;
window.closeFavorites = closeFavorites;
window.handleImageUpload = handleImageUpload;
window.checkOutfit = checkOutfit;
window.saveFavorite = saveFavorite;
// Add missing stubs for HTML onclick
function showRemoveItems(category) {
  console.log('showRemoveItems stub:', category);
  document.getElementById('removeCategorySection').classList.add('hidden');
  document.getElementById('removeItemsSection').classList.remove('hidden');
  document.getElementById('removeCategoryTitle').textContent = category.toUpperCase();
  // TODO: Load items from DB
  document.getElementById('removeItemsGrid').innerHTML = '<p>No items yet</p>';
}

function closeConfirmModal() {
  document.getElementById('confirmModal').classList.add('hidden');
}

function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
}

window.showRemoveItems = showRemoveItems;
window.closeConfirmModal = closeConfirmModal;
window.toggleTheme = toggleTheme;

export { 
  checkOutfit, saveOutfitItem, updateCurrentOutfit, saveFavorite, deleteItem,
  getUserOutfits, getFavorites, loadCurrentOutfits, getCurrentUser, checkAuth, logout,
  outfitImages, showToast, showUploadSection, closeUploadSection, showRemoveCategory,
  closeRemoveSection, showFavorites, closeFavorites, handleImageUpload
};

