-- HERA Integration Runtime - RPC Functions
-- Smart Code: HERA.PLATFORM.INTEGRATION.RUNTIME.SQL.v1
--
-- Creates all RPC functions needed for the integration system

-- ============================================================================
-- FUNCTION: hera_integration_event_in_v1
-- Purpose: Process inbound integration events from external systems
-- ============================================================================
CREATE OR REPLACE FUNCTION hera_integration_event_in_v1(
  p_actor_user_id UUID,
  p_organization_id UUID,
  p_event_source TEXT,
  p_event_type TEXT,
  p_event_data JSONB DEFAULT '{}',
  p_connector_code TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL,
  p_smart_code TEXT DEFAULT NULL,
  p_options JSONB DEFAULT '{}'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
  v_transaction_id UUID;
  v_computed_smart_code TEXT;
  v_connector_id UUID;
  v_result JSONB;
BEGIN
  -- Input validation
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'actor_user_id is required for audit compliance';
  END IF;
  
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION 'organization_id is required for tenant isolation';
  END IF;
  
  IF p_event_source IS NULL OR p_event_type IS NULL THEN
    RAISE EXCEPTION 'event_source and event_type are required';
  END IF;
  
  -- Compute smart code if not provided
  v_computed_smart_code := COALESCE(
    p_smart_code, 
    format('HERA.INTEGRATION.EVENT.%s.%s.v1', 
           UPPER(REPLACE(p_event_source, '-', '_')), 
           UPPER(REPLACE(p_event_type, '-', '_')))
  );
  
  -- Validate smart code pattern
  IF v_computed_smart_code !~ '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$' THEN
    RAISE EXCEPTION 'Invalid smart code pattern: %', v_computed_smart_code;
  END IF;
  
  -- Check for duplicate based on idempotency key
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_event_id
    FROM core_entities e
    JOIN core_dynamic_data d ON d.entity_id = e.id
    WHERE e.organization_id = p_organization_id
      AND e.entity_type = 'INTEGRATION_EVENT'
      AND d.field_name = 'idempotency_key'
      AND d.field_value_text = p_idempotency_key;
      
    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', true,
        'message', 'Event already processed (idempotent)',
        'event_id', v_event_id,
        'duplicate', true
      );
    END IF;
  END IF;
  
  -- Find connector if connector_code provided
  IF p_connector_code IS NOT NULL THEN
    SELECT id INTO v_connector_id
    FROM core_entities
    WHERE organization_id = p_organization_id
      AND entity_type IN ('INTEGRATION_CONNECTOR_DEF', 'INTEGRATION_CONNECTOR_INSTALL')
      AND entity_code = p_connector_code;
  END IF;
  
  -- Create integration event entity
  INSERT INTO core_entities (
    id,
    organization_id,
    entity_type,
    entity_code,
    entity_name,
    smart_code,
    created_by,
    updated_by,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    p_organization_id,
    'INTEGRATION_EVENT',
    COALESCE(p_idempotency_key, gen_random_uuid()::text),
    format('%s %s Event', p_event_source, p_event_type),
    v_computed_smart_code,
    p_actor_user_id,
    p_actor_user_id,
    NOW(),
    NOW()
  ) RETURNING id INTO v_event_id;
  
  -- Store event data in dynamic fields
  INSERT INTO core_dynamic_data (
    entity_id,
    organization_id,
    field_name,
    field_type,
    field_value_text,
    field_value_json,
    smart_code,
    created_by,
    updated_by
  ) VALUES
    (v_event_id, p_organization_id, 'event_source', 'text', p_event_source, NULL, v_computed_smart_code || '.SOURCE', p_actor_user_id, p_actor_user_id),
    (v_event_id, p_organization_id, 'event_type', 'text', p_event_type, NULL, v_computed_smart_code || '.TYPE', p_actor_user_id, p_actor_user_id),
    (v_event_id, p_organization_id, 'event_data', 'json', NULL, p_event_data, v_computed_smart_code || '.DATA', p_actor_user_id, p_actor_user_id),
    (v_event_id, p_organization_id, 'processed_at', 'timestamp', NOW()::text, NULL, v_computed_smart_code || '.PROCESSED', p_actor_user_id, p_actor_user_id);
    
  -- Store idempotency key if provided
  IF p_idempotency_key IS NOT NULL THEN
    INSERT INTO core_dynamic_data (
      entity_id,
      organization_id,
      field_name,
      field_type,
      field_value_text,
      smart_code,
      created_by,
      updated_by
    ) VALUES (
      v_event_id,
      p_organization_id,
      'idempotency_key',
      'text',
      p_idempotency_key,
      v_computed_smart_code || '.IDEMPOTENCY',
      p_actor_user_id,
      p_actor_user_id
    );
  END IF;
  
  -- Create relationship to connector if found
  IF v_connector_id IS NOT NULL THEN
    INSERT INTO core_relationships (
      organization_id,
      from_entity_id,
      to_entity_id,
      relationship_type,
      smart_code,
      created_by,
      updated_by
    ) VALUES (
      p_organization_id,
      v_event_id,
      v_connector_id,
      'PROCESSED_BY',
      v_computed_smart_code || '.CONNECTOR_REL',
      p_actor_user_id,
      p_actor_user_id
    );
  END IF;
  
  -- If configured, convert to universal transaction
  IF (p_options ->> 'create_transaction')::boolean = true THEN
    INSERT INTO universal_transactions (
      id,
      organization_id,
      transaction_type,
      transaction_code,
      smart_code,
      source_entity_id,
      total_amount,
      transaction_status,
      transaction_date,
      created_by,
      updated_by
    ) VALUES (
      gen_random_uuid(),
      p_organization_id,
      'integration_event',
      'INT-' || EXTRACT(epoch FROM NOW())::text,
      v_computed_smart_code || '.TXN',
      v_event_id,
      COALESCE((p_event_data ->> 'amount')::numeric, 0),
      'processed',
      NOW(),
      p_actor_user_id,
      p_actor_user_id
    ) RETURNING id INTO v_transaction_id;
  END IF;
  
  -- Build response
  v_result := jsonb_build_object(
    'success', true,
    'message', 'Integration event processed successfully',
    'event_id', v_event_id,
    'smart_code', v_computed_smart_code,
    'connector_id', v_connector_id,
    'transaction_id', v_transaction_id,
    'duplicate', false
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and re-raise with context
    RAISE EXCEPTION 'Integration event processing failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- ============================================================================
-- FUNCTION: hera_integration_connector_v1  
-- Purpose: Manage integration connector definitions and installations
-- ============================================================================
CREATE OR REPLACE FUNCTION hera_integration_connector_v1(
  p_actor_user_id UUID,
  p_organization_id UUID,
  p_operation TEXT DEFAULT 'LIST',
  p_connector_type TEXT DEFAULT NULL,
  p_connector_code TEXT DEFAULT NULL,
  p_connector_config JSONB DEFAULT '{}',
  p_installation_config JSONB DEFAULT '{}',
  p_options JSONB DEFAULT '{}'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_connector_id UUID;
  v_install_id UUID;
  v_smart_code TEXT;
  v_result JSONB;
  v_connectors JSONB;
BEGIN
  -- Input validation
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'actor_user_id is required for audit compliance';
  END IF;
  
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION 'organization_id is required for tenant isolation';
  END IF;
  
  -- Handle different operations
  IF UPPER(p_operation) = 'LIST' THEN
    -- List available connector definitions or installations
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', e.id,
        'code', e.entity_code,
        'name', e.entity_name,
        'type', e.entity_type,
        'smart_code', e.smart_code,
        'config', COALESCE(
          (SELECT d.field_value_json 
           FROM core_dynamic_data d 
           WHERE d.entity_id = e.id AND d.field_name = 'connector_config'),
          '{}'::jsonb
        ),
        'created_at', e.created_at
      )
    ) INTO v_connectors
    FROM core_entities e
    WHERE e.organization_id = p_organization_id
      AND e.entity_type IN ('INTEGRATION_CONNECTOR_DEF', 'INTEGRATION_CONNECTOR_INSTALL')
      AND (p_connector_type IS NULL OR e.entity_type = p_connector_type);
    
    RETURN jsonb_build_object(
      'success', true,
      'connectors', COALESCE(v_connectors, '[]'::jsonb)
    );
    
  ELSIF UPPER(p_operation) = 'CREATE_DEFINITION' THEN
    -- Create connector definition (platform org only)
    IF p_connector_code IS NULL THEN
      RAISE EXCEPTION 'connector_code is required for CREATE_DEFINITION';
    END IF;
    
    v_smart_code := format('HERA.PLATFORM.INTEGRATION.CONNECTOR_DEF.%s.v1', 
                          UPPER(REPLACE(p_connector_code, '-', '_')));
    
    -- Create connector definition entity
    INSERT INTO core_entities (
      id,
      organization_id,
      entity_type,
      entity_code,
      entity_name,
      smart_code,
      created_by,
      updated_by
    ) VALUES (
      gen_random_uuid(),
      p_organization_id,
      'INTEGRATION_CONNECTOR_DEF',
      p_connector_code,
      COALESCE(p_connector_config ->> 'display_name', p_connector_code),
      v_smart_code,
      p_actor_user_id,
      p_actor_user_id
    ) RETURNING id INTO v_connector_id;
    
    -- Store connector configuration
    INSERT INTO core_dynamic_data (
      entity_id,
      organization_id,
      field_name,
      field_type,
      field_value_json,
      smart_code,
      created_by,
      updated_by
    ) VALUES (
      v_connector_id,
      p_organization_id,
      'connector_config',
      'json',
      p_connector_config,
      v_smart_code || '.CONFIG',
      p_actor_user_id,
      p_actor_user_id
    );
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Connector definition created successfully',
      'connector_id', v_connector_id,
      'smart_code', v_smart_code
    );
    
  ELSIF UPPER(p_operation) = 'INSTALL' THEN
    -- Install connector for tenant organization
    IF p_connector_code IS NULL THEN
      RAISE EXCEPTION 'connector_code is required for INSTALL';
    END IF;
    
    v_smart_code := format('HERA.PLATFORM.INTEGRATION.CONNECTOR_INSTALL.%s.v1', 
                          UPPER(REPLACE(p_connector_code, '-', '_')));
    
    -- Create connector installation
    INSERT INTO core_entities (
      id,
      organization_id,
      entity_type,
      entity_code,
      entity_name,
      smart_code,
      created_by,
      updated_by
    ) VALUES (
      gen_random_uuid(),
      p_organization_id,
      'INTEGRATION_CONNECTOR_INSTALL',
      p_connector_code,
      format('%s Installation', p_connector_code),
      v_smart_code,
      p_actor_user_id,
      p_actor_user_id
    ) RETURNING id INTO v_install_id;
    
    -- Store installation configuration
    INSERT INTO core_dynamic_data (
      entity_id,
      organization_id,
      field_name,
      field_type,
      field_value_json,
      field_value_text,
      smart_code,
      created_by,
      updated_by
    ) VALUES 
      (v_install_id, p_organization_id, 'installation_config', 'json', p_installation_config, NULL, v_smart_code || '.CONFIG', p_actor_user_id, p_actor_user_id),
      (v_install_id, p_organization_id, 'status', 'text', NULL, 'active', v_smart_code || '.STATUS', p_actor_user_id, p_actor_user_id),
      (v_install_id, p_organization_id, 'installed_at', 'timestamp', NULL, NOW()::text, v_smart_code || '.INSTALLED', p_actor_user_id, p_actor_user_id);
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Connector installed successfully',
      'installation_id', v_install_id,
      'smart_code', v_smart_code
    );
    
  ELSIF UPPER(p_operation) = 'UNINSTALL' THEN
    -- Uninstall connector (mark as inactive)
    UPDATE core_dynamic_data
    SET field_value_text = 'inactive',
        updated_by = p_actor_user_id,
        updated_at = NOW()
    WHERE entity_id IN (
      SELECT e.id
      FROM core_entities e
      WHERE e.organization_id = p_organization_id
        AND e.entity_type = 'INTEGRATION_CONNECTOR_INSTALL'
        AND e.entity_code = p_connector_code
    ) AND field_name = 'status';
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Connector uninstalled successfully'
    );
    
  ELSE
    RAISE EXCEPTION 'Unknown operation: %', p_operation;
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Integration connector operation failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- ============================================================================
-- OUTBOX WORKER SUPPORT FUNCTIONS
-- ============================================================================

