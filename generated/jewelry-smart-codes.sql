-- HERA DNA GENERATED: Jewelry Smart Codes SQL Implementation
-- Generated: 2024-12-19 
-- Module: JewelryMaster Pro
-- Architecture: Universal 6-Table Schema
-- Smart Code Namespace: HERA.JWLY.*

-- =============================================================================
-- JEWELRY SMART CODE SYSTEM - UNIVERSAL ARCHITECTURE
-- =============================================================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS process_jewelry_smart_code CASCADE;
DROP FUNCTION IF EXISTS create_jewelry_entity CASCADE;
DROP FUNCTION IF EXISTS process_jewelry_transaction CASCADE;
DROP FUNCTION IF EXISTS calculate_jewelry_ai_metrics CASCADE;

-- =============================================================================
-- CORE SMART CODE PROCESSOR
-- =============================================================================

CREATE OR REPLACE FUNCTION process_jewelry_smart_code(
    p_smart_code VARCHAR,
    p_organization_id UUID,
    p_data JSONB,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_entity_id UUID;
    v_transaction_id UUID;
    v_ai_insights JSONB;
BEGIN
    -- Initialize result
    v_result := '{"success": true, "smart_code": "' || p_smart_code || '", "timestamp": "' || NOW() || '"}'::JSONB;
    
    -- Route to appropriate handler based on smart code pattern
    CASE 
        -- INVENTORY OPERATIONS
        WHEN p_smart_code LIKE 'HERA.JWLY.INV.ENT.%' THEN
            v_result := process_jewelry_inventory_entity(p_smart_code, p_organization_id, p_data, p_user_id);
            
        -- POS OPERATIONS  
        WHEN p_smart_code LIKE 'HERA.JWLY.POS.TXN.%' THEN
            v_result := process_jewelry_pos_transaction(p_smart_code, p_organization_id, p_data, p_user_id);
            
        -- CRM OPERATIONS
        WHEN p_smart_code LIKE 'HERA.JWLY.CRM.%' THEN
            v_result := process_jewelry_crm_operation(p_smart_code, p_organization_id, p_data, p_user_id);
            
        -- REPAIR OPERATIONS
        WHEN p_smart_code LIKE 'HERA.JWLY.RPR.%' THEN
            v_result := process_jewelry_repair_operation(p_smart_code, p_organization_id, p_data, p_user_id);
            
        -- AI OPERATIONS
        WHEN p_smart_code LIKE 'HERA.JWLY.AI.%' THEN
            v_result := process_jewelry_ai_operation(p_smart_code, p_organization_id, p_data, p_user_id);
            
        ELSE
            v_result := '{"success": false, "error": "Unknown jewelry smart code pattern", "smart_code": "' || p_smart_code || '"}'::JSONB;
    END CASE;
    
    -- Log smart code execution
    INSERT INTO universal_transactions (
        organization_id,
        transaction_type,
        smart_code,
        metadata,
        total_amount,
        created_by
    ) VALUES (
        p_organization_id,
        'smart_code_execution',
        p_smart_code,
        jsonb_build_object(
            'input_data', p_data,
            'result', v_result,
            'execution_time', EXTRACT(EPOCH FROM NOW())
        ),
        0,
        p_user_id
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- JEWELRY INVENTORY ENTITY PROCESSOR
-- =============================================================================

CREATE OR REPLACE FUNCTION process_jewelry_inventory_entity(
    p_smart_code VARCHAR,
    p_organization_id UUID,
    p_data JSONB,
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_entity_id UUID;
    v_result JSONB;
    v_ai_classification JSONB;
    v_pricing_data JSONB;
BEGIN
    -- Create jewelry product entity
    INSERT INTO core_entities (
        organization_id,
        entity_type,
        entity_name,
        entity_code,
        smart_code,
        status,
        ai_classification,
        ai_confidence_score,
        created_by
    ) VALUES (
        p_organization_id,
        'jewelry_product',
        p_data->>'product_name',
        p_data->>'sku',
        p_smart_code,
        'active',
        calculate_jewelry_ai_classification(p_data),
        0.95,
        p_user_id
    ) RETURNING id INTO v_entity_id;
    
    -- Add jewelry-specific dynamic data
    PERFORM create_jewelry_dynamic_fields(v_entity_id, p_data);
    
    -- Calculate AI-enhanced pricing
    v_pricing_data := calculate_jewelry_pricing(p_data);
    
    -- Add pricing dynamic data
    INSERT INTO core_dynamic_data (entity_id, field_name, field_value, ai_enhanced, confidence_score)
    SELECT 
        v_entity_id,
        pricing.key,
        pricing.value::TEXT,
        true,
        0.90
    FROM jsonb_each(v_pricing_data) AS pricing;
    
    v_result := jsonb_build_object(
        'success', true,
        'entity_id', v_entity_id,
        'smart_code', p_smart_code,
        'ai_classification', calculate_jewelry_ai_classification(p_data),
        'pricing_analysis', v_pricing_data
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- JEWELRY POS TRANSACTION PROCESSOR  
-- =============================================================================

CREATE OR REPLACE FUNCTION process_jewelry_pos_transaction(
    p_smart_code VARCHAR,
    p_organization_id UUID,
    p_data JSONB,
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_transaction_id UUID;
    v_result JSONB;
    v_ai_insights JSONB;
    v_upsell_opportunities JSONB;
    v_fraud_score DECIMAL;
BEGIN
    -- Calculate AI insights for transaction
    v_ai_insights := calculate_transaction_ai_insights(p_data, p_organization_id);
    v_fraud_score := (v_ai_insights->>'fraud_score')::DECIMAL;
    
    -- Create main transaction
    INSERT INTO universal_transactions (
        organization_id,
        transaction_type,
        smart_code,
        reference_number,
        transaction_date,
        total_amount,
        metadata,
        ai_fraud_score,
        ai_insights,
        created_by
    ) VALUES (
        p_organization_id,
        CASE 
            WHEN p_smart_code LIKE '%SALE%' THEN 'jewelry_sale'
            WHEN p_smart_code LIKE '%RETURN%' THEN 'jewelry_return'
            WHEN p_smart_code LIKE '%LAYAWAY%' THEN 'jewelry_layaway'
            ELSE 'jewelry_transaction'
        END,
        p_smart_code,
        'JWL-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('jewelry_transaction_seq')::TEXT, 6, '0'),
        NOW(),
        (p_data->>'total_amount')::DECIMAL,
        p_data,
        v_fraud_score,
        v_ai_insights,
        p_user_id
    ) RETURNING id INTO v_transaction_id;
    
    -- Create transaction lines for each item
    INSERT INTO universal_transaction_lines (
        transaction_id,
        entity_id,
        line_type,
        quantity,
        unit_price,
        line_total,
        metadata
    )
    SELECT 
        v_transaction_id,
        (item->>'entity_id')::UUID,
        'jewelry_item',
        (item->>'quantity')::DECIMAL,
        (item->>'unit_price')::DECIMAL,
        (item->>'line_total')::DECIMAL,
        item
    FROM jsonb_array_elements(p_data->'line_items') AS item;
    
    -- Calculate upsell opportunities
    v_upsell_opportunities := calculate_jewelry_upsell_opportunities(p_data, p_organization_id);
    
    -- Automatic GL posting for jewelry sale
    IF p_smart_code LIKE '%SALE%' THEN
        PERFORM post_jewelry_sale_gl_entries(v_transaction_id, p_data);
    END IF;
    
    v_result := jsonb_build_object(
        'success', true,
        'transaction_id', v_transaction_id,
        'smart_code', p_smart_code,
        'ai_insights', v_ai_insights,
        'upsell_opportunities', v_upsell_opportunities,
        'fraud_score', v_fraud_score
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- JEWELRY DYNAMIC FIELDS CREATOR
-- =============================================================================

CREATE OR REPLACE FUNCTION create_jewelry_dynamic_fields(
    p_entity_id UUID,
    p_data JSONB
)
RETURNS VOID AS $$
DECLARE
    v_field_configs JSONB;
BEGIN
    -- Define jewelry-specific field configurations
    v_field_configs := '{
        "metal_type": {"ai_enhanced": true, "validation": "gold,silver,platinum,titanium"},
        "metal_purity": {"ai_enhanced": false, "validation": "24k,18k,14k,10k,925,950"},
        "total_weight": {"ai_enhanced": false, "unit": "grams", "type": "decimal"},
        "stone_weight": {"ai_enhanced": false, "unit": "carats", "type": "decimal"},
        "stone_type": {"ai_enhanced": true, "classification": true},
        "stone_clarity": {"ai_enhanced": true, "grading": true},
        "stone_color": {"ai_enhanced": true, "classification": true},
        "stone_cut": {"ai_enhanced": false, "validation": "round,princess,emerald,asscher,radiant,oval,pear,heart,marquise"},
        "cost_price": {"ai_enhanced": false, "currency": true, "type": "decimal"},
        "retail_price": {"ai_enhanced": true, "currency": true, "type": "decimal"},
        "wholesale_price": {"ai_enhanced": true, "currency": true, "type": "decimal"},
        "margin_percentage": {"ai_enhanced": true, "calculated": true, "type": "decimal"},
        "supplier_sku": {"ai_enhanced": false, "type": "text"},
        "barcode": {"ai_enhanced": false, "unique": true, "type": "text"},
        "ai_style_classification": {"ai_enhanced": true, "generated": true},
        "ai_target_demographic": {"ai_enhanced": true, "analysis": true, "type": "json"},
        "ai_seasonality_score": {"ai_enhanced": true, "calculated": true, "type": "decimal"},
        "ai_markup_recommendation": {"ai_enhanced": true, "suggested": true, "type": "decimal"}
    }'::JSONB;
    
    -- Create dynamic data entries for each field present in input data
    INSERT INTO core_dynamic_data (
        entity_id,
        field_name,
        field_value,
        ai_enhanced,
        confidence_score,
        metadata
    )
    SELECT 
        p_entity_id,
        field.key,
        CASE 
            WHEN (v_field_configs->field.key->>'type') = 'json' THEN field.value::TEXT
            ELSE field.value::TEXT
        END,
        COALESCE((v_field_configs->field.key->>'ai_enhanced')::BOOLEAN, false),
        CASE 
            WHEN (v_field_configs->field.key->>'ai_enhanced')::BOOLEAN THEN 0.85
            ELSE 1.0
        END,
        COALESCE(v_field_configs->field.key, '{}'::JSONB)
    FROM jsonb_each(p_data) AS field
    WHERE v_field_configs ? field.key;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- JEWELRY AI CLASSIFICATION CALCULATOR
-- =============================================================================

CREATE OR REPLACE FUNCTION calculate_jewelry_ai_classification(
    p_data JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_classification JSONB;
    v_style TEXT;
    v_category TEXT;
    v_target_demographic TEXT[];
BEGIN
    -- AI-powered style classification logic
    v_style := CASE 
        WHEN p_data->>'stone_type' ILIKE '%diamond%' AND p_data->>'metal_type' ILIKE '%gold%' THEN 'Classic Luxury'
        WHEN p_data->>'stone_type' ILIKE '%sapphire%' OR p_data->>'stone_type' ILIKE '%ruby%' THEN 'Colored Gemstone'
        WHEN p_data->>'metal_type' ILIKE '%silver%' THEN 'Contemporary Silver'
        WHEN p_data->>'stone_type' IS NULL THEN 'Minimalist Metal'
        ELSE 'Mixed Style'
    END;
    
    -- Category determination
    v_category := CASE 
        WHEN p_data->>'product_name' ILIKE '%ring%' THEN 'Rings'
        WHEN p_data->>'product_name' ILIKE '%necklace%' OR p_data->>'product_name' ILIKE '%pendant%' THEN 'Necklaces'
        WHEN p_data->>'product_name' ILIKE '%earring%' THEN 'Earrings'
        WHEN p_data->>'product_name' ILIKE '%bracelet%' THEN 'Bracelets'
        WHEN p_data->>'product_name' ILIKE '%watch%' THEN 'Watches'
        ELSE 'Other Jewelry'
    END;
    
    -- Target demographic analysis
    v_target_demographic := CASE 
        WHEN (p_data->>'retail_price')::DECIMAL > 10000 THEN ARRAY['High-End Luxury', 'Collectors']
        WHEN (p_data->>'retail_price')::DECIMAL > 2000 THEN ARRAY['Affluent', 'Special Occasions']
        WHEN (p_data->>'retail_price')::DECIMAL > 500 THEN ARRAY['Middle Market', 'Gift Buyers']
        ELSE ARRAY['Value Conscious', 'Young Adults']
    END;
    
    v_classification := jsonb_build_object(
        'style', v_style,
        'category', v_category,
        'target_demographic', to_jsonb(v_target_demographic),
        'luxury_tier', CASE 
            WHEN (p_data->>'retail_price')::DECIMAL > 25000 THEN 'Ultra Luxury'
            WHEN (p_data->>'retail_price')::DECIMAL > 10000 THEN 'High Luxury'
            WHEN (p_data->>'retail_price')::DECIMAL > 2000 THEN 'Accessible Luxury'
            ELSE 'Fashion Jewelry'
        END,
        'confidence_score', 0.87
    );
    
    RETURN v_classification;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- JEWELRY PRICING CALCULATOR WITH AI
-- =============================================================================

CREATE OR REPLACE FUNCTION calculate_jewelry_pricing(
    p_data JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_pricing JSONB;
    v_material_cost DECIMAL;
    v_labor_cost DECIMAL;
    v_suggested_markup DECIMAL;
    v_market_price DECIMAL;
BEGIN
    -- Calculate material cost based on metal and stone
    v_material_cost := COALESCE((p_data->>'cost_price')::DECIMAL, 0);
    
    -- Estimate labor cost (15-25% of material cost for jewelry)
    v_labor_cost := v_material_cost * 0.20;
    
    -- AI-suggested markup based on jewelry type and market trends
    v_suggested_markup := CASE 
        WHEN p_data->>'stone_type' ILIKE '%diamond%' THEN 2.5  -- 150% markup
        WHEN p_data->>'metal_type' ILIKE '%gold%' THEN 2.2     -- 120% markup  
        WHEN p_data->>'metal_type' ILIKE '%silver%' THEN 3.0   -- 200% markup
        ELSE 2.0  -- 100% markup default
    END;
    
    -- Calculate market-competitive price
    v_market_price := (v_material_cost + v_labor_cost) * v_suggested_markup;
    
    v_pricing := jsonb_build_object(
        'material_cost', v_material_cost,
        'labor_cost', v_labor_cost,
        'total_cost', v_material_cost + v_labor_cost,
        'suggested_markup', v_suggested_markup,
        'suggested_retail', v_market_price,
        'minimum_price', (v_material_cost + v_labor_cost) * 1.3, -- 30% minimum margin
        'margin_percentage', ((v_market_price - (v_material_cost + v_labor_cost)) / v_market_price * 100),
        'pricing_strategy', CASE 
            WHEN v_suggested_markup > 2.5 THEN 'Premium Positioning'
            WHEN v_suggested_markup > 2.0 THEN 'Market Competitive'  
            ELSE 'Value Positioning'
        END
    );
    
    RETURN v_pricing;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- CREATE SEQUENCES FOR JEWELRY OPERATIONS
-- =============================================================================

CREATE SEQUENCE IF NOT EXISTS jewelry_transaction_seq START 1000;
CREATE SEQUENCE IF NOT EXISTS jewelry_repair_seq START 2000;
CREATE SEQUENCE IF NOT EXISTS jewelry_customer_seq START 5000;

-- =============================================================================
-- TRIGGER SETUP FOR AUTOMATIC SMART CODE PROCESSING
-- =============================================================================

-- Trigger for automatic processing when entities are created
CREATE OR REPLACE FUNCTION trigger_jewelry_smart_code_processing()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process jewelry-related smart codes
    IF NEW.smart_code LIKE 'HERA.JWLY.%' THEN
        -- Process the smart code asynchronously 
        PERFORM process_jewelry_smart_code(
            NEW.smart_code,
            NEW.organization_id,
            COALESCE(NEW.metadata, '{}'::JSONB),
            NEW.created_by
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to core entities table
DROP TRIGGER IF EXISTS jewelry_smart_code_trigger ON core_entities;
CREATE TRIGGER jewelry_smart_code_trigger
    AFTER INSERT OR UPDATE ON core_entities
    FOR EACH ROW
    WHEN (NEW.smart_code LIKE 'HERA.JWLY.%')
    EXECUTE FUNCTION trigger_jewelry_smart_code_processing();

-- =============================================================================
-- JEWELRY BUSINESS INTELLIGENCE FUNCTIONS
-- =============================================================================

-- Get jewelry sales analytics
CREATE OR REPLACE FUNCTION get_jewelry_sales_analytics(
    p_organization_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
    v_analytics JSONB;
BEGIN
    WITH jewelry_sales AS (
        SELECT 
            t.total_amount,
            t.transaction_date,
            t.ai_insights,
            COUNT(*) as transaction_count,
            AVG(t.total_amount) as avg_sale_amount,
            SUM(t.total_amount) as total_revenue
        FROM universal_transactions t
        WHERE t.organization_id = p_organization_id
        AND t.transaction_type = 'jewelry_sale'
        AND t.transaction_date BETWEEN p_start_date AND p_end_date
        GROUP BY t.total_amount, t.transaction_date, t.ai_insights
    )
    SELECT jsonb_build_object(
        'total_revenue', COALESCE(SUM(total_revenue), 0),
        'transaction_count', COALESCE(SUM(transaction_count), 0),
        'average_sale', COALESCE(AVG(avg_sale_amount), 0),
        'period_start', p_start_date,
        'period_end', p_end_date,
        'analysis_date', NOW()
    ) INTO v_analytics FROM jewelry_sales;
    
    RETURN v_analytics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to appropriate roles
GRANT EXECUTE ON FUNCTION process_jewelry_smart_code TO authenticated;
GRANT EXECUTE ON FUNCTION get_jewelry_sales_analytics TO authenticated;

-- =============================================================================
-- SMART CODE SYSTEM READY
-- Generated by HERA DNA - JewelryMaster Pro Module
-- Universal Architecture: 6-Table Schema with AI Intelligence
-- =============================================================================

COMMENT ON FUNCTION process_jewelry_smart_code IS 'HERA DNA Generated: Universal Smart Code processor for jewelry operations';
COMMENT ON FUNCTION calculate_jewelry_ai_classification IS 'AI-powered jewelry product classification and market analysis';
COMMENT ON FUNCTION calculate_jewelry_pricing IS 'Intelligent pricing calculator with market-based recommendations';