/**
 * Shared Supabase client - ES Module exports
 * Loads via CDN, exports client + helpers for app-wide use
 */

// Config
const supabaseUrl = 'https://zfrqbbwnawguzwiswimq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmcnFiYnduYXdndXp3aXN3aW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjE3MTIsImV4cCI6MjA5MTYzNzcxMn0.qHtapxyIGwGNBj3KUcb6SxTGGViu4JzOBbcBym9H51I';

// Load Supabase CDN script if not loaded
function loadSupabaseCDN() {
  return new Promise((resolve, reject) => {
    if (window.supabase) {
      resolve(window.supabase);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = () => {
      if (!window.supabase) {
        reject(new Error('Supabase CDN loaded but window.supabase missing'));
        return;
      }
      const client = window.supabase.createClient(supabaseUrl, supabaseKey);
      window.supabaseClient = client; // Global fallback
      resolve(client);
    };
    script.onerror = () => reject(new Error('Failed to load Supabase CDN'));
    document.head.appendChild(script);
  });
}

// Main client promise
const supabasePromise = loadSupabaseCDN().then(client => {
  console.log('Supabase client ready');
  return client;
}).catch(err => {
  console.error('Supabase init failed:', err);
  throw err;
});

export const supabase = supabasePromise;
export const auth = supabasePromise.then(client => client.auth);

// Helpers (matching app usage)
export const supabaseDB = supabasePromise.then(client => client.from.bind(client));
export const supabaseAuth = auth;

export function onAuthStateChange(callback) {
  return supabasePromise.then(client => 
    client.auth.onAuthStateChange(callback)
  );
}

export async function upsertProfile({ id, name, email }) {
  return supabasePromise.then(client => 
    client.from('profiles').upsert({ 
      id, name, email,
      updated_at: new Date().toISOString()
    })
  );
}

export async function getUserProfile(uid) {
  return supabasePromise.then(async client => {
    const { data: { user } } = await client.auth.getUser();
    if (!user || user.id !== uid) return null;
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();
    if (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
    return data;
  });
}

