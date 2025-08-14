[
  {
    "table_name": "core_clients",
    "index_name": "core_clients_client_code_key",
    "index_definition": "CREATE UNIQUE INDEX core_clients_client_code_key ON public.core_clients USING btree (client_code)"
  },
  {
    "table_name": "core_clients",
    "index_name": "core_clients_client_name_key",
    "index_definition": "CREATE UNIQUE INDEX core_clients_client_name_key ON public.core_clients USING btree (client_name)"
  },
  {
    "table_name": "core_clients",
    "index_name": "idx_core_clients_code",
    "index_definition": "CREATE INDEX idx_core_clients_code ON public.core_clients USING btree (client_code)"
  },
  {
    "table_name": "core_clients",
    "index_name": "idx_core_clients_country",
    "index_definition": "CREATE INDEX idx_core_clients_country ON public.core_clients USING btree (headquarters_country)"
  },
  {
    "table_name": "core_clients",
    "index_name": "idx_core_clients_parent",
    "index_definition": "CREATE INDEX idx_core_clients_parent ON public.core_clients USING btree (parent_client_id)"
  },
  {
    "table_name": "core_clients",
    "index_name": "idx_core_clients_status",
    "index_definition": "CREATE INDEX idx_core_clients_status ON public.core_clients USING btree (status)"
  },
  {
    "table_name": "core_clients",
    "index_name": "idx_core_clients_ticker",
    "index_definition": "CREATE INDEX idx_core_clients_ticker ON public.core_clients USING btree (ticker_symbol) WHERE (ticker_symbol IS NOT NULL)"
  },
  {
    "table_name": "core_clients",
    "index_name": "idx_core_clients_type",
    "index_definition": "CREATE INDEX idx_core_clients_type ON public.core_clients USING btree (client_type)"
  },
  {
    "table_name": "core_dynamic_data",
    "index_name": "core_dynamic_data_organization_id_entity_id_field_name_key",
    "index_definition": "CREATE UNIQUE INDEX core_dynamic_data_organization_id_entity_id_field_name_key ON public.core_dynamic_data USING btree (organization_id, entity_id, field_name)"
  },
  {
    "table_name": "core_dynamic_data",
    "index_name": "idx_core_dynamic_data_date",
    "index_definition": "CREATE INDEX idx_core_dynamic_data_date ON public.core_dynamic_data USING btree (field_value_date) WHERE (field_value_date IS NOT NULL)"
  },
  {
    "table_name": "core_dynamic_data",
    "index_name": "idx_core_dynamic_data_entity",
    "index_definition": "CREATE INDEX idx_core_dynamic_data_entity ON public.core_dynamic_data USING btree (entity_id)"
  },
  {
    "table_name": "core_dynamic_data",
    "index_name": "idx_core_dynamic_data_field",
    "index_definition": "CREATE INDEX idx_core_dynamic_data_field ON public.core_dynamic_data USING btree (field_name)"
  },
  {
    "table_name": "core_dynamic_data",
    "index_name": "idx_core_dynamic_data_json",
    "index_definition": "CREATE INDEX idx_core_dynamic_data_json ON public.core_dynamic_data USING gin (field_value_json) WHERE (field_value_json IS NOT NULL)"
  },
  {
    "table_name": "core_dynamic_data",
    "index_name": "idx_core_dynamic_data_number",
    "index_definition": "CREATE INDEX idx_core_dynamic_data_number ON public.core_dynamic_data USING btree (field_value_number) WHERE (field_value_number IS NOT NULL)"
  },
  {
    "table_name": "core_dynamic_data",
    "index_name": "idx_core_dynamic_data_org",
    "index_definition": "CREATE INDEX idx_core_dynamic_data_org ON public.core_dynamic_data USING btree (organization_id)"
  },
  {
    "table_name": "core_dynamic_data",
    "index_name": "idx_core_dynamic_data_type",
    "index_definition": "CREATE INDEX idx_core_dynamic_data_type ON public.core_dynamic_data USING btree (field_type)"
  },
  {
    "table_name": "core_entities",
    "index_name": "idx_core_entities_code",
    "index_definition": "CREATE INDEX idx_core_entities_code ON public.core_entities USING btree (entity_code)"
  },
  {
    "table_name": "core_entities",
    "index_name": "idx_core_entities_name_trgm",
    "index_definition": "CREATE INDEX idx_core_entities_name_trgm ON public.core_entities USING gin (entity_name gin_trgm_ops)"
  },
  {
    "table_name": "core_entities",
    "index_name": "idx_core_entities_org",
    "index_definition": "CREATE INDEX idx_core_entities_org ON public.core_entities USING btree (organization_id)"
  },
  {
    "table_name": "core_entities",
    "index_name": "idx_core_entities_parent",
    "index_definition": "CREATE INDEX idx_core_entities_parent ON public.core_entities USING btree (parent_entity_id)"
  },
  {
    "table_name": "core_entities",
    "index_name": "idx_core_entities_status",
    "index_definition": "CREATE INDEX idx_core_entities_status ON public.core_entities USING btree (status)"
  },
  {
    "table_name": "core_entities",
    "index_name": "idx_core_entities_type",
    "index_definition": "CREATE INDEX idx_core_entities_type ON public.core_entities USING btree (entity_type)"
  },
  {
    "table_name": "core_entities",
    "index_name": "idx_entities_created_by_date",
    "index_definition": "CREATE INDEX idx_entities_created_by_date ON public.core_entities USING btree (organization_id, created_by, created_at)"
  },
  {
    "table_name": "core_entities",
    "index_name": "idx_entities_updated_by_date",
    "index_definition": "CREATE INDEX idx_entities_updated_by_date ON public.core_entities USING btree (organization_id, updated_by, updated_at)"
  },
  {
    "table_name": "core_organizations",
    "index_name": "core_organizations_organization_code_key",
    "index_definition": "CREATE UNIQUE INDEX core_organizations_organization_code_key ON public.core_organizations USING btree (organization_code)"
  },
  {
    "table_name": "core_organizations",
    "index_name": "idx_core_organizations_client",
    "index_definition": "CREATE INDEX idx_core_organizations_client ON public.core_organizations USING btree (client_id)"
  },
  {
    "table_name": "core_organizations",
    "index_name": "idx_core_organizations_code",
    "index_definition": "CREATE INDEX idx_core_organizations_code ON public.core_organizations USING btree (organization_code)"
  },
  {
    "table_name": "core_organizations",
    "index_name": "idx_core_organizations_country",
    "index_definition": "CREATE INDEX idx_core_organizations_country ON public.core_organizations USING btree (country_code)"
  },
  {
    "table_name": "core_organizations",
    "index_name": "idx_core_organizations_industry",
    "index_definition": "CREATE INDEX idx_core_organizations_industry ON public.core_organizations USING btree (industry)"
  },
  {
    "table_name": "core_organizations",
    "index_name": "idx_core_organizations_region",
    "index_definition": "CREATE INDEX idx_core_organizations_region ON public.core_organizations USING btree (region)"
  },
  {
    "table_name": "core_organizations",
    "index_name": "idx_core_organizations_status",
    "index_definition": "CREATE INDEX idx_core_organizations_status ON public.core_organizations USING btree (status)"
  },
  {
    "table_name": "core_organizations",
    "index_name": "idx_core_organizations_type",
    "index_definition": "CREATE INDEX idx_core_organizations_type ON public.core_organizations USING btree (organization_type)"
  },
  {
    "table_name": "core_relationships",
    "index_name": "idx_core_relationships_active",
    "index_definition": "CREATE INDEX idx_core_relationships_active ON public.core_relationships USING btree (is_active) WHERE (is_active = true)"
  },
  {
    "table_name": "core_relationships",
    "index_name": "idx_core_relationships_org",
    "index_definition": "CREATE INDEX idx_core_relationships_org ON public.core_relationships USING btree (organization_id)"
  },
  {
    "table_name": "core_relationships",
    "index_name": "idx_core_relationships_source",
    "index_definition": "CREATE INDEX idx_core_relationships_source ON public.core_relationships USING btree (source_entity_id)"
  },
  {
    "table_name": "core_relationships",
    "index_name": "idx_core_relationships_target",
    "index_definition": "CREATE INDEX idx_core_relationships_target ON public.core_relationships USING btree (target_entity_id)"
  },
  {
    "table_name": "core_relationships",
    "index_name": "idx_core_relationships_type",
    "index_definition": "CREATE INDEX idx_core_relationships_type ON public.core_relationships USING btree (relationship_type)"
  },
  {
    "table_name": "core_relationships",
    "index_name": "idx_core_relationships_workflow",
    "index_definition": "CREATE INDEX idx_core_relationships_workflow ON public.core_relationships USING btree (workflow_state) WHERE (workflow_state IS NOT NULL)"
  },
  {
    "table_name": "gl_chart_of_accounts",
    "index_name": "gl_chart_of_accounts_organization_id_account_code_key",
    "index_definition": "CREATE UNIQUE INDEX gl_chart_of_accounts_organization_id_account_code_key ON public.gl_chart_of_accounts USING btree (organization_id, account_code)"
  },
  {
    "table_name": "gl_chart_of_accounts",
    "index_name": "idx_gl_chart_code",
    "index_definition": "CREATE INDEX idx_gl_chart_code ON public.gl_chart_of_accounts USING btree (account_code)"
  },
  {
    "table_name": "gl_chart_of_accounts",
    "index_name": "idx_gl_chart_org",
    "index_definition": "CREATE INDEX idx_gl_chart_org ON public.gl_chart_of_accounts USING btree (organization_id)"
  },
  {
    "table_name": "gl_chart_of_accounts",
    "index_name": "idx_gl_chart_type",
    "index_definition": "CREATE INDEX idx_gl_chart_type ON public.gl_chart_of_accounts USING btree (account_type)"
  },
  {
    "table_name": "universal_transaction_lines",
    "index_name": "idx_universal_transaction_lines_amount",
    "index_definition": "CREATE INDEX idx_universal_transaction_lines_amount ON public.universal_transaction_lines USING btree (line_amount)"
  },
  {
    "table_name": "universal_transaction_lines",
    "index_name": "idx_universal_transaction_lines_delivery",
    "index_definition": "CREATE INDEX idx_universal_transaction_lines_delivery ON public.universal_transaction_lines USING btree (delivery_date) WHERE (delivery_date IS NOT NULL)"
  },
  {
    "table_name": "universal_transaction_lines",
    "index_name": "idx_universal_transaction_lines_entity",
    "index_definition": "CREATE INDEX idx_universal_transaction_lines_entity ON public.universal_transaction_lines USING btree (entity_id)"
  },
  {
    "table_name": "universal_transaction_lines",
    "index_name": "idx_universal_transaction_lines_gl",
    "index_definition": "CREATE INDEX idx_universal_transaction_lines_gl ON public.universal_transaction_lines USING btree (gl_account_code) WHERE (gl_account_code IS NOT NULL)"
  },
  {
    "table_name": "universal_transaction_lines",
    "index_name": "idx_universal_transaction_lines_order",
    "index_definition": "CREATE INDEX idx_universal_transaction_lines_order ON public.universal_transaction_lines USING btree (transaction_id, line_order)"
  },
  {
    "table_name": "universal_transaction_lines",
    "index_name": "idx_universal_transaction_lines_org",
    "index_definition": "CREATE INDEX idx_universal_transaction_lines_org ON public.universal_transaction_lines USING btree (organization_id)"
  },
  {
    "table_name": "universal_transaction_lines",
    "index_name": "idx_universal_transaction_lines_transaction",
    "index_definition": "CREATE INDEX idx_universal_transaction_lines_transaction ON public.universal_transaction_lines USING btree (transaction_id)"
  },
  {
    "table_name": "universal_transactions",
    "index_name": "idx_transactions_created_by_date",
    "index_definition": "CREATE INDEX idx_transactions_created_by_date ON public.universal_transactions USING btree (organization_id, created_by, created_at)"
  },
  {
    "table_name": "universal_transactions",
    "index_name": "idx_transactions_updated_by_date",
    "index_definition": "CREATE INDEX idx_transactions_updated_by_date ON public.universal_transactions USING btree (organization_id, updated_by, updated_at)"
  },
  {
    "table_name": "universal_transactions",
    "index_name": "idx_universal_transactions_amount",
    "index_definition": "CREATE INDEX idx_universal_transactions_amount ON public.universal_transactions USING btree (total_amount)"
  },
  {
    "table_name": "universal_transactions",
    "index_name": "idx_universal_transactions_date",
    "index_definition": "CREATE INDEX idx_universal_transactions_date ON public.universal_transactions USING btree (transaction_date)"
  },
  {
    "table_name": "universal_transactions",
    "index_name": "idx_universal_transactions_due_date",
    "index_definition": "CREATE INDEX idx_universal_transactions_due_date ON public.universal_transactions USING btree (due_date) WHERE (due_date IS NOT NULL)"
  },
  {
    "table_name": "universal_transactions",
    "index_name": "idx_universal_transactions_ic_source",
    "index_definition": "CREATE INDEX idx_universal_transactions_ic_source ON public.universal_transactions USING btree (intercompany_source_org) WHERE (intercompany_source_org IS NOT NULL)"
  },
  {
    "table_name": "universal_transactions",
    "index_name": "idx_universal_transactions_ic_target",
    "index_definition": "CREATE INDEX idx_universal_transactions_ic_target ON public.universal_transactions USING btree (intercompany_target_org) WHERE (intercompany_target_org IS NOT NULL)"
  },
  {
    "table_name": "universal_transactions",
    "index_name": "idx_universal_transactions_intercompany",
    "index_definition": "CREATE INDEX idx_universal_transactions_intercompany ON public.universal_transactions USING btree (is_intercompany) WHERE (is_intercompany = true)"
  },
  {
    "table_name": "universal_transactions",
    "index_name": "idx_universal_transactions_number",
    "index_definition": "CREATE INDEX idx_universal_transactions_number ON public.universal_transactions USING btree (transaction_number)"
  },
  {
    "table_name": "universal_transactions",
    "index_name": "idx_universal_transactions_org",
    "index_definition": "CREATE INDEX idx_universal_transactions_org ON public.universal_transactions USING btree (organization_id)"
  },
  {
    "table_name": "universal_transactions",
    "index_name": "idx_universal_transactions_source",
    "index_definition": "CREATE INDEX idx_universal_transactions_source ON public.universal_transactions USING btree (source_entity_id)"
  },
  {
    "table_name": "universal_transactions",
    "index_name": "idx_universal_transactions_status",
    "index_definition": "CREATE INDEX idx_universal_transactions_status ON public.universal_transactions USING btree (status)"
  },
  {
    "table_name": "universal_transactions",
    "index_name": "idx_universal_transactions_target",
    "index_definition": "CREATE INDEX idx_universal_transactions_target ON public.universal_transactions USING btree (target_entity_id)"
  },
  {
    "table_name": "universal_transactions",
    "index_name": "idx_universal_transactions_type",
    "index_definition": "CREATE INDEX idx_universal_transactions_type ON public.universal_transactions USING btree (transaction_type)"
  },
  {
    "table_name": "universal_transactions",
    "index_name": "universal_transactions_organization_id_transaction_number_key",
    "index_definition": "CREATE UNIQUE INDEX universal_transactions_organization_id_transaction_number_key ON public.universal_transactions USING btree (organization_id, transaction_number)"
  }
]