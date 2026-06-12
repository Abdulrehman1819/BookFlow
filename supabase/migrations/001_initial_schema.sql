-- BookFlow Initial Schema
-- Run this in your Supabase SQL Editor

-- ============================================================
-- TABLES
-- ============================================================
----
CREATE TABLE IF NOT EXISTS profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name      TEXT,
  email          TEXT UNIQUE NOT NULL,
  phone          TEXT,
  avatar_url     TEXT,
  is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organizations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                TEXT UNIQUE NOT NULL,
  name                TEXT NOT NULL,
  description         TEXT,
  business_type       TEXT NOT NULL DEFAULT 'other',
  logo_url            TEXT,
  phone               TEXT,
  email               TEXT,
  website             TEXT,
  address             TEXT,
  city                TEXT,
  country             TEXT,
  timezone            TEXT NOT NULL DEFAULT 'UTC',
  currency            TEXT NOT NULL DEFAULT 'USD',
  booking_window_days INT NOT NULL DEFAULT 30,
  min_notice_hours    INT NOT NULL DEFAULT 1,
  cancellation_hours  INT NOT NULL DEFAULT 24,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('owner', 'staff', 'customer')),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  invited_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS services (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  description          TEXT,
  duration_minutes     INT NOT NULL,
  price                DECIMAL(10,2),
  currency             TEXT NOT NULL DEFAULT 'USD',
  color                TEXT NOT NULL DEFAULT '#6366f1',
  buffer_after_minutes INT NOT NULL DEFAULT 0,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id               UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name          TEXT NOT NULL,
  title                 TEXT,
  bio                   TEXT,
  avatar_url            TEXT,
  is_accepting_bookings BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_services (
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  service_id  UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (employee_id, service_id)
);

CREATE TABLE IF NOT EXISTS working_hours (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  day_of_week     SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (employee_id, day_of_week)
);

CREATE TABLE IF NOT EXISTS schedule_exceptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id     UUID REFERENCES employees(id) ON DELETE CASCADE,
  exception_date  DATE NOT NULL,
  is_day_off      BOOLEAN NOT NULL DEFAULT TRUE,
  start_time      TIME,
  end_time        TIME,
  reason          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  service_id          UUID NOT NULL REFERENCES services(id),
  employee_id         UUID NOT NULL REFERENCES employees(id),
  customer_id         UUID REFERENCES auth.users(id),
  customer_name       TEXT NOT NULL,
  customer_email      TEXT NOT NULL,
  customer_phone      TEXT,
  start_time          TIMESTAMPTZ NOT NULL,
  end_time            TIMESTAMPTZ NOT NULL,
  status              TEXT NOT NULL DEFAULT 'confirmed'
                        CHECK (status IN ('pending','confirmed','cancelled','no_show','completed')),
  notes               TEXT,
  internal_notes      TEXT,
  cancellation_reason TEXT,
  cancelled_by        TEXT,
  reminder_24h_sent   BOOLEAN NOT NULL DEFAULT FALSE,
  reminder_1h_sent    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_org_members_user
  ON organization_members(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_org_members_org
  ON organization_members(organization_id, role);

CREATE INDEX IF NOT EXISTS idx_services_org
  ON services(organization_id) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_employees_org
  ON employees(organization_id) WHERE is_accepting_bookings = TRUE;

CREATE INDEX IF NOT EXISTS idx_working_hours_employee
  ON working_hours(employee_id, day_of_week);

CREATE INDEX IF NOT EXISTS idx_exceptions_date
  ON schedule_exceptions(employee_id, exception_date);

CREATE INDEX IF NOT EXISTS idx_appointments_org_time
  ON appointments(organization_id, start_time);

CREATE INDEX IF NOT EXISTS idx_appointments_employee
  ON appointments(employee_id, start_time);

CREATE INDEX IF NOT EXISTS idx_appointments_customer
  ON appointments(customer_id);

CREATE INDEX IF NOT EXISTS idx_appointments_status
  ON appointments(organization_id, status);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile row when a user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE services             ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees            ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_services    ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_hours        ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_exceptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments         ENABLE ROW LEVEL SECURITY;

-- ── profiles ────────────────────────────────────────────────
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid() OR is_super_admin = TRUE);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- ── helper functions (SECURITY DEFINER bypasses RLS, prevents recursion) ──
CREATE OR REPLACE FUNCTION get_my_org_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT organization_id FROM organization_members
  WHERE user_id = auth.uid() AND is_active = TRUE;
$$;

CREATE OR REPLACE FUNCTION get_my_owned_org_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT organization_id FROM organization_members
  WHERE user_id = auth.uid() AND role = 'owner' AND is_active = TRUE;
$$;

-- ── organizations ────────────────────────────────────────────
-- Public read for active orgs (booking page works without login)
CREATE POLICY "orgs_select_public" ON organizations
  FOR SELECT USING (is_active = TRUE);

-- Members can also read their own org even if inactive
CREATE POLICY "orgs_select_member" ON organizations
  FOR SELECT USING (id IN (SELECT get_my_org_ids()));

-- Any authenticated user can create an org (onboarding)
CREATE POLICY "orgs_insert_auth" ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only owners can update
CREATE POLICY "orgs_update_owner" ON organizations
  FOR UPDATE USING (id IN (SELECT get_my_owned_org_ids()));

-- ── organization_members ────────────────────────────────────
-- Users see their own rows; owners/staff see all in their org
-- Uses SECURITY DEFINER helper to avoid self-referencing recursion
CREATE POLICY "members_select" ON organization_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR organization_id IN (SELECT get_my_org_ids())
  );

