// State variables
const outfitImages = { shirt: null, pants: null, shoes: null, accessory: null };
let tempUploadData = null;
let pendingDeleteData = null;
let currentOccasion = "Casual";

// --- AI CONFIGURATION ---
// Try using gemini-2.0-flash which is more reliable
const API_KEY = "AIzaSyDLLglF25FLGhFKH1dkeu3dhuoScScsgH0"; 
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
const VISION_API_KEY = "AIzaSyCMPeCwtKUblxsE2Qrfcn-2OfLo1Ov42M0";
const VISION_URL = `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`;

// Valid clothing labels for each category
const CLOTHING_LABELS = {
    shirt: ['shirt', 'top', 'blouse', 't-shirt', 'sweater', 'hoodie', 'jacket', 'coat', 'sleeve', 'outerwear', 'clothing', 'apparel', 'wear', 'dress shirt', 'polo'],
    pants: ['pants', 'jeans', 'trousers', 'shorts', 'skirt', 'bottoms', 'denim', 'leggings', 'joggers', 'chinos'],
    shoes: ['shoe', 'sneaker', 'boot', 'sandal', 'heel', 'footwear', 'loafer', 'slipper', 'trainer', 'running shoe'],
    accessory: ['bag', 'purse', 'watch', 'jewelry', 'belt', 'hat', 'cap', 'scarf', 'glasses', 'sunglasses', 'necklace', 'bracelet', 'ring', 'earring', 'accessory', 'handbag', 'backpack', 'wallet']
};

const STYLIST_PROMPT = `You are a fashion stylist analyzing real clothing items. 

Look at each image carefully and describe:
- What colors do you see? 
- What style is each item (casual, formal, sporty, etc.)?
- How do the pieces work together?

Then give:
- A match rating (1-10)
- 1-2 specific suggestions to improve the outfit

Keep it short - max 3 sentences. Be honest and practical.`;

// --- IMAGE VALIDATION WITH AI (Using Gemini) ---
async function validateImageWithAI(base64Image, category) {
    const categoryLabels = CLOTHING_LABELS[category].join(', ');
    
    const validationPrompt = `Analyze this image and determine if it contains a clothing item that could be categorized as "${category}". 
Valid ${category} items include: ${categoryLabels}.
Respond with ONLY a JSON object in this exact format:
{"valid": true/false, "reason": "brief explanation"}`;

    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: validationPrompt },
                        { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] } }
                    ]
                }]
            })
        });

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0].content.parts[0].text) {
            return { valid: false, message: "Could not analyze image. Please try again." };
        }

        // Parse Gemini's response
        const responseText = data.candidates[0].content.parts[0].text;
        let parsed;
        
        try {
            // Extract JSON from response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            } else {
                // Fallback: check for "valid": true in text
                parsed = { valid: responseText.toLowerCase().includes('"valid": true') || responseText.toLowerCase().includes('valid: true') };
            }
        } catch (e) {
            parsed = { valid: responseText.toLowerCase().includes('true') };
        }

        if (!parsed.valid) {
            return { valid: false, message: parsed.reason || `This doesn't appear to be ${category}. Please upload a ${category} image.` };
        }

        return { valid: true };
    } catch (error) {
        console.error("Image validation error:", error);
        // Allow upload if validation fails
        return { valid: true, message: "Validation skipped" };
    }
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    // Load Dark Mode Preference
    if (localStorage.getItem('fitcheck_theme') === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    // Menu dropdown toggle
    const menuBtn = document.getElementById('menuBtn');
    const userDropdown = document.getElementById('userDropdown');
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('active');
    });
    document.addEventListener('click', () => {
        userDropdown.classList.remove('active');
    });
});

// --- THEME & UI FUNCTIONS ---
function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const target = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', target);
    localStorage.setItem('fitcheck_theme', target);
}

function setOccasion(val, el) {
    currentOccasion = val;
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    if (el) el.classList.add('active');
}

function setOccasionFromInput() {
    const input = document.getElementById('vibeInput');
    const value = input.value.trim();
    
    // List of valid occasions to check against
    const validOccasions = [
        'casual', 'work', 'business', 'formal', 'date', 'date night', 'party', 'gym', 'workout',
        'sports', 'wedding', 'interview', 'school', 'college', 'meeting', 'dinner', 'lunch',
        'brunch', 'beach', 'vacation', 'travel', 'night out', 'hangout', 'home', 'lounge',
        'running', 'cycling', 'yoga', 'exercise', 'birthday', 'celebration', 'christmas', 'halloween',
        'thanksgiving', 'new year', 'prom', 'graduation', 'seminar', 'conference', 'presentation'
    ];
    
    // Check if input is valid or empty
    if (value === '') {
        showToast('Please enter a vibe (e.g., Party, Work, Date Night)', 'error');
        return false;
    } else if (!validOccasions.some(occ => value.toLowerCase().includes(occ))) {
        showToast('Try a valid vibe like "Party", "Work", "Date Night"', 'error');
        return false;
    } else {
        currentOccasion = value;
        return true;
    }
}

function filterWardrobe() {
    const query = document.getElementById('wardrobeSearch').value.toLowerCase();
    const cards = document.querySelectorAll('.remove-item-card');
    cards.forEach(card => {
        const name = card.querySelector('.remove-item-name').textContent.toLowerCase();
        card.style.display = name.includes(query) ? 'block' : 'none';
    });
}

// --- AI OUTFIT SUGGESTION ---
async function checkOutfit() {
    const messageDiv = document.getElementById('resultMessage');
    const favBtn = document.getElementById('saveFavBtn');
    
    // Validate vibe input first
    if (!setOccasionFromInput()) {
        messageDiv.innerHTML = '';
        return;
    }
    
    const user = getCurrentUser();
    
    // Show loading
    favBtn.classList.add('hidden');
    messageDiv.innerHTML = `<span class="loading-ai">Creating random outfit...</span>`;
    
    try {
        // Fetch ALL items from wardrobe
        const snapshot = await db.collection('users').doc(user.uid).collection('outfits').get();
        
        if (snapshot.empty) {
            showToast("No clothes in wardrobe!", "error");
            return;
        }
        
        // Organize items by category
        const wardrobe = { shirt: [], pants: [], shoes: [], accessory: [] };
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.category && wardrobe[data.category]) {
                wardrobe[data.category].push({ image: data.image, id: doc.id });
            }
        });
        
        // Check if we have enough items
        if (wardrobe.shirt.length === 0 && wardrobe.pants.length === 0) {
            showToast("Add some clothes first!", "error");
            return;
        }
        
        // Randomly pick one item from each category
        const randomOutfit = {};
        const icons = { shirt: '👕', pants: '👖', shoes: '👟', accessory: '💍' };
        
        for (const category of ['shirt', 'pants', 'shoes', 'accessory']) {
            if (wardrobe[category].length > 0) {
                const randomItem = wardrobe[category][Math.floor(Math.random() * wardrobe[category].length)];
                randomOutfit[category] = randomItem.image;
                // Update preview
                const previewEl = document.getElementById('preview' + category.charAt(0).toUpperCase() + category.slice(1));
                if (previewEl) {
                    previewEl.innerHTML = `<img src="${randomItem.image}">`;
                }
            } else {
                // Show silhouette if no items
                const previewEl = document.getElementById('preview' + category.charAt(0).toUpperCase() + category.slice(1));
                if (previewEl) {
                    previewEl.innerHTML = `<span class="silhouette">${icons[category]}</span>`;
                }
            }
        }
        
        // Now get AI advice
        messageDiv.innerHTML = `<span class="loading-ai">Styling for ${currentOccasion}...</span>`;
        
        const parts = [{ text: `${STYLIST_PROMPT} Context: The user is dressing for a ${currentOccasion} occasion.` }];
        for (const [type, base64Data] of Object.entries(randomOutfit)) {
            if (base64Data) {
                parts.push({ inlineData: { mimeType: "image/jpeg", data: base64Data.split(',')[1] } });
            }
        }

        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts }] })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }
        
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            messageDiv.textContent = data.candidates[0].content.parts[0].text;
            // Save the random outfit for favorites
            Object.assign(outfitImages, randomOutfit);
            favBtn.classList.remove('hidden');
            showToast("Style advice ready!");
        }
    } catch (error) {
        console.log("AI error, using fallback:", error);
        const suggestions = {
            'Casual': "This casual combo looks relaxed and comfortable! Pro-tip: Roll up your sleeves for a more polished vibe.",
            'Work': "Professional and sharp! Pro-tip: Add a watch to elevate this work-ready look.",
            'Date Night': "Date night glam! Pro-tip: Accessorize with subtle jewelry to complete the look.",
            'Gym': "Ready to crush your workout! Pro-tip: Make sure your sneakers match your activity."
        };
        messageDiv.textContent = suggestions[currentOccasion] || suggestions['Casual'];
        favBtn.classList.remove('hidden');
        showToast("Style advice ready!");
    }
}

