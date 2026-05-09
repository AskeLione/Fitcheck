# Backend removal plan

## Goal
Remove legacy Firebase “backend” code (Firebase client initialization) so the app is Supabase-only.

## Steps
1. Delete Firebase client files:
   - Login/firebase.js
   - Home/firebase.js
2. Search repo to confirm there are no references/imports to those Firebase files.
3. Basic runtime sanity:
   - Open Login/index.html -> ensure script loads without module/import errors.
   - Open Home/Home.html -> ensure script loads and UI shows.

## Acceptance criteria
- No `firebase.*` usage remains in the repo.
- No references to `Login/firebase.js` or `Home/firebase.js` remain.
- App still loads using Supabase scripts from `lib/`.

