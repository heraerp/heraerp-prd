[
  {
    "table_name": "core_clients",
    "policy_name": "hera_clients_insert",
    "policy_definition": null
  },
  {
    "table_name": "core_clients",
    "policy_name": "hera_clients_select",
    "policy_definition": "CREATE POLICY hera_clients_select ON core_clients FOR ALL USING (((id = ((auth.jwt() ->> 'client_id'::text))::uuid) OR (id IN ( SELECT core_organizations.client_id\n   FROM core_organizations\n  WHERE (core_organizations.id = ((auth.jwt() ->> 'organization_id'::text))::uuid))) OR ((auth.jwt() ->> 'role'::text) = 'super_admin'::text)));"
  },
  {
    "table_name": "core_clients",
    "policy_name": "hera_clients_update",
    "policy_definition": "CREATE POLICY hera_clients_update ON core_clients FOR ALL USING (((id = ((auth.jwt() ->> 'client_id'::text))::uuid) AND ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['client_admin'::text, 'super_admin'::text]))));"
  },
  {
    "table_name": "core_entities",
    "policy_name": "Users can view their organization entities",
    "policy_definition": "CREATE POLICY Users can view their organization entities ON core_entities FOR ALL USING ((organization_id IN ( SELECT core_organizations.id\n   FROM core_organizations\n  WHERE ((auth.uid())::text = (core_organizations.created_by)::text))));"
  },
  {
    "table_name": "core_organizations",
    "policy_name": "Users can view their organization",
    "policy_definition": "CREATE POLICY Users can view their organization ON core_organizations FOR ALL USING (((auth.uid())::text IN ( SELECT (core_organizations_1.created_by)::text AS created_by\n   FROM core_organizations core_organizations_1\n  WHERE (core_organizations_1.id = core_organizations_1.id))));"
  },
  {
    "table_name": "core_organizations",
    "policy_name": "hera_orgs_insert",
    "policy_definition": null
  },
  {
    "table_name": "core_organizations",
    "policy_name": "hera_orgs_select",
    "policy_definition": "CREATE POLICY hera_orgs_select ON core_organizations FOR ALL USING (((id = ((auth.jwt() ->> 'organization_id'::text))::uuid) OR ((client_id = ((auth.jwt() ->> 'client_id'::text))::uuid) AND ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['client_admin'::text, 'super_admin'::text]))) OR ((auth.jwt() ->> 'role'::text) = 'super_admin'::text)));"
  },
  {
    "table_name": "core_organizations",
    "policy_name": "hera_orgs_update",
    "policy_definition": "CREATE POLICY hera_orgs_update ON core_organizations FOR ALL USING (((id = ((auth.jwt() ->> 'organization_id'::text))::uuid) OR ((client_id = ((auth.jwt() ->> 'client_id'::text))::uuid) AND ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['client_admin'::text, 'super_admin'::text])))));"
  }
]