// --- SAVE FAVORITE ---
async function saveFavorite() {
    const user = getCurrentUser();
    const advice = document.getElementById('resultMessage').textContent;
    try {
        await db.collection('users').doc(user.uid).collection('favorites').add({
            outfit: outfitImages,
            advice: advice,
            occasion: currentOccasion,
            savedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showToast("Look saved to favorites!");
    } catch (e) { showToast("Error saving", "error"); }
}

// --- FIREBASE CORE FUNCTIONS ---
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    setTimeout(() => { toast.classList.add('hidden'); }, 3000);
}

async function handleImageUpload(input, type) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        tempUploadData = { base64Image: e.target.result, type };
        document.getElementById('modalImagePreview').innerHTML = `<img src="${e.target.result}">`;
        document.getElementById('detailsModal').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

document.getElementById('saveDetailsBtn').onclick = async function() {
    const user = getCurrentUser();
    
    // Check if image was selected
    if (!tempUploadData || !tempUploadData.base64Image) {
        showToast("Please select an image first!", "error");
        return;
    }
    
    const name = document.getElementById('itemName').value.trim();
    const color = document.getElementById('itemColor').value.trim();
    if (!name || !color) return showToast("Name and Color required!", "error");

    try {
        this.textContent = "Uploading...";
        
        // Save to wardrobe collection
        await db.collection('users').doc(user.uid).collection('outfits').add({
            image: tempUploadData.base64Image,
            category: tempUploadData.type,
            name, color,
            description: document.getElementById('itemDescription').value.trim(),
            uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Save to current outfit - use set with merge to ensure it works
        const currentRef = db.collection('users').doc(user.uid).collection('outfits').doc('current');
        await currentRef.set({
            [tempUploadData.type]: tempUploadData.base64Image
        }, { merge: true });
        
        // Update local state
        outfitImages[tempUploadData.type] = tempUploadData.base64Image;
        
        // Update preview
        const previewEl = document.getElementById('preview' + tempUploadData.type.charAt(0).toUpperCase() + tempUploadData.type.slice(1));
        if (previewEl) {
            previewEl.innerHTML = `<img src="${tempUploadData.base64Image}">`;
        }
        
        closeDetailsModal();
        showToast('Item saved!');
    } catch (e) { 
        console.error("Upload error:", e);
        showToast("Upload failed: " + e.message, "error"); 
    } finally { 
        this.textContent = "Add to Closet"; 
        this.disabled = false;
    }
};

// --- NAVIGATION & AUTH ---
function getCurrentUser() { return JSON.parse(localStorage.getItem('fitcheck_current_user')); }
function showUploadSection() { document.getElementById('uploadSection').classList.remove('hidden'); hideOtherSections('uploadSection'); }
function showRemoveCategory() { document.getElementById('removeCategorySection').classList.remove('hidden'); hideOtherSections('removeCategorySection'); }
function hideOtherSections(keep) { ['uploadSection', 'removeCategorySection', 'removeItemsSection', 'favoritesSection'].forEach(s => { if(s !== keep) document.getElementById(s).classList.add('hidden'); }); }
function closeUploadSection() { document.getElementById('uploadSection').classList.add('hidden'); }
function closeDetailsModal() { document.getElementById('detailsModal').classList.add('hidden'); tempUploadData = null; }
function closeRemoveSection() { document.getElementById('removeCategorySection').classList.add('hidden'); document.getElementById('removeItemsSection').classList.add('hidden'); }

// --- FAVORITES ---
function showFavorites() {
    // Close dropdown first
    document.getElementById('userDropdown').classList.remove('active');
    
    const grid = document.getElementById('favoritesGrid');
    grid.innerHTML = 'Loading...';
    
    // Hide other sections
    hideOtherSections('favoritesSection');
    document.getElementById('favoritesSection').classList.remove('hidden');
    
    const user = getCurrentUser();
    db.collection('users').doc(user.uid).collection('favorites').orderBy('savedAt', 'desc').get()
    .then(snapshot => {
        grid.innerHTML = '';
        if (snapshot.empty) {
            grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color: #999;">No favorites yet. Save some outfits!</p>';
        } else {
            snapshot.forEach(doc => {
                const data = doc.data();
                const favDiv = document.createElement('div');
                favDiv.className = 'favorite-card';
                favDiv.innerHTML = `
                    <div class="favorite-images">
                        ${data.outfit?.shirt ? `<img src="${data.outfit.shirt}">` : ''}
                        ${data.outfit?.pants ? `<img src="${data.outfit.pants}">` : ''}
                        ${data.outfit?.shoes ? `<img src="${data.outfit.shoes}">` : ''}
                        ${data.outfit?.accessory ? `<img src="${data.outfit.accessory}">` : ''}
                    </div>
                    <div class="favorite-advice">${data.advice || ''}</div>
                    <div class="favorite-occasion">${data.occasion || ''}</div>
                    <button class="remove-fav-btn" onclick="deleteFavorite('${doc.id}')">Remove</button>
                `;
                grid.appendChild(favDiv);
            });
        }
    });
}

async function deleteFavorite(favId) {
    const user = getCurrentUser();
    try {
        await db.collection('users').doc(user.uid).collection('favorites').doc(favId).delete();
        showToast("Favorite removed!");
        showFavorites(); // Refresh the list
    } catch (e) {
        showToast("Error removing favorite", "error");
    }
}

function closeFavorites() {
    document.getElementById('favoritesSection').classList.add('hidden');
}

async function showRemoveItems(category) {
    const user = getCurrentUser();
    const grid = document.getElementById('removeItemsGrid');
    grid.innerHTML = 'Loading...';
    const snap = await db.collection('users').doc(user.uid).collection('outfits').where('category', '==', category).get();
    grid.innerHTML = snap.empty ? '<p>No items found.</p>' : '';
    snap.forEach(doc => {
        const d = doc.data();
        const div = document.createElement('div');
        div.className = 'remove-item-card';
        div.onclick = () => openConfirmModal(category, doc.id, d.image);
        div.innerHTML = `<img src="${d.image}"><div class="remove-item-name">${d.name}</div>`;
        grid.appendChild(div);
    });
    document.getElementById('removeCategorySection').classList.add('hidden');
    document.getElementById('removeItemsSection').classList.remove('hidden');
}

function openConfirmModal(c, id, img) { pendingDeleteData = { c, id, img }; document.getElementById('confirmModal').classList.remove('hidden'); }
function closeConfirmModal() { document.getElementById('confirmModal').classList.add('hidden'); }

document.getElementById('finalDeleteBtn').onclick = async () => {
    const { c, id, img } = pendingDeleteData;
    const user = getCurrentUser();
    await db.collection('users').doc(user.uid).collection('outfits').doc(id).delete();
    if (outfitImages[c] === img) {
        outfitImages[c] = null;
        document.getElementById('preview' + c.charAt(0).toUpperCase() + c.slice(1)).innerHTML = `<span class="silhouette">${{shirt:'👕',pants:'👖',shoes:'👟',accessory:'💍'}[c]}</span>`;
    }
    showToast("Deleted");
    closeConfirmModal();
    showRemoveItems(c);
};

async function loadOutfits() {
    const user = getCurrentUser();
    const doc = await db.collection('users').doc(user.uid).collection('outfits').doc('current').get();
    if (doc.exists) {
        Object.entries(doc.data()).forEach(([k, v]) => {
            outfitImages[k] = v;
            const el = document.getElementById('preview' + k.charAt(0).toUpperCase() + k.slice(1));
            if (el) el.innerHTML = `<img src="${v}">`;
        });
    }
}

// --- RANDOMIZED GREETING ---
const greetings = [
    "Hey", "Hi", "What's up", "Good to see you", "Welcome back", "Looking good"
];

function getRandomGreeting() {
    return greetings[Math.floor(Math.random() * greetings.length)];
}

function checkAuth() {
    auth.onAuthStateChanged(u => {
        if (u) {
            const user = getCurrentUser();
            document.getElementById('header').classList.remove('hidden');
            document.getElementById('mainContent').classList.remove('hidden');
            document.getElementById('authRequired').classList.add('hidden');
            // Update user name in greeting and dropdown
            const userName = user ? user.name : 'User';
            const greeting = getRandomGreeting();
            document.getElementById('greetingText').textContent = greeting + ', ' + userName;
            document.getElementById('displayUserName').textContent = userName;
            loadOutfits();
        }
    });
}

async function logout() { await auth.signOut(); localStorage.clear(); window.location.href = '../Login/index.html'; }