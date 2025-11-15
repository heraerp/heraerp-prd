-- ================================================================================
-- HERA Finance Suite v2.2 - Complete Deployment Script
-- Script: Deploy all finance migrations in correct order
-- Author: HERA Finance Team
-- Created: 2024-11-16
-- ================================================================================

-- Deployment order validation
DO $deployment$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🚀 HERA FINANCE SUITE v2.2 - DEPLOYMENT SCRIPT';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Deploying complete finance suite...';
    RAISE NOTICE '';
    
    -- Check if migrations should be run manually
    RAISE NOTICE '📋 DEPLOYMENT INSTRUCTIONS:';
    RAISE NOTICE 'Run the following migration files in order:';
    RAISE NOTICE '';
    RAISE NOTICE '1. 20241116000001_hera_finance_dna_v2_2.sql';
    RAISE NOTICE '   ✨ Finance DNA v2.2 core runtime engine';
    RAISE NOTICE '';
    RAISE NOTICE '2. 20241116000002_hera_finance_entities.sql';
    RAISE NOTICE '   📊 Finance entity types (27 entities)';
    RAISE NOTICE '';
    RAISE NOTICE '3. 20241116000003_hera_finance_posting_rules.sql';
    RAISE NOTICE '   🧬 Posting rules engine with bundles';
    RAISE NOTICE '';
    RAISE NOTICE '4. 20241116000004_hera_finance_micro_apps.sql';
    RAISE NOTICE '   🎯 Micro-apps for GL, AP, AR, Bank, Assets';
    RAISE NOTICE '';
    RAISE NOTICE '5. 20241116000005_hera_finance_tile_templates.sql';
    RAISE NOTICE '   🎨 Dashboard tile templates (13 tiles)';
    RAISE NOTICE '';
    RAISE NOTICE '6. 20241116000006_hera_finance_ifrs_compliance.sql';
    RAISE NOTICE '   📋 IFRS compliance validation (IAS 21, IFRS 15, 16)';
    RAISE NOTICE '';
    RAISE NOTICE '7. 20241116000007_hera_finance_multi_currency.sql';
    RAISE NOTICE '   💱 Multi-currency support (USD, EUR, GBP, AED, JPY)';
    RAISE NOTICE '';
    RAISE NOTICE '8. 20241116000008_hera_finance_performance_indexes.sql';
    RAISE NOTICE '   ⚡ Performance optimization indexes';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TESTING:';
    RAISE NOTICE 'After deployment, run: supabase/tests/finance_test_scenarios.sql';
    RAISE NOTICE '';
    
    -- Validate environment
    RAISE NOTICE '🔍 ENVIRONMENT VALIDATION:';
    
    -- Check for required tables
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'core_entities') THEN
        RAISE EXCEPTION 'Required table core_entities not found. Deploy HERA core schema first.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'core_dynamic_data') THEN
        RAISE EXCEPTION 'Required table core_dynamic_data not found. Deploy HERA core schema first.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'universal_transactions') THEN
        RAISE EXCEPTION 'Required table universal_transactions not found. Deploy HERA core schema first.';
    END IF;
    
    RAISE NOTICE '✅ Core HERA schema detected';
    RAISE NOTICE '✅ Environment validation passed';
    RAISE NOTICE '';
    
    -- Check organization structure
    DECLARE
        v_platform_org_count INTEGER;
    BEGIN
        SELECT COUNT(*) INTO v_platform_org_count
        FROM core_entities
        WHERE entity_type = 'ORGANIZATION'
        AND id = '00000000-0000-0000-0000-000000000000';
        
        IF v_platform_org_count = 0 THEN
            RAISE NOTICE '⚠️  Platform organization not found. Creating...';
            
            INSERT INTO core_entities (
                id, entity_type, entity_code, entity_name, smart_code,
                organization_id, created_by, updated_by, 
                created_at, updated_at, status
            ) VALUES (
                '00000000-0000-0000-0000-000000000000',
                'ORGANIZATION',
                'PLATFORM',
                'HERA Platform Organization',
                'HERA.PLATFORM.ORGANIZATION.PLATFORM.v1',
                '00000000-0000-0000-0000-000000000000',
                '00000000-0000-0000-0000-000000000001',
                '00000000-0000-0000-0000-000000000001',
                NOW(),
                NOW(),
                'active'
            ) ON CONFLICT ON CONSTRAINT core_entities_org_type_code_uidx DO NOTHING;
            
            RAISE NOTICE '✅ Platform organization created';
        ELSE
            RAISE NOTICE '✅ Platform organization exists';
        END IF;
    END;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎯 EXPECTED RESULTS:';
    RAISE NOTICE '• 27+ finance entity types';
    RAISE NOTICE '• 8+ Finance DNA functions';
    RAISE NOTICE '• 10+ posting rule bundles';
    RAISE NOTICE '• 5+ micro-apps (GL, AP, AR, Bank, Assets)';
    RAISE NOTICE '• 13+ dashboard tile templates';
    RAISE NOTICE '• Complete IFRS validation framework';
    RAISE NOTICE '• Multi-currency support (5 currencies)';
    RAISE NOTICE '• Strategic performance indexes';
    RAISE NOTICE '';
    
    RAISE NOTICE '✅ Deployment script validation completed.';
    RAISE NOTICE '📝 Ready to run migrations in sequence.';
    
END;
$deployment$;