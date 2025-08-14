[
  {
    "trigger_name": "audit_trail_dynamic_data",
    "table_name": "core_dynamic_data",
    "schema_name": "public",
    "trigger_definition": "CREATE TRIGGER audit_trail_dynamic_data BEFORE INSERT OR UPDATE ON public.core_dynamic_data FOR EACH ROW EXECUTE FUNCTION handle_audit_trail()"
  },
  {
    "trigger_name": "enforce_hierarchical_organization_consistency_dynamic_data",
    "table_name": "core_dynamic_data",
    "schema_name": "public",
    "trigger_definition": "CREATE TRIGGER enforce_hierarchical_organization_consistency_dynamic_data BEFORE INSERT OR UPDATE ON public.core_dynamic_data FOR EACH ROW EXECUTE FUNCTION enforce_hierarchical_organization_consistency()"
  },
  {
    "trigger_name": "update_core_dynamic_data_updated_at",
    "table_name": "core_dynamic_data",
    "schema_name": "public",
    "trigger_definition": "CREATE TRIGGER update_core_dynamic_data_updated_at BEFORE UPDATE ON public.core_dynamic_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()"
  },
  {
    "trigger_name": "validate_dynamic_data_consistency",
    "table_name": "core_dynamic_data",
    "schema_name": "public",
    "trigger_definition": "CREATE TRIGGER validate_dynamic_data_consistency BEFORE INSERT OR UPDATE ON public.core_dynamic_data FOR EACH ROW EXECUTE FUNCTION validate_dynamic_data_consistency()"
  },
  {
    "trigger_name": "audit_trail_entities",
    "table_name": "core_entities",
    "schema_name": "public",
    "trigger_definition": "CREATE TRIGGER audit_trail_entities BEFORE INSERT OR UPDATE ON public.core_entities FOR EACH ROW EXECUTE FUNCTION handle_audit_trail()"
  },
  {
    "trigger_name": "enforce_hierarchical_organization_consistency_entities",
    "table_name": "core_entities",
    "schema_name": "public",
    "trigger_definition": "CREATE TRIGGER enforce_hierarchical_organization_consistency_entities BEFORE INSERT OR UPDATE ON public.core_entities FOR EACH ROW EXECUTE FUNCTION enforce_hierarchical_organization_consistency()"
  },
  {
    "trigger_name": "update_core_entities_updated_at",
    "table_name": "core_entities",
    "schema_name": "public",
    "trigger_definition": "CREATE TRIGGER update_core_entities_updated_at BEFORE UPDATE ON public.core_entities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()"
  },
  {
    "trigger_name": "validate_entity_org_consistency",
    "table_name": "core_entities",
    "schema_name": "public",
    "trigger_definition": "CREATE TRIGGER validate_entity_org_consistency BEFORE INSERT OR UPDATE ON public.core_entities FOR EACH ROW EXECUTE FUNCTION validate_entity_organization_consistency()"
  },
  {
    "trigger_name": "validate_user_entities",
    "table_name": "core_entities",
    "schema_name": "public",
    "trigger_definition": "CREATE TRIGGER validate_user_entities BEFORE INSERT OR UPDATE ON public.core_entities FOR EACH ROW EXECUTE FUNCTION validate_user_context()"
  },
  {
    "trigger_name": "audit_trail_organizations",
    "table_name": "core_organizations",
    "schema_name": "public",
    "trigger_definition": "CREATE TRIGGER audit_trail_organizations BEFORE INSERT OR UPDATE ON public.core_organizations FOR EACH ROW EXECUTE FUNCTION handle_audit_trail()"
  },
  {
    "trigger_name": "update_core_organizations_updated_at",
    "table_name": "core_organizations",
    "schema_name": "public",
    "trigger_definition": "CREATE TRIGGER update_core_organizations_updated_at BEFORE UPDATE ON public.core_organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()"
  },
  {
    "trigger_name": "validate_client_org_hierarchy",
    "table_name": "core_organizations",
    "schema_name": "public",
    "trigger_definition": "CREATE TRIGGER validate_client_org_hierarchy BEFORE INSERT OR UPDATE ON public.core_organizations FOR EACH ROW EXECUTE FUNCTION validate_client_organization_hierarchy()"
  },
  {
    "trigger_name": "audit_trail_relationships",
    "table_name": "core_relationships",
    "schema_name": "public",
    "trigger_definition": "CREATE TRIGGER audit_trail_relationships BEFORE INSERT OR UPDATE ON public.core_relationships FOR EACH ROW EXECUTE FUNCTION handle_audit_trail()"
  },
  {
    "trigger_name": "enforce_hierarchical_organization_consistency_relationships",
    "table_name": "core_relationships",
    "schema_name": "public",
    "trigger_definition": "CREATE TRIGGER enforce_hierarchical_organization_consistency_relationships BEFORE INSERT OR UPDATE ON public.core_relationships FOR EACH ROW EXECUTE FUNCTION enforce_hierarchical_organization_consistency()"
  },
  {
    "trigger_name": "update_core_relationships_updated_at",
    "table_name": "core_relationships",
    "schema_name": "public",
    "trigger_definition": "CREATE TRIGGER update_core_relationships_updated_at BEFORE UPDATE ON public.core_relationships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()"
  },
  {
    "trigger_name": "validate_relationship_consistency",
    "table_name": "core_relationships",
    "schema_name": "public",
    "trigger_definition": "CREATE TRIGGER validate_relationship_consistency BEFORE INSERT OR UPDATE ON public.core_relationships FOR EACH ROW EXECUTE FUNCTION validate_relationship_consistency()"
  },
  {
    "trigger_name": "audit_trail_transaction_lines",
    "table_name": "universal_transaction_lines",
    "schema_name": "public",
    "trigger_definition": "CREATE TRIGGER audit_trail_transaction_lines BEFORE INSERT OR UPDATE ON public.universal_transaction_lines FOR EACH ROW EXECUTE FUNCTION handle_audit_trail()"
  },
  {
    "trigger_name": "enforce_hierarchical_organization_consistency_transaction_lines",
    "table_name": "universal_transaction_lines",
    "schema_name": "public",
    "trigger_definition": "CREATE TRIGGER enforce_hierarchical_organization_consistency_transaction_lines BEFORE INSERT OR UPDATE ON public.universal_transaction_lines FOR EACH ROW EXECUTE FUNCTION enforce_hierarchical_organization_consistency()"
  },
  {
    "trigger_name": "update_universal_transaction_lines_updated_at",
    "table_name": "universal_transaction_lines",
    "schema_name": "public",
    "trigger_definition": "CREATE TRIGGER update_universal_transaction_lines_updated_at BEFORE UPDATE ON public.universal_transaction_lines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()"
  },
  {
    "trigger_name": "audit_trail_transactions",
    "table_name": "universal_transactions",
    "schema_name": "public",
    "trigger_definition": "CREATE TRIGGER audit_trail_transactions BEFORE INSERT OR UPDATE ON public.universal_transactions FOR EACH ROW EXECUTE FUNCTION handle_audit_trail()"
  },
  {
    "trigger_name": "enforce_hierarchical_organization_consistency_transactions",
    "table_name": "universal_transactions",
    "schema_name": "public",
    "trigger_definition": "CREATE TRIGGER enforce_hierarchical_organization_consistency_transactions BEFORE INSERT OR UPDATE ON public.universal_transactions FOR EACH ROW EXECUTE FUNCTION enforce_hierarchical_organization_consistency()"
  },
  {
    "trigger_name": "update_universal_transactions_updated_at",
    "table_name": "universal_transactions",
    "schema_name": "public",
    "trigger_definition": "CREATE TRIGGER update_universal_transactions_updated_at BEFORE UPDATE ON public.universal_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()"
  },
  {
    "trigger_name": "validate_intercompany_transaction_trigger",
    "table_name": "universal_transactions",
    "schema_name": "public",
    "trigger_definition": "CREATE TRIGGER validate_intercompany_transaction_trigger BEFORE INSERT OR UPDATE ON public.universal_transactions FOR EACH ROW EXECUTE FUNCTION validate_intercompany_transaction()"
  },
  {
    "trigger_name": "validate_user_transactions",
    "table_name": "universal_transactions",
    "schema_name": "public",
    "trigger_definition": "CREATE TRIGGER validate_user_transactions BEFORE INSERT OR UPDATE ON public.universal_transactions FOR EACH ROW EXECUTE FUNCTION validate_user_context()"
  }
]