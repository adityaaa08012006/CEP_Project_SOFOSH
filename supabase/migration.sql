-- ============================================
-- Orphanage Management System - Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. PROFILES TABLE (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'deactivated')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. VISITING SCHEDULES
CREATE TABLE IF NOT EXISTS public.visiting_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_capacity INT NOT NULL CHECK (max_capacity > 0),
  current_bookings INT NOT NULL DEFAULT 0 CHECK (current_bookings >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. APPOINTMENTS
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  schedule_id UUID NOT NULL REFERENCES public.visiting_schedules(id) ON DELETE CASCADE,
  num_visitors INT NOT NULL CHECK (num_visitors > 0),
  purpose TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, schedule_id)
);

-- 4. DONATION CATEGORIES
CREATE TABLE IF NOT EXISTS public.donation_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. DONATION BATCHES (from PDF uploads)
CREATE TABLE IF NOT EXISTS public.donation_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  pdf_url TEXT,
  uploaded_by UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. DONATION ITEMS (what the orphanage needs)
CREATE TABLE IF NOT EXISTS public.donation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.donation_categories(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.donation_batches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  required_qty NUMERIC NOT NULL DEFAULT 0 CHECK (required_qty >= 0),
  fulfilled_qty NUMERIC NOT NULL DEFAULT 0 CHECK (fulfilled_qty >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. DONATIONS (user pledges)
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.donation_items(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  status TEXT NOT NULL DEFAULT 'pledged' CHECK (status IN ('pledged', 'received', 'verified')),
  notes TEXT,
  donated_at TIMESTAMPTZ DEFAULT now(),
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. INVENTORY
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.donation_items(id) ON DELETE CASCADE UNIQUE,
  quantity_on_hand NUMERIC NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
  last_restocked_at TIMESTAMPTZ,
  last_consumed_at TIMESTAMPTZ,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_schedule_id ON public.appointments(schedule_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_visiting_schedules_date ON public.visiting_schedules(date);
CREATE INDEX IF NOT EXISTS idx_donation_items_category ON public.donation_items(category_id);
CREATE INDEX IF NOT EXISTS idx_donation_items_batch ON public.donation_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON public.donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_item_id ON public.donations(item_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON public.donations(status);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visiting_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "Allow insert on signup" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- VISITING SCHEDULES policies
CREATE POLICY "Anyone authenticated can view schedules" ON public.visiting_schedules
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage schedules" ON public.visiting_schedules
  FOR ALL USING (public.is_admin());

-- APPOINTMENTS policies
CREATE POLICY "Users can view own appointments" ON public.appointments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own appointments" ON public.appointments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own appointments" ON public.appointments
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all appointments" ON public.appointments
  FOR ALL USING (public.is_admin());

-- DONATION CATEGORIES policies
CREATE POLICY "Anyone authenticated can view categories" ON public.donation_categories
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage categories" ON public.donation_categories
  FOR ALL USING (public.is_admin());

-- DONATION BATCHES policies
CREATE POLICY "Anyone authenticated can view published batches" ON public.donation_batches
  FOR SELECT USING (auth.role() = 'authenticated' AND status = 'published');
CREATE POLICY "Admins can manage batches" ON public.donation_batches
  FOR ALL USING (public.is_admin());

-- DONATION ITEMS policies
CREATE POLICY "Anyone authenticated can view active items" ON public.donation_items
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage items" ON public.donation_items
  FOR ALL USING (public.is_admin());

-- DONATIONS policies
CREATE POLICY "Users can view own donations" ON public.donations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own donations" ON public.donations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all donations" ON public.donations
  FOR ALL USING (public.is_admin());

-- INVENTORY policies
CREATE POLICY "Anyone authenticated can view inventory" ON public.inventory
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage inventory" ON public.inventory
  FOR ALL USING (public.is_admin());

-- ============================================
-- TRIGGER: Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ENABLE REALTIME on key tables
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.donation_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.visiting_schedules;

-- ============================================
-- SEED: Default donation categories
-- ============================================
INSERT INTO public.donation_categories (name, description) VALUES
  ('Grains & Cereals', 'Rice, wheat, flour, dal, pulses, etc.'),
  ('Dairy Products', 'Milk, butter, ghee, cheese, curd, etc.'),
  ('Fruits & Vegetables', 'Fresh fruits and vegetables'),
  ('Beverages', 'Tea, coffee, juice, water, etc.'),
  ('Snacks & Sweets', 'Biscuits, chocolates, snacks, etc.'),
  ('Hygiene & Toiletries', 'Soap, shampoo, toothpaste, sanitizer, etc.'),
  ('Clothing', 'Shirts, pants, shoes, blankets, etc.'),
  ('Stationery & Books', 'Pens, notebooks, books, school supplies'),
  ('Medicine & Health', 'Medicines, vitamins, first aid, etc.'),
  ('Other', 'Miscellaneous items')
ON CONFLICT (name) DO NOTHING;
