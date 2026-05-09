# FitCheck - Supabase Setup (No Firebase)

## 1-Click Setup
```
npx live-server .    # or python -m http.server 8000
```
Open http://localhost:8080

## Supabase (Required)
1. https://supabase.com/dashboard → New Project
2. Copy SQL from `migrate-supabase.sql` → SQL Editor → Run
3. **Done!** (Uses hardcoded public anon key)

## Test
```
Login → Add shirts/pants → Suggest → Favorite → Logout/Login
```
AI works offline (Gemini/Vision APIs).

**No config changes needed.**