-- Function to get pending outbox events
CREATE OR REPLACE FUNCTION hera_outbox_get_pending_v1(
  p_limit INTEGER DEFAULT 100
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_events JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', e.id,
      'organization_id', e.organization_id,
      'topic', d1.field_value_text,
      'smart_code', e.smart_code,
      'payload', d2.field_value_json,
      'attempts', COALESCE((d3.field_value_text)::integer, 0),
      'max_attempts', COALESCE((d4.field_value_text)::integer, 5),
      'next_retry_at', COALESCE(d5.field_value_text, e.created_at::text),
      'status', COALESCE(d6.field_value_text, 'pending'),
      'created_at', e.created_at,
      'updated_at', e.updated_at
    )
  ) INTO v_events
  FROM core_entities e
  JOIN core_dynamic_data d1 ON d1.entity_id = e.id AND d1.field_name = 'topic'
  LEFT JOIN core_dynamic_data d2 ON d2.entity_id = e.id AND d2.field_name = 'payload'
  LEFT JOIN core_dynamic_data d3 ON d3.entity_id = e.id AND d3.field_name = 'attempts'
  LEFT JOIN core_dynamic_data d4 ON d4.entity_id = e.id AND d4.field_name = 'max_attempts'
  LEFT JOIN core_dynamic_data d5 ON d5.entity_id = e.id AND d5.field_name = 'next_retry_at'
  LEFT JOIN core_dynamic_data d6 ON d6.entity_id = e.id AND d6.field_name = 'status'
  WHERE e.entity_type = 'OUTBOX_EVENT'
    AND COALESCE(d6.field_value_text, 'pending') = 'pending'
    AND COALESCE(d5.field_value_text::timestamp, e.created_at) <= NOW()
  ORDER BY e.created_at ASC
  LIMIT p_limit;
  
  RETURN COALESCE(v_events, '[]'::jsonb);
