import { 
  supabase, 
  auth as supabaseAuth,
  supabaseDB, 
  supabaseAuth as authHelper,
  onAuthStateChange,
  upsertProfile,
  getUserProfile 
} from '../../lib/supabase.js';

// Simple re-exports (no duplicates)
export { 
  supabase, 
  supabaseAuth,
  supabaseDB, 
  onAuthStateChange, 
  upsertProfile,
  getUserProfile 
};
export * from '../../lib/supabase.js';

console.log('Home Supabase client loaded (async-ready)');

