-- COMPLETE SUPABASE SETUP for Fitcheck (Fixed)
-- Supabase Dashboard → SQL Editor → New Query → Paste ALL → RUN

-- 1. Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  name text,
  email text,
  created_at timestamptz DEFAULT now()
);

-- 2. Outfits/Wardrobe
CREATE TABLE IF NOT EXISTS outfits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  image text, -- base64 images
  category text CHECK (category IN ('shirt','pants','shoes','accessory')),
  name text, color text, description text, 
  detected_colors text[],
  uploaded_at timestamptz DEFAULT now()
);

-- 3. Favorites
CREATE TABLE IF NOT EXISTS favorites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  outfit jsonb, -- {shirt:base64, pants:base64...}
  advice text, occasion text,
  saved_at timestamptz DEFAULT now()
);

-- 4. Current outfits
CREATE TABLE IF NOT EXISTS current_outfits (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  outfit jsonb -- {shirt:base64, pants:base64...}
);

-- 5. RLS SECURITY (REQUIRED)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid()::uuid = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid()::uuid = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid()::uuid = id);

ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "outfits_select" ON outfits FOR SELECT USING (auth.uid()::uuid = user_id);
CREATE POLICY "outfits_insert" ON outfits FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);
CREATE POLICY "outfits_update" ON outfits FOR UPDATE USING (auth.uid()::uuid = user_id);
CREATE POLICY "outfits_delete" ON outfits FOR DELETE USING (auth.uid()::uuid = user_id);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites_select" ON favorites FOR SELECT USING (auth.uid()::uuid = user_id);
CREATE POLICY "favorites_insert" ON favorites FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);
CREATE POLICY "favorites_update" ON favorites FOR UPDATE USING (auth.uid()::uuid = user_id);
CREATE POLICY "favorites_delete" ON favorites FOR DELETE USING (auth.uid()::uuid = user_id);

ALTER TABLE current_outfits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "current_outfits_select" ON current_outfits FOR SELECT USING (auth.uid()::uuid = user_id);
CREATE POLICY "current_outfits_all" ON current_outfits FOR ALL USING (auth.uid()::uuid = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_outfits_user_category ON outfits(user_id, category);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id, saved_at DESC);

-- Success (Supabase compatible)
SELECT '✅ Tables + RLS created! Ready to test app.' as status;
