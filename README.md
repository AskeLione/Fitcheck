# FitCheck — AI Wardrobe Assistant (Supabase)

**100% migrated from Firebase → Supabase!** No Firebase needed.

## Features
- ✅ Auth (Email/Password)
- ✅ Wardrobe management (upload base64 images)
- ✅ AI outfit analysis (Gemini + Vision API)
- ✅ Favorites & current outfits
- ✅ Responsive UI + dark mode

## Quick Start
```
1. Run migrate-supabase.sql (Supabase Dashboard → SQL Editor)
2. npx live-server .
3. http://localhost:8080 → Login → Home
```



## Schema (migrate-supabase.sql)
```
profiles | outfits | favorites | current_outfits
Full RLS | Base64 images | JSON outfits | Active outfit
```

## Tech
- **Frontend**: HTML/JS/CSS (Vanilla + Supabase CDN)
- **Backend**: Supabase (Auth + Postgres) — Firebase removed
- **AI**: Gemini 1.5 Flash + Google Vision


## Test Flow
1. Signup/Login
2. Upload clothes (shirt/pants/shoes/accessory)
3. \"Suggest Outfit\" → AI advice
4. Save favorite
5. Logout/Login → Data persists

**No npm install needed! Pure browser app.**

---
*MIT License*

