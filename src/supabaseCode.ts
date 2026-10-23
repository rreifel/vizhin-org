export const SUPABASE_DDL = `-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PARTNERS TABLE
CREATE TABLE IF NOT EXISTS public.partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    accent_color VARCHAR(50) DEFAULT '#3b82f6',
    domain VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    accent_color VARCHAR(50) DEFAULT '#10b981',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. PROFILES TABLE (linked to auth.users in Supabase)
-- This table allows MULTIPLE ADMINS per Entity since user profiles can be linked or reference the same company/partner.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) CHECK (role IN ('SUPER_ADMIN', 'PARTNER_ADMIN', 'CUSTOMER_ADMIN')) DEFAULT 'CUSTOMER_ADMIN' NOT NULL,
    partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for speedy queries on relations
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_partner ON public.profiles(partner_id);
CREATE INDEX IF NOT EXISTS idx_profiles_customer ON public.profiles(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_partner ON public.customers(partner_id);
`;

export const SUPABASE_RLS = `-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ====== POLICY FOR PARTNERS ======
-- 1. Super Admin has full power
CREATE POLICY "Super Admins can do anything on partners"
ON public.partners FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'SUPER_ADMIN'
  )
);

-- 2. Partner Admins can view only their own partner record
CREATE POLICY "Partner Admins can view own partner"
ON public.partners FOR SELECT USING (
  id IN (
    SELECT partner_id FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'PARTNER_ADMIN'
  )
);


-- ====== POLICY FOR CUSTOMERS ======
-- 1. Super Admin has full power on customers
CREATE POLICY "Super Admins can do anything on customers"
ON public.customers FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'SUPER_ADMIN'
  )
);

-- 2. Partner Admins can manage customers belonging to their partner_id
CREATE POLICY "Partner Admins can manage own partner's customers"
ON public.customers FOR ALL USING (
  partner_id IN (
    SELECT partner_id FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'PARTNER_ADMIN'
  )
);

-- 3. Customer Admins can read only their own customer record
CREATE POLICY "Customer Admins can view own customer record"
ON public.customers FOR SELECT USING (
  id IN (
    SELECT customer_id FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'CUSTOMER_ADMIN'
  )
);


-- ====== POLICY FOR PROFILES ======
-- 1. Super Admin full management
CREATE POLICY "Super Admin manage all profiles"
ON public.profiles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
  )
);

-- 2. Partner Admins can manage profiles belonging to their own partner or customers of their partner
CREATE POLICY "Partner Admin manage team profiles"
ON public.profiles FOR ALL USING (
  partner_id IN (
    SELECT partner_id FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'PARTNER_ADMIN'
  )
);

-- 3. Customer Admins can read other admins/users of the SAME Customer
CREATE POLICY "Customer Admins can view and list same-customer profiles"
ON public.profiles FOR SELECT USING (
  customer_id IN (
    SELECT customer_id FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'CUSTOMER_ADMIN'
  )
);
`;

export const SUPABASE_REACT_HOOK = `import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Get these from your Supabase Dashboard (Both VITE_ and NEXT_PUBLIC_ prefixes are supported!)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function useSupabaseSession() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchProfile(userId: string) {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(\`
          id, email, name, role, partner_id, customer_id, avatar_url, is_active,
          partners (name, logo_url, accent_color),
          customers (name, logo_url, accent_color)
        \`)
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error('Error fetching user profile:', err);
    } finally {
      setLoading(false);
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { session, profile, loading, signOut };
}
`;

export const PHP_EXPLANATION = `### Handling Auth validation in PHP (Hostinger)

If you have a PHP site on Hostinger but use Supabase as your serverless database and auth provider, you have two highly secure options:

1. **Client-Side Authorization (Recommended & Modern)**
   Keep your page structure simple. Fetch pages using static HTML/JS. In JavaScript, invoke \`supabase.auth.getSession()\` first. If no session is active, redirect them immediately to your Login page on Hostinger:
   \`\`\`javascript
   if (!session) {
       window.location.href = '/login.php';
   }
   \`\`\`

2. **Server-Side Token Verification in PHP**
   When the user logs in on the client, Supabase issues an **access_token (JWT)**.
   You can store this token in a cookie. In your PHP pages, extract the cookied JWT and verify its signature with your **Supabase JWT Secret** (found in Project Settings -> API).
   
   Here is a helper script to verify Supabase JWT token in PHP:
   \`\`\`php
   <?php
   function verify_supabase_jwt($jwt_token, $secret_key) {
       $parts = explode('.', $jwt_token);
       if (count($parts) != 3) return false;
       list($header, $payload, $signature) = $parts;
       
       // Recreate signature
       $valid_signature = hash_hmac('sha256', "$header.$payload", $secret_key, true);
       $base64_signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($valid_signature));
       
       if ($base64_signature !== $signature) {
           return false; // Invalid token signature!
       }
       
       $user_data = json_decode(base64_decode($payload), true);
       // Now you can verify expiration
       if ($user_data['exp'] < time()) {
           return false; // Token expired!
       }
       
       return $user_data; // This returns user info & metadata securely on the server!
   }
   ?>
   \`\`\`
`;
