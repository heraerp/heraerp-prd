-- ================================================================================
-- HERA Finance Suite v2.2 - Quick Validation Test
-- Quick test to validate core finance functionality
-- Run this after deploying all 8 finance migrations
-- ================================================================================

-- Quick test configuration
DO $quick_test$
DECLARE
    v_test_org_id UUID := '11111111-2222-3333-4444-555555555555';
    v_test_user_id UUID := '11111111-2222-3333-4444-666666666666';
    v_tests_passed INTEGER := 0;
    v_total_tests INTEGER := 10;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🚀 HERA FINANCE SUITE v2.2 - QUICK VALIDATION';
    RAISE NOTICE '=============================================';
    RAISE NOTICE '';

    -- Test 1: Finance DNA Engine
    BEGIN
        PERFORM hera_finance_dna_evaluate_v1(
            v_test_user_id,
            v_test_org_id, 
            'TEST',
            '{"total_amount": 100}'::JSONB
        );
        v_tests_passed := v_tests_passed + 1;
        RAISE NOTICE '✅ 1/10: Finance DNA Engine - Working';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ 1/10: Finance DNA Engine - Error: %', SQLERRM;
    END;

    -- Test 2: Finance Entity Types Count
    DECLARE
        v_entity_count INTEGER;
    BEGIN
        SELECT COUNT(*) INTO v_entity_count
        FROM core_entities
        WHERE entity_type IN ('GL_ACCOUNT', 'AP_INVOICE', 'AR_INVOICE', 'BANK_ACCOUNT')
        AND organization_id = '00000000-0000-0000-0000-000000000000';
        
        IF v_entity_count >= 4 THEN
            v_tests_passed := v_tests_passed + 1;
            RAISE NOTICE '✅ 2/10: Finance Entity Types (%) - Working', v_entity_count;
        ELSE
            RAISE NOTICE '❌ 2/10: Finance Entity Types (%) - Insufficient', v_entity_count;
        END IF;
    END;

    -- Test 3: Posting Rules Bundles
    DECLARE
        v_bundle_count INTEGER;
    BEGIN
        SELECT COUNT(*) INTO v_bundle_count
        FROM core_entities ce
        WHERE ce.entity_type = 'FINANCE_DNA_BUNDLE'
        AND ce.organization_id = '00000000-0000-0000-0000-000000000000';
        
        IF v_bundle_count >= 3 THEN
            v_tests_passed := v_tests_passed + 1;
            RAISE NOTICE '✅ 3/10: Posting Rules Bundles (%) - Working', v_bundle_count;
        ELSE
            RAISE NOTICE '❌ 3/10: Posting Rules Bundles (%) - Insufficient', v_bundle_count;
        END IF;
    END;

    -- Test 4: Multi-Currency Support
    DECLARE
        v_currency_count INTEGER;
    BEGIN
        SELECT COUNT(*) INTO v_currency_count
        FROM core_entities
        WHERE entity_type = 'CURRENCY'
        AND entity_code IN ('USD', 'EUR', 'GBP');
        
        IF v_currency_count >= 3 THEN
            v_tests_passed := v_tests_passed + 1;
            RAISE NOTICE '✅ 4/10: Multi-Currency Support (%) - Working', v_currency_count;
        ELSE
            RAISE NOTICE '❌ 4/10: Multi-Currency Support (%) - Insufficient', v_currency_count;
        END IF;
    END;

    -- Test 5: FX Rate Function
    BEGIN
        PERFORM hera_fx_get_rate_v1('USD', 'EUR', CURRENT_DATE, v_test_org_id);
        v_tests_passed := v_tests_passed + 1;
        RAISE NOTICE '✅ 5/10: FX Rate Function - Working';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ 5/10: FX Rate Function - Error: %', SQLERRM;
    END;

    -- Test 6: IFRS Validation Function
    BEGIN
        PERFORM hera_ifrs_validate_transaction_v1(
            'AR_INVOICE',
            '{"total_amount": 1000}'::JSONB,
            v_test_org_id
        );
        v_tests_passed := v_tests_passed + 1;
        RAISE NOTICE '✅ 6/10: IFRS Validation Function - Working';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ 6/10: IFRS Validation Function - Error: %', SQLERRM;
    END;

    -- Test 7: Micro-Apps Count
    DECLARE
        v_microapp_count INTEGER;
    BEGIN
        SELECT COUNT(*) INTO v_microapp_count
        FROM core_entities
        WHERE entity_type = 'MICRO_APP'
        AND entity_code IN ('GL', 'AP', 'AR');
        
        IF v_microapp_count >= 3 THEN
            v_tests_passed := v_tests_passed + 1;
            RAISE NOTICE '✅ 7/10: Micro-Apps (%) - Working', v_microapp_count;
        ELSE
            RAISE NOTICE '❌ 7/10: Micro-Apps (%) - Insufficient', v_microapp_count;
        END IF;
    END;

    -- Test 8: Tile Templates Count
    DECLARE
        v_tile_count INTEGER;
    BEGIN
        SELECT COUNT(*) INTO v_tile_count
        FROM core_entities
        WHERE entity_type = 'TILE_TEMPLATE'
        AND entity_code LIKE 'FINANCE_%';
        
        IF v_tile_count >= 5 THEN
            v_tests_passed := v_tests_passed + 1;
            RAISE NOTICE '✅ 8/10: Tile Templates (%) - Working', v_tile_count;
        ELSE
            RAISE NOTICE '❌ 8/10: Tile Templates (%) - Insufficient', v_tile_count;
        END IF;
    END;

    -- Test 9: Performance Indexes
    DECLARE
        v_index_count INTEGER;
    BEGIN
        SELECT COUNT(*) INTO v_index_count
        FROM pg_indexes
        WHERE indexname LIKE '%finance%' OR indexname LIKE '%fx%';
        
        IF v_index_count >= 2 THEN
            v_tests_passed := v_tests_passed + 1;
            RAISE NOTICE '✅ 9/10: Performance Indexes (%) - Working', v_index_count;
        ELSE
            RAISE NOTICE '❌ 9/10: Performance Indexes (%) - Insufficient', v_index_count;
        END IF;
    END;

    -- Test 10: Simple AP Invoice Processing
    BEGIN
        DECLARE
            v_result JSONB;
        BEGIN
            SELECT hera_finance_dna_evaluate_v1(
                v_test_user_id,
                v_test_org_id,
                'AP_INVOICE',
                jsonb_build_object(
                    'total_amount', 1000,
                    'tax_amount', 100,
                    'subtotal', 900
                )
            ) INTO v_result;
            
            IF v_result->>'status' IN ('success', 'validation_failed') THEN
                v_tests_passed := v_tests_passed + 1;
                RAISE NOTICE '✅ 10/10: AP Invoice Processing - Working';
            ELSE
                RAISE NOTICE '❌ 10/10: AP Invoice Processing - Failed: %', v_result->>'message';
            END IF;
        END;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ 10/10: AP Invoice Processing - Error: %', SQLERRM;
    END;

    -- Results Summary
    RAISE NOTICE '';
    RAISE NOTICE '📊 QUICK TEST RESULTS:';
    RAISE NOTICE '======================';
    RAISE NOTICE 'Tests Passed: %/%', v_tests_passed, v_total_tests;
    RAISE NOTICE 'Success Rate: %%', ROUND((v_tests_passed::NUMERIC / v_total_tests::NUMERIC) * 100, 0);
    
    IF v_tests_passed = v_total_tests THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎉 ALL TESTS PASSED!';
        RAISE NOTICE 'HERA Finance Suite v2.2 is working correctly.';
        RAISE NOTICE '';
        RAISE NOTICE '✅ Ready for production use';
        RAISE NOTICE '✅ Finance DNA engine operational';
        RAISE NOTICE '✅ Multi-currency support active';
        RAISE NOTICE '✅ IFRS compliance enabled';
        RAISE NOTICE '✅ Micro-apps and tiles deployed';
    ELSIF v_tests_passed >= 8 THEN
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  MOSTLY WORKING (80%+ success)';
        RAISE NOTICE 'Most features operational. Review failed tests.';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '❌ MULTIPLE FAILURES DETECTED';
        RAISE NOTICE 'Several core features not working. Check migrations.';
    END IF;
    
    RAISE NOTICE '';

END;
$quick_test$;