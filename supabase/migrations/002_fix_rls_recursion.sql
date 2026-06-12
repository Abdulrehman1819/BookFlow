-- Fix infinite recursion in organization_members RLS policies.
-- SECURITY DEFINER functions bypass RLS, breaking the self-reference loop.

DROP POLICY IF EXISTS "members_select" ON organization_members;
DROP POLICY IF EXISTS "members_manage_owner" ON organization_members;

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

CREATE POLICY "members_select" ON organization_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR organization_id IN (SELECT get_my_org_ids())
  );

CREATE POLICY "members_manage_owner" ON organization_members
  FOR ALL USING (
    organization_id IN (SELECT get_my_owned_org_ids())
  );