-- Any authenticated user can insert their own membership (onboarding)
CREATE POLICY "members_insert_own" ON organization_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Owners can update/delete memberships in their org
CREATE POLICY "members_manage_owner" ON organization_members
  FOR ALL USING (
    organization_id IN (SELECT get_my_owned_org_ids())
  );

-- ── services ─────────────────────────────────────────────────
-- Public read for active services (booking page)
CREATE POLICY "services_select_public" ON services
  FOR SELECT USING (is_active = TRUE);

-- Members can read all services in their org
CREATE POLICY "services_select_member" ON services
  FOR SELECT USING (organization_id IN (SELECT get_my_org_ids()));

-- Owners can manage services
CREATE POLICY "services_manage_owner" ON services
  FOR ALL USING (organization_id IN (SELECT get_my_owned_org_ids()));

-- ── employees ────────────────────────────────────────────────
-- Public read for accepting employees (booking page)
CREATE POLICY "employees_select_public" ON employees
  FOR SELECT USING (is_accepting_bookings = TRUE);

-- Members can read all employees in their org
CREATE POLICY "employees_select_member" ON employees
  FOR SELECT USING (organization_id IN (SELECT get_my_org_ids()));

-- Owners can manage employees
CREATE POLICY "employees_manage_owner" ON employees
  FOR ALL USING (organization_id IN (SELECT get_my_owned_org_ids()));

-- Staff can update their own employee record
CREATE POLICY "employees_update_own" ON employees
  FOR UPDATE USING (user_id = auth.uid());

-- ── employee_services ────────────────────────────────────────
CREATE POLICY "employee_services_select" ON employee_services
  FOR SELECT USING (TRUE);

CREATE POLICY "employee_services_manage_owner" ON employee_services
  FOR ALL USING (
    employee_id IN (
      SELECT e.id FROM employees e
      JOIN organization_members om ON om.organization_id = e.organization_id
      WHERE om.user_id = auth.uid() AND om.role = 'owner' AND om.is_active = TRUE
    )
  );

-- ── working_hours ────────────────────────────────────────────
-- Public read needed for availability calculation
CREATE POLICY "working_hours_select" ON working_hours
  FOR SELECT USING (TRUE);

CREATE POLICY "working_hours_manage_owner" ON working_hours
  FOR ALL USING (organization_id IN (SELECT get_my_owned_org_ids()));

CREATE POLICY "working_hours_manage_own" ON working_hours
  FOR ALL USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- ── schedule_exceptions ──────────────────────────────────────
CREATE POLICY "exceptions_select" ON schedule_exceptions
  FOR SELECT USING (TRUE);

CREATE POLICY "exceptions_manage_owner" ON schedule_exceptions
  FOR ALL USING (organization_id IN (SELECT get_my_owned_org_ids()));

CREATE POLICY "exceptions_manage_own" ON schedule_exceptions
  FOR ALL USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- ── appointments ─────────────────────────────────────────────
-- Staff and owners see all org appointments
CREATE POLICY "appointments_select_staff" ON appointments
  FOR SELECT USING (organization_id IN (SELECT get_my_org_ids()));

-- Customers can see their own appointments
CREATE POLICY "appointments_select_customer" ON appointments
  FOR SELECT USING (customer_id = auth.uid());

-- Anyone can book (guest checkout — no login required)
CREATE POLICY "appointments_insert_public" ON appointments
  FOR INSERT WITH CHECK (TRUE);

-- Staff/owners can update appointments in their org
CREATE POLICY "appointments_update_staff" ON appointments
  FOR UPDATE USING (organization_id IN (SELECT get_my_org_ids()));

-- Customers can cancel their own appointments
CREATE POLICY "appointments_cancel_customer" ON appointments
  FOR UPDATE USING (customer_id = auth.uid())
  WITH CHECK (status = 'cancelled');