END;
$$;

-- Function to update outbox event status
CREATE OR REPLACE FUNCTION hera_outbox_update_status_v1(
  p_event_id UUID,
  p_status TEXT,
  p_attempts INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update status
  INSERT INTO core_dynamic_data (entity_id, organization_id, field_name, field_type, field_value_text, smart_code, created_by, updated_by)
  SELECT e.id, e.organization_id, 'status', 'text', p_status, e.smart_code || '.STATUS', e.created_by, e.updated_by
  FROM core_entities e WHERE e.id = p_event_id
;
    
  -- Update attempts
  INSERT INTO core_dynamic_data (entity_id, organization_id, field_name, field_type, field_value_text, smart_code, created_by, updated_by)
  SELECT e.id, e.organization_id, 'attempts', 'text', p_attempts::text, e.smart_code || '.ATTEMPTS', e.created_by, e.updated_by
  FROM core_entities e WHERE e.id = p_event_id
;
    
  RETURN TRUE;
END;
$$;

-- Function to schedule retry
CREATE OR REPLACE FUNCTION hera_outbox_schedule_retry_v1(
  p_event_id UUID,
  p_attempts INTEGER,
  p_next_retry_at TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update attempts
  INSERT INTO core_dynamic_data (entity_id, organization_id, field_name, field_type, field_value_text, smart_code, created_by, updated_by)
  SELECT e.id, e.organization_id, 'attempts', 'text', p_attempts::text, e.smart_code || '.ATTEMPTS', e.created_by, e.updated_by
  FROM core_entities e WHERE e.id = p_event_id
;
    
  -- Update next retry time
  INSERT INTO core_dynamic_data (entity_id, organization_id, field_name, field_type, field_value_text, smart_code, created_by, updated_by)
  SELECT e.id, e.organization_id, 'next_retry_at', 'text', p_next_retry_at, e.smart_code || '.RETRY_AT', e.created_by, e.updated_by
  FROM core_entities e WHERE e.id = p_event_id
;
    
  RETURN TRUE;
END;
$$;

-- ============================================================================
-- INTEGRATION RELATIONSHIP TYPES & HELPER FUNCTIONS
-- ============================================================================

-- Function to create integration relationship types
CREATE OR REPLACE FUNCTION hera_integration_setup_relationships_v1()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_platform_org_id UUID := '00000000-0000-0000-0000-000000000000';
  v_system_actor_id UUID := '00000000-0000-0000-0000-000000000001';
  v_rel_types TEXT[] := ARRAY[
    'CONNECTOR_INSTALLED_BY',    -- Installation -> Organization
    'CONNECTOR_BASED_ON',        -- Installation -> Definition  
    'EVENT_PROCESSED_BY',        -- Event -> Connector Installation
    'WEBHOOK_BELONGS_TO',        -- Webhook -> Connector Installation
    'CONNECTOR_SUPPORTS',        -- Connector Definition -> Event Type
    'ORG_AUTHORIZED_FOR',        -- Organization -> Connector Definition
    'WEBHOOK_DELIVERS_TO',       -- Webhook -> External Endpoint
    'EVENT_TRIGGERS',            -- Event -> Webhook Delivery
    'CONNECTOR_DEPENDS_ON',      -- Connector -> Other Connector
    'INTEGRATION_MANAGES'        -- Integration Admin -> Connector
  ];
  v_rel_type TEXT;
BEGIN
  -- Create relationship type entities for integration system
  FOREACH v_rel_type IN ARRAY v_rel_types
  LOOP
    INSERT INTO core_entities (
      id,
      organization_id,
      entity_type,
      entity_code,
      entity_name,
      smart_code,
      created_by,
      updated_by,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_platform_org_id,
      'RELATIONSHIP_TYPE',
      v_rel_type,
      replace(v_rel_type, '_', ' '),
      format('HERA.PLATFORM.INTEGRATION.RELATIONSHIP.%s.v1', v_rel_type),
      v_system_actor_id,
      v_system_actor_id,
      NOW(),
      NOW()
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Integration relationship types created',
    'relationship_types', v_rel_types
  );
END;
$$;

-- Function to manage webhook configurations
CREATE OR REPLACE FUNCTION hera_webhook_config_v1(
  p_actor_user_id UUID,
  p_organization_id UUID,
  p_operation TEXT DEFAULT 'LIST',
  p_webhook_config JSONB DEFAULT '{}',
  p_connector_code TEXT DEFAULT NULL,
  p_webhook_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_webhook_id UUID;
  v_smart_code TEXT;
  v_result JSONB;
  v_webhooks JSONB;
BEGIN
  -- Input validation
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'actor_user_id is required for audit compliance';
  END IF;
  
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION 'organization_id is required for tenant isolation';
  END IF;
  
  -- Handle different operations
  IF UPPER(p_operation) = 'LIST' THEN
    -- List webhook configurations for organization
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', e.id,
        'connector_code', COALESCE(
          (SELECT r.from_entity_id::text
           FROM core_relationships r
           JOIN core_entities ce ON ce.id = r.from_entity_id
           WHERE r.to_entity_id = e.id 
           AND r.relationship_type = 'WEBHOOK_BELONGS_TO'
           AND ce.entity_type = 'INTEGRATION_CONNECTOR_INSTALL'
           LIMIT 1), 
          'unknown'
        ),
        'config', COALESCE(
          (SELECT d.field_value_json 
           FROM core_dynamic_data d 
           WHERE d.entity_id = e.id AND d.field_name = 'webhook_config'),
          '{}'::jsonb
        ),
        'is_active', COALESCE(
          (SELECT d.field_value_text = 'active'
           FROM core_dynamic_data d 
           WHERE d.entity_id = e.id AND d.field_name = 'status'),
          true
        ),
        'created_at', e.created_at
      )
    ) INTO v_webhooks
    FROM core_entities e
    WHERE e.organization_id = p_organization_id
      AND e.entity_type = 'INTEGRATION_WEBHOOK';
    
    RETURN jsonb_build_object(
      'success', true,
      'webhooks', COALESCE(v_webhooks, '[]'::jsonb)
    );
    
  ELSIF UPPER(p_operation) = 'CREATE' THEN
    -- Create webhook configuration
    v_smart_code := format('HERA.PLATFORM.INTEGRATION.WEBHOOK.%s.v1', 
                          UPPER(REPLACE(COALESCE(p_connector_code, 'GENERIC'), '-', '_')));
    
    -- Create webhook entity
    INSERT INTO core_entities (
      id,
      organization_id,
      entity_type,
      entity_code,
      entity_name,
      smart_code,
      created_by,
      updated_by
    ) VALUES (
      gen_random_uuid(),
      p_organization_id,
      'INTEGRATION_WEBHOOK',
      format('webhook_%s_%s', COALESCE(p_connector_code, 'generic'), EXTRACT(epoch FROM NOW())::text),
      format('Webhook for %s', COALESCE(p_connector_code, 'Generic Integration')),
      v_smart_code,
      p_actor_user_id,
      p_actor_user_id
    ) RETURNING id INTO v_webhook_id;
    
    -- Store webhook configuration
    INSERT INTO core_dynamic_data (
      entity_id,
      organization_id,
      field_name,
      field_type,
      field_value_json,
      field_value_text,
      smart_code,
      created_by,
      updated_by
    ) VALUES 
      (v_webhook_id, p_organization_id, 'webhook_config', 'json', p_webhook_config, NULL, v_smart_code || '.CONFIG', p_actor_user_id, p_actor_user_id),
      (v_webhook_id, p_organization_id, 'status', 'text', NULL, 'active', v_smart_code || '.STATUS', p_actor_user_id, p_actor_user_id);
    
    -- Link webhook to connector if specified
    IF p_connector_code IS NOT NULL THEN
      INSERT INTO core_relationships (
        organization_id,
        from_entity_id,
        to_entity_id,
        relationship_type,
        smart_code,
        created_by,
        updated_by
      )
      SELECT 
        p_organization_id,
        c.id,
        v_webhook_id,
        'WEBHOOK_BELONGS_TO',
        v_smart_code || '.CONNECTOR_REL',
        p_actor_user_id,
        p_actor_user_id
      FROM core_entities c
      WHERE c.organization_id = p_organization_id
        AND c.entity_type = 'INTEGRATION_CONNECTOR_INSTALL'
        AND c.entity_code = p_connector_code;
    END IF;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Webhook configuration created',
      'webhook_id', v_webhook_id,
      'smart_code', v_smart_code
    );
    
  ELSIF UPPER(p_operation) = 'UPDATE' THEN
    -- Update webhook configuration
    IF p_webhook_id IS NULL THEN
      RAISE EXCEPTION 'webhook_id is required for UPDATE operation';
    END IF;
    
    -- Update webhook configuration
    UPDATE core_dynamic_data
    SET field_value_json = p_webhook_config,
        updated_by = p_actor_user_id,
        updated_at = NOW()
    WHERE entity_id = p_webhook_id
      AND field_name = 'webhook_config'
      AND entity_id IN (
        SELECT id FROM core_entities 
        WHERE organization_id = p_organization_id 
        AND entity_type = 'INTEGRATION_WEBHOOK'
      );
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Webhook configuration updated'
    );
    
  ELSIF UPPER(p_operation) = 'DELETE' THEN
    -- Deactivate webhook
    IF p_webhook_id IS NULL THEN
      RAISE EXCEPTION 'webhook_id is required for DELETE operation';
    END IF;
    
    UPDATE core_dynamic_data
    SET field_value_text = 'inactive',
        updated_by = p_actor_user_id,
        updated_at = NOW()
    WHERE entity_id = p_webhook_id
      AND field_name = 'status'
      AND entity_id IN (
        SELECT id FROM core_entities 
        WHERE organization_id = p_organization_id 
        AND entity_type = 'INTEGRATION_WEBHOOK'
      );
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Webhook deactivated'
    );
    
  ELSE
    RAISE EXCEPTION 'Unknown operation: %', p_operation;
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Webhook configuration operation failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- Function to get webhooks by topic (for outbox worker)
CREATE OR REPLACE FUNCTION hera_webhook_get_by_topic_v1(
  p_organization_id UUID,
  p_topic TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_webhooks JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', e.id,
      'organization_id', e.organization_id,
      'url', config.field_value_json ->> 'url',
      'secret', config.field_value_json ->> 'secret',
      'topics', COALESCE(config.field_value_json -> 'topics', '[]'::jsonb),
      'retry_policy', COALESCE(config.field_value_json -> 'retry_policy', '{"max_attempts": 5, "backoff_factor": 2, "initial_delay_ms": 5000}'::jsonb),
      'is_active', COALESCE(status.field_value_text = 'active', true)
    )
  ) INTO v_webhooks
  FROM core_entities e
  JOIN core_dynamic_data config ON config.entity_id = e.id AND config.field_name = 'webhook_config'
  LEFT JOIN core_dynamic_data status ON status.entity_id = e.id AND status.field_name = 'status'
  WHERE e.organization_id = p_organization_id
    AND e.entity_type = 'INTEGRATION_WEBHOOK'
    AND COALESCE(status.field_value_text, 'active') = 'active'
    AND (
      config.field_value_json -> 'topics' @> to_jsonb(p_topic) OR
      config.field_value_json ->> 'topics' = '*' OR
      config.field_value_json -> 'topics' IS NULL
    );
  
  RETURN COALESCE(v_webhooks, '[]'::jsonb);
