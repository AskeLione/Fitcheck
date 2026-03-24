// State variables
const outfitImages = { shirt: null, pants: null, shoes: null, accessory: null };
let tempUploadData = null;
let pendingDeleteData = null;
let currentOccasion = "Casual";

// --- AI CONFIGURATION ---
// Using Gemini API for outfit suggestions
const API_KEY = "AIzaSyByilIrxqfciVlKWYJ_62fGWdHK8KiYQPw";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

// Google Cloud Vision API - used to analyze clothing colors and labels
const VISION_API_KEY = "AIzaSyCMPeCwtKUblxsE2Qrfcn-2OfLo1Ov42M0";
const VISION_URL = `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`;

// Valid clothing labels for each category - expanded with more synonyms
const CLOTHING_LABELS = {
    shirt: ['shirt', 'top', 'blouse', 't-shirt', 'sweater', 'hoodie', 'jacket', 'coat', 'sleeve', 'outerwear', 'clothing', 'apparel', 'wear', 'dress shirt', 'polo', 'tank top', 'cardigan', 'vest', 'pullovers', 'long sleeve', 'short sleeve', 'crop top', 'halter', 'bodysuit', 'tee', 'pullover'],
    pants: ['pants', 'jeans', 'trousers', 'shorts', 'skirt', 'bottoms', 'denim', 'leggings', 'joggers', 'chinos', 'cargo pants', 'pant', 'denim pants', 'blue jeans', ' Bermudas', 'culottes', 'capri', 'palazzo'],
    shoes: ['shoe', 'sneaker', 'boot', 'sandal', 'heel', 'footwear', 'loafer', 'slipper', 'trainer', 'running shoe', 'kicks', 'athletic shoe', 'shoes', 'tennis shoe', 'dress shoe', 'flat', 'heels', 'pump', 'stiletto', 'wedge', 'moccasin', 'clog', 'oxford', 'high top', 'low top', 'basketball shoe', ' soccer cleat'],
    accessory: ['bag', 'purse', 'watch', 'jewelry', 'belt', 'hat', 'cap', 'scarf', 'glasses', 'sunglasses', 'necklace', 'bracelet', 'ring', 'earring', 'accessory', 'handbag', 'backpack', 'wallet', 'wallet', 'clutch', 'tote', 'satchel', 'crossbody', 'briefcase', 'pocket watch', 'pendant', 'charm', 'brooch', ' cufflink', 'tie clip', 'beanie', 'fedora', 'beret', 'visor', 'headband', 'wrap', 'shawl', 'stole']
};

const STYLIST_PROMPT = `You are a fashion stylist. Analyze the clothing items shown in the IMAGES provided.

For EACH clothing item you see:
- Identify the specific piece (e.g., crew neck t-shirt, skinny jeans, leather boots)
- Describe the colors, patterns, and any prints you observe
- Note the material/texture (appears to be cotton, denim, leather, etc.)
- Comment on fit and silhouette (loose, fitted, oversized, cropped, etc.)
- Assess the style level (casual, business casual, formal, sporty, trendy, etc.)
- Evaluate the condition and quality

Then analyze the COMPLETE OUTFIT:
- How do these specific pieces work together?
- Color harmony and contrast between the items
- Overall vibe and cohesion of the outfit
- Rate the match (1-10 scale)
- Provide 1-2 specific, actionable suggestions to improve this outfit

Base your entire analysis on what you SEE in the images. Be specific about colors, styles, and details you observe.`;

// --- IMAGE ANALYSIS WITH GOOGLE CLOUD VISION API ---
async function analyzeImageWithVisionAPI(base64Image) {
    try {
        const response = await fetch(VISION_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [{
                    image: { content: base64Image.split(',')[1] },
                    features: [
                        { type: "LABEL_DETECTION", maxResults: 10 },
                        { type: "IMAGE_PROPERTIES" },
                        { type: "OBJECT_LOCALIZATION", maxResults: 10 }
                    ]
                }]
            })
        });

        const data = await response.json();
        
        if (data.error) {
            console.error("Vision API Error:", data.error);
            return null;
        }
        
        const result = data.responses[0];
        return {
            labels: result.labelAnnotations?.map(l => l.description.toLowerCase()) || [],
            colors: result.imagePropertiesAnnotation?.dominantColors?.colors || [],
            objects: result.localizedObjectAnnotations?.map(o => o.name.toLowerCase()) || []
        };
    } catch (error) {
        console.error("Vision API error:", error);
        return null;
    }
}

