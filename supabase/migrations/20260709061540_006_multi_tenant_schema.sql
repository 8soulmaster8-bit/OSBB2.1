/*
# Multi-Tenant SaaS Architecture - Schema

This migration adds multi-tenant support to the OSBB application.

1. New Tables:
   - `tenants`: OSBB organizations (customers)
   - `subscriptions`: Subscription plans for each tenant
   - `payments`: Payment history

2. Modified Tables:
   - `profiles`: Added tenant_id and is_super_admin columns
   - `meters`: Added tenant_id column
   - `bills`: Added tenant_id column
   - `requests`: Added tenant_id column
*/

-- ═══════════════════════════════════════════════════════════════════
-- TENANTS TABLE (CREATE FIRST - referenced by other tables)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  city text NOT NULL,
  address text,
  contact_email text,
  contact_phone text,
  status text NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'past_due', 'suspended')),
  apartments_count int DEFAULT 0,
  residents_count int DEFAULT 0,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_city ON tenants(city);

-- ═══════════════════════════════════════════════════════════════════
-- SUBSCRIPTIONS TABLE
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'basic' CHECK (plan IN ('basic', 'pro', 'enterprise')),
  status text NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'past_due', 'canceled', 'unpaid')),
  price_per_month numeric NOT NULL DEFAULT 0,
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  canceled_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- ═══════════════════════════════════════════════════════════════════
-- PAYMENTS TABLE
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id),
  amount numeric NOT NULL,
  currency text DEFAULT 'UAH',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  description text,
  paid_at timestamptz,
  stripe_invoice_id text,
  stripe_payment_intent_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at);

-- ═══════════════════════════════════════════════════════════════════
-- ADD COLUMNS TO EXISTING TABLES (now that tenants exists)
-- ═══════════════════════════════════════════════════════════════════

-- Add tenant_id to profiles
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'tenant_id') THEN
    ALTER TABLE profiles ADD COLUMN tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add is_super_admin to profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_super_admin') THEN
    ALTER TABLE profiles ADD COLUMN is_super_admin boolean DEFAULT false;
  END IF;
END $$;

-- Add tenant_id to meters
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meters' AND column_name = 'tenant_id') THEN
    ALTER TABLE meters ADD COLUMN tenant_id uuid REFERENCES tenants(id);
  END IF;
END $$;

-- Add tenant_id to bills
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bills' AND column_name = 'tenant_id') THEN
    ALTER TABLE bills ADD COLUMN tenant_id uuid REFERENCES tenants(id);
  END IF;
END $$;

-- Add tenant_id to requests
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'requests' AND column_name = 'tenant_id') THEN
    ALTER TABLE requests ADD COLUMN tenant_id uuid REFERENCES tenants(id);
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- INDEXES FOR TENANT COLUMNS
-- ═══════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_meters_tenant ON meters(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bills_tenant ON bills(tenant_id);
CREATE INDEX IF NOT EXISTS idx_requests_tenant ON requests(tenant_id);

-- ═══════════════════════════════════════════════════════════════════
-- UPDATED_AT TRIGGERS
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();