END;
$$;

-- Function to log webhook deliveries (for outbox worker)
CREATE OR REPLACE FUNCTION hera_webhook_delivery_log_v1(
  p_event_id UUID,
  p_webhook_id UUID,
  p_organization_id UUID,
  p_status_code INTEGER,
  p_response_body TEXT,
  p_attempt_number INTEGER,
  p_delivery_duration_ms INTEGER DEFAULT 0
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
  v_smart_code TEXT;
BEGIN
  v_smart_code := 'HERA.PLATFORM.INTEGRATION.DELIVERY_LOG.v1';
  
  -- Create delivery log entity
  INSERT INTO core_entities (
    id,
    organization_id,
    entity_type,
    entity_code,
    entity_name,
    smart_code,
    created_by,
    updated_by
  ) VALUES (
    gen_random_uuid(),
    p_organization_id,
    'WEBHOOK_DELIVERY_LOG',
    format('delivery_%s_%s', p_event_id::text, p_attempt_number),
    format('Delivery Log %s', p_attempt_number),
    v_smart_code,
    '00000000-0000-0000-0000-000000000001', -- System actor
    '00000000-0000-0000-0000-000000000001'
  ) RETURNING id INTO v_log_id;
  
  -- Store delivery details
  INSERT INTO core_dynamic_data (
    entity_id,
    organization_id,
    field_name,
    field_type,
    field_value_text,
    field_value_number,
    smart_code,
    created_by,
    updated_by
  ) VALUES 
    (v_log_id, p_organization_id, 'status_code', 'number', p_status_code::text, p_status_code, v_smart_code || '.STATUS_CODE', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    (v_log_id, p_organization_id, 'response_body', 'text', p_response_body, NULL, v_smart_code || '.RESPONSE', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    (v_log_id, p_organization_id, 'attempt_number', 'number', p_attempt_number::text, p_attempt_number, v_smart_code || '.ATTEMPT', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    (v_log_id, p_organization_id, 'duration_ms', 'number', p_delivery_duration_ms::text, p_delivery_duration_ms, v_smart_code || '.DURATION', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001');
  
  -- Create relationships to event and webhook
  INSERT INTO core_relationships (
    organization_id,
    from_entity_id,
    to_entity_id,
    relationship_type,
    smart_code,
    created_by,
    updated_by
  ) VALUES 
    (p_organization_id, v_log_id, p_event_id, 'LOGGED_FOR', v_smart_code || '.EVENT_REL', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    (p_organization_id, v_log_id, p_webhook_id, 'DELIVERED_TO', v_smart_code || '.WEBHOOK_REL', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001');
  
  RETURN TRUE;
END;
$$;

-- Initialize integration relationship types
SELECT hera_integration_setup_relationships_v1();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION hera_integration_event_in_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_integration_connector_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_outbox_get_pending_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_outbox_update_status_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_outbox_schedule_retry_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_integration_setup_relationships_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_webhook_config_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_webhook_get_by_topic_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_webhook_delivery_log_v1 TO authenticated;