// --- IMAGE VALIDATION WITH GOOGLE CLOUD VISION API ---
async function validateImageWithVisionAPI(base64Image, category) {
    const categoryLabels = CLOTHING_LABELS[category];
    
    try {
        console.log("Starting Vision API validation for category:", category);
        
        const response = await fetch(VISION_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [{
                    image: { content: base64Image.split(',')[1] },
                    features: [
                        { type: "LABEL_DETECTION", maxResults: 20 },
                        { type: "OBJECT_LOCALIZATION", maxResults: 10 }
                    ]
                }]
            })
        });

        console.log("Vision API Response Status:", response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Vision API Error:", response.status, errorText);
            return { valid: false, message: "AI validation failed. Please try again." };
        }

        const data = await response.json();
        console.log("Vision API Response:", JSON.stringify(data).substring(0, 500));
        
        if (data.error) {
            console.error("Vision API Error:", data.error);
            return { valid: false, message: "AI error: " + data.error.message };
        }

        const result = data.responses[0];
        if (!result) {
            return { valid: false, message: "Could not analyze image. Please try again." };
        }

        // Get labels and objects from the response
        const labels = result.labelAnnotations?.map(l => l.description.toLowerCase()) || [];
        const objects = result.localizedObjectAnnotations?.map(o => o.name.toLowerCase()) || [];
        
        console.log("Detected labels:", labels);
        console.log("Detected objects:", objects);
        
        // Strict category validation with positive and negative matching
        const categoryRules = {
            shirt: {
                positive: ['shirt', 'top', 'blouse', 't-shirt', 'tshirt', 'sweater', 'hoodie', 'jacket', 'cardigan', 'vest', 'tee', 'pullover', 'sleeve', 'outerwear', 'dress shirt', 'polo', 'tank', 'bodysuitsuit'],
                negative: ['shoe', 'boot', 'sandal', 'sneaker', 'pant', 'jean', 'short', 'sock', 'bag', 'purse', 'hat', 'cap', 'watch', 'belt', 'jewelry']
            },
            pants: {
                positive: ['pant', 'jean', 'trouser', 'short', 'skirt', 'bottom', 'denim', 'legging', 'jogger', 'chino', 'cargo', 'bermuda', 'capri'],
                negative: ['shoe', 'boot', 'shirt', 'top', 'blouse', 'jacket', 'coat', 'sweater', 'bag', 'purse', 'hat', 'watch']
            },
            shoes: {
                positive: ['shoe', 'sneaker', 'boot', 'sandal', 'heel', 'footwear', 'loafer', 'slipper', 'trainer', 'athletic shoe', 'kick', 'pump', 'oxford', 'slipper', 'tennis shoe', 'clog'],
                negative: ['shirt', 'top', 'blouse', 'pant', 'jean', 'short', 'bag', 'hat', 'watch', 'jewelry', 'coat']
            },
            accessory: {
                positive: ['bag', 'purse', 'watch', 'jewelry', 'belt', 'hat', 'cap', 'scarf', 'glass', 'sunglasses', 'necklace', 'bracelet', 'ring', 'earring', 'handbag', 'backpack', 'wallet'],
                negative: ['shirt', 'top', 'blouse', 'pant', 'jean', 'shoe', 'boot', 'coat', 'jacket']
            }
        };
        
        const rules = categoryRules[category];
        const allDetected = [...labels, ...objects];
        
        // Check for negative matches (should NOT be present)
        const hasNegativeMatch = allDetected.some(detected =>
            rules.negative.some(neg => detected.includes(neg))
        );
        
        // Check for positive matches (should be present)
        const positiveMatches = allDetected.filter(detected =>
            rules.positive.some(pos => detected.includes(pos))
        );
        
        console.log("Negative matches:", hasNegativeMatch, "Positive matches:", positiveMatches);
        
        if (hasNegativeMatch) {
            return { 
                valid: false, 
                message: `This doesn't appear to be a ${category}. Detected: ${labels.slice(0, 3).join(', ')}` 
            };
        }
        
        if (positiveMatches.length > 0) {
            return { valid: true, message: "Valid " + category };
        } else {
            return { 
                valid: false, 
                message: `This doesn't appear to be a ${category}. Detected: ${labels.slice(0, 3).join(', ')}` 
            };
        }
    } catch (error) {
        console.error("Vision API validation error:", error);
        return { valid: false, message: "Could not analyze image. Please check your internet connection." };
    }
}

