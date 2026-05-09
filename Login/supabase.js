import { 
  supabase, 
  auth, 
  supabaseDB, 
  supabaseAuth,
  onAuthStateChange,
  upsertProfile,
  getUserProfile 
} from '../../lib/supabase.js';

// Simple re-exports (no duplicates)
export { 
  supabase, 
  auth,
  supabaseDB, 
  supabaseAuth,
  onAuthStateChange,
  upsertProfile,
  getUserProfile 
};
export * from '../../lib/supabase.js';

console.log('Login Supabase client initialized (async-ready)');