// Also keep Gemini for reference (can be enabled if needed)
// async function validateImageWithAI(base64Image, category) { ... }

// --- AI OUTFIT SUGGESTION ---
async function checkOutfit() {
    const messageDiv = document.getElementById('resultMessage');
    const favBtn = document.getElementById('saveFavBtn');
    
    if (!setOccasionFromInput()) {
        messageDiv.innerHTML = '';
        return;
    }
    
    const user = getCurrentUser();
    
    favBtn.classList.add('hidden');
    messageDiv.innerHTML = `<span class="loading-ai">Getting AI suggestions...</span>`;
    
    try {
        const snapshot = await db.collection('users').doc(user.uid).collection('outfits').get();
        
        if (snapshot.empty) {
            showToast("No clothes in wardrobe!", "error");
            return;
        }
        
        const wardrobe = { shirt: [], pants: [], shoes: [], accessory: [] };
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.category && wardrobe[data.category]) {
                wardrobe[data.category].push({ image: data.image, id: doc.id });
            }
        });
        
        if (wardrobe.shirt.length === 0 && wardrobe.pants.length === 0) {
            showToast("Add some clothes first!", "error");
            return;
        }
        
        const randomOutfit = {};
        const icons = { shirt: '👕', pants: '👖', shoes: '👟', accessory: '💍' };
        
        for (const category of ['shirt', 'pants', 'shoes', 'accessory']) {
            if (wardrobe[category].length > 0) {
                const randomItem = wardrobe[category][Math.floor(Math.random() * wardrobe[category].length)];
                randomOutfit[category] = randomItem.image;
                const previewEl = document.getElementById('preview' + category.charAt(0).toUpperCase() + category.slice(1));
                if (previewEl) {
                    previewEl.innerHTML = `<img src="${randomItem.image}">`;
                }
            } else {
                const previewEl = document.getElementById('preview' + category.charAt(0).toUpperCase() + category.slice(1));
                if (previewEl) {
                    previewEl.innerHTML = `<span class="silhouette">${icons[category]}</span>`;
                }
            }
        }
        
        messageDiv.innerHTML = `<span class="loading-ai">Analyzing outfit for ${currentOccasion}...</span>`;
        
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
        console.log("Full Gemini Response:", JSON.stringify(data, null, 2));
        
        if (data.error) {
            console.error("Gemini API Error:", data.error);
            throw new Error(`API Error: ${data.error.message}`);
        }
        
        if (!data.candidates || !data.candidates[0]) {
            console.error("No candidates in response:", data);
            throw new Error("No response from Gemini API");
        }
        
        const aiResponse = data.candidates[0]?.content?.parts?.[0]?.text;
        
        if (!aiResponse) {
            console.error("No text in response:", data.candidates[0]);
            throw new Error("Empty response from AI");
        }
        
        messageDiv.textContent = aiResponse;
        Object.assign(outfitImages, randomOutfit);
        favBtn.classList.remove('hidden');
        showToast("Style advice ready!");
    } catch (error) {
        console.error("AI Error Details:", error);
        messageDiv.innerHTML = `<span style="color: #e74c3c;">⚠️ ${error.message}</span>`;
        showToast("Error: " + error.message, "error");
    }
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    if (localStorage.getItem('fitcheck_theme') === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    const menuBtn = document.getElementById('menuBtn');
    const userDropdown = document.getElementById('userDropdown');
    if (menuBtn && userDropdown) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('active');
        });
        document.addEventListener('click', () => {
            userDropdown.classList.remove('active');
        });
    }
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
    
    const validOccasions = [
        'casual', 'work', 'business', 'formal', 'date', 'date night', 'party', 'gym', 'workout',
        'sports', 'wedding', 'interview', 'school', 'college', 'meeting', 'dinner', 'lunch',
        'brunch', 'beach', 'vacation', 'travel', 'night out', 'hangout', 'home', 'lounge',
        'running', 'cycling', 'yoga', 'exercise', 'birthday', 'celebration', 'christmas', 'halloween',
        'thanksgiving', 'new year', 'prom', 'graduation', 'seminar', 'conference', 'presentation'
    ];
    
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
    reader.onload = async (e) => {
        const base64Image = e.target.result;
        
        // Skip AI validation for now - allow uploads directly
        // Validation can be enabled later after fixing API issues
        
        // Get Vision API analysis for color detection (optional)
        const visionData = await analyzeImageWithVisionAPI(base64Image);
        console.log("Vision API Analysis:", visionData);
        
        tempUploadData = { base64Image, type, visionData };
        document.getElementById('modalImagePreview').innerHTML = `<img src="${base64Image}">`;
        document.getElementById('detailsModal').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

document.getElementById('saveDetailsBtn').onclick = async function() {
    const user = getCurrentUser();
    
    if (!tempUploadData || !tempUploadData.base64Image) {
        showToast("Please select an image first!", "error");
        return;
    }
    
    const name = document.getElementById('itemName').value.trim();
    const color = document.getElementById('itemColor').value.trim();
    if (!name || !color) return showToast("Name and Color required!", "error");

    try {
        this.textContent = "Uploading...";
        
        let detectedColors = [];
        if (tempUploadData.visionData && tempUploadData.visionData.colors) {
            detectedColors = tempUploadData.visionData.colors.slice(0, 3).map(c => {
                const r = c.color.red || 0;
                const g = c.color.green || 0;
                const b = c.color.blue || 0;
                return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
            });
        }
        
        await db.collection('users').doc(user.uid).collection('outfits').add({
            image: tempUploadData.base64Image,
            category: tempUploadData.type,
            name, 
            color,
            description: document.getElementById('itemDescription').value.trim(),
            detectedColors: detectedColors,
            uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        const currentRef = db.collection('users').doc(user.uid).collection('outfits').doc('current');
        await currentRef.set({
            [tempUploadData.type]: tempUploadData.base64Image
        }, { merge: true });
        
        outfitImages[tempUploadData.type] = tempUploadData.base64Image;
        
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

function showFavorites() {
    document.getElementById('userDropdown').classList.remove('active');
    const grid = document.getElementById('favoritesGrid');
    grid.innerHTML = 'Loading...';
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
        showFavorites();
    } catch (e) { showToast("Error removing favorite", "error"); }
}

function closeFavorites() { document.getElementById('favoritesSection').classList.add('hidden'); }

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

const greetings = ["Hey", "Hi", "What's up", "Good to see you", "Welcome back", "Looking good"];

function getRandomGreeting() { return greetings[Math.floor(Math.random() * greetings.length)]; }

function checkAuth() {
    auth.onAuthStateChanged(u => {
        if (u) {
            const user = getCurrentUser();
            document.getElementById('header').classList.remove('hidden');
            document.getElementById('mainContent').classList.remove('hidden');
            document.getElementById('authRequired').classList.add('hidden');
            const userName = user ? user.name : 'User';
            const greeting = getRandomGreeting();
            document.getElementById('greetingText').textContent = greeting + ', ' + userName;
            document.getElementById('displayUserName').textContent = userName;
            loadOutfits();
        }
    });
}

async function logout() { await auth.signOut(); localStorage.clear(); window.location.href = '../Login/index.html'; }
