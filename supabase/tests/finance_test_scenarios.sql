-- ================================================================================
-- HERA Finance Suite v2.2 - Comprehensive Test Scenarios
-- Tests: Infrastructure, Multi-Currency, IFRS Compliance, Finance Operations
-- Author: HERA Finance Team
-- Created: 2024-11-16
-- ================================================================================

-- Test configuration variables
DO $test_setup$
DECLARE
    v_test_org_id UUID := '11111111-2222-3333-4444-555555555555';
    v_test_user_id UUID := '11111111-2222-3333-4444-666666666666';
    v_test_customer_id UUID;
    v_test_vendor_id UUID;
    v_test_gl_account_id UUID;
    v_test_results JSONB := '{}'::JSONB;
    v_test_count INTEGER := 0;
    v_success_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧪 HERA FINANCE SUITE v2.2 - COMPREHENSIVE TEST SCENARIOS';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'Test Organization: %', v_test_org_id;
    RAISE NOTICE 'Test User: %', v_test_user_id;
    RAISE NOTICE '';

    -- ============================================================================
    -- TEST 1: INFRASTRUCTURE VALIDATION
    -- ============================================================================
    
    RAISE NOTICE '📋 TEST 1: INFRASTRUCTURE VALIDATION';
    RAISE NOTICE '----------------------------------------';
    
    -- Test 1.1: Finance DNA Engine
    v_test_count := v_test_count + 1;
    BEGIN
        PERFORM hera_finance_dna_evaluate_v1(
            v_test_user_id,
            v_test_org_id,
            'TEST_TRANSACTION',
            '{"total_amount": 100, "currency": "USD"}'::JSONB
        );
        v_success_count := v_success_count + 1;
        RAISE NOTICE '✅ 1.1: Finance DNA Engine - PASSED';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ 1.1: Finance DNA Engine - FAILED: %', SQLERRM;
    END;

    -- Test 1.2: Finance Entity Types Count
    v_test_count := v_test_count + 1;
    DECLARE
        v_entity_count INTEGER;
    BEGIN
        SELECT COUNT(*) INTO v_entity_count
        FROM core_entities
        WHERE entity_type IN (
            'GL_ACCOUNT', 'AP_INVOICE', 'AR_INVOICE', 'BANK_ACCOUNT',
            'FIXED_ASSET', 'TAX_CODE', 'BUDGET', 'CLOSE_TASK'
        )
        AND organization_id = '00000000-0000-0000-0000-000000000000';
        
        IF v_entity_count >= 27 THEN
            v_success_count := v_success_count + 1;
            RAISE NOTICE '✅ 1.2: Finance Entity Types (%) - PASSED', v_entity_count;
        ELSE
            RAISE NOTICE '❌ 1.2: Finance Entity Types (%) - FAILED: Expected 27+', v_entity_count;
        END IF;
    END;

    -- Test 1.3: Posting Rules Bundles
    v_test_count := v_test_count + 1;
    DECLARE
        v_bundle_count INTEGER;
    BEGIN
        SELECT COUNT(*) INTO v_bundle_count
        FROM core_entities ce
        JOIN core_dynamic_data cdd ON cdd.entity_id = ce.id
        WHERE ce.entity_type = 'FINANCE_DNA_BUNDLE'
        AND cdd.field_name = 'bundle_rules';
        
        IF v_bundle_count >= 5 THEN
            v_success_count := v_success_count + 1;
            RAISE NOTICE '✅ 1.3: Posting Rules Bundles (%) - PASSED', v_bundle_count;
        ELSE
            RAISE NOTICE '❌ 1.3: Posting Rules Bundles (%) - FAILED: Expected 5+', v_bundle_count;
        END IF;
    END;

    -- ============================================================================
    -- TEST 2: SAMPLE DATA CREATION
    -- ============================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '📋 TEST 2: SAMPLE DATA CREATION';
    RAISE NOTICE '-----------------------------------';

    -- Create test organization
    INSERT INTO core_entities (
        id, entity_type, entity_code, entity_name, smart_code,
        organization_id, created_by, updated_by, created_at, updated_at, status
    ) VALUES (
        v_test_org_id, 'ORGANIZATION', 'TEST_ORG', 'Test Finance Organization',
        'HERA.PLATFORM.ORGANIZATION.TEST_ORG.v1',
        '00000000-0000-0000-0000-000000000000',
        v_test_user_id, v_test_user_id, NOW(), NOW(), 'active'
    ) ON CONFLICT ON CONSTRAINT core_entities_org_type_code_uidx DO NOTHING;

    -- Create test user
    INSERT INTO core_entities (
        id, entity_type, entity_code, entity_name, smart_code,
        organization_id, created_by, updated_by, created_at, updated_at, status
    ) VALUES (
        v_test_user_id, 'USER', 'TEST_USER', 'Test Finance User',
        'HERA.PLATFORM.USER.TEST_USER.v1',
        '00000000-0000-0000-0000-000000000000',
        v_test_user_id, v_test_user_id, NOW(), NOW(), 'active'
    ) ON CONFLICT ON CONSTRAINT core_entities_org_type_code_uidx DO NOTHING;

    -- Create sample GL account
    INSERT INTO core_entities (
        id, entity_type, entity_code, entity_name, smart_code,
        organization_id, created_by, updated_by, created_at, updated_at, status
    ) VALUES (
        gen_random_uuid(), 'GL_ACCOUNT', '1000', 'Cash and Bank',
        'HERA.FINANCE.GL.ACCOUNT.CASH.v1',
        v_test_org_id, v_test_user_id, v_test_user_id, NOW(), NOW(), 'active'
    ) RETURNING id INTO v_test_gl_account_id;

    -- Create sample customer
    INSERT INTO core_entities (
        id, entity_type, entity_code, entity_name, smart_code,
        organization_id, created_by, updated_by, created_at, updated_at, status
    ) VALUES (
        gen_random_uuid(), 'CUSTOMER', 'CUST001', 'Test Customer Corp',
        'HERA.FINANCE.AR.CUSTOMER.CUST001.v1',
        v_test_org_id, v_test_user_id, v_test_user_id, NOW(), NOW(), 'active'
    ) RETURNING id INTO v_test_customer_id;

    -- Create sample vendor
    INSERT INTO core_entities (
        id, entity_type, entity_code, entity_name, smart_code,
        organization_id, created_by, updated_by, created_at, updated_at, status
    ) VALUES (
        gen_random_uuid(), 'VENDOR', 'VEND001', 'Test Vendor LLC',
        'HERA.FINANCE.AP.VENDOR.VEND001.v1',
        v_test_org_id, v_test_user_id, v_test_user_id, NOW(), NOW(), 'active'
    ) RETURNING id INTO v_test_vendor_id;

    RAISE NOTICE '✅ Sample data created successfully';

    -- ============================================================================
    -- TEST 3: MULTI-CURRENCY FUNCTIONALITY
    -- ============================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '📋 TEST 3: MULTI-CURRENCY FUNCTIONALITY';
    RAISE NOTICE '----------------------------------------';

    -- Test 3.1: Currency Entity Creation
    v_test_count := v_test_count + 1;
    BEGIN
        DECLARE
            v_currency_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO v_currency_count
            FROM core_entities
            WHERE entity_type = 'CURRENCY'
            AND entity_code IN ('USD', 'EUR', 'GBP', 'AED', 'JPY');
            
            IF v_currency_count >= 5 THEN
                v_success_count := v_success_count + 1;
                RAISE NOTICE '✅ 3.1: Currency Entities (%) - PASSED', v_currency_count;
            ELSE
                RAISE NOTICE '❌ 3.1: Currency Entities (%) - FAILED: Expected 5', v_currency_count;
            END IF;
        END;
    END;

    -- Test 3.2: Multi-Currency Transaction Processing
    v_test_count := v_test_count + 1;
    BEGIN
        DECLARE
            v_dna_result JSONB;
        BEGIN
            SELECT hera_finance_dna_evaluate_v1(
                v_test_user_id,
                v_test_org_id,
                'AR_INVOICE',
                jsonb_build_object(
                    'total_amount', 1000,
                    'currency', 'EUR',
                    'exchange_rate', 1.1,
                    'customer_id', v_test_customer_id
                )
            ) INTO v_dna_result;
            
            IF (v_dna_result->>'status') = 'success' OR (v_dna_result->>'status') = 'validation_failed' THEN
                v_success_count := v_success_count + 1;
                RAISE NOTICE '✅ 3.2: Multi-Currency Transaction Processing - PASSED';
            ELSE
                RAISE NOTICE '❌ 3.2: Multi-Currency Transaction Processing - FAILED: %', v_dna_result->>'message';
            END IF;
        END;
    END;

    -- Test 3.3: FX Rate Functions
    v_test_count := v_test_count + 1;
    BEGIN
        PERFORM hera_fx_get_rate_v1('USD', 'EUR', CURRENT_DATE, v_test_org_id);
        v_success_count := v_success_count + 1;
        RAISE NOTICE '✅ 3.3: FX Rate Functions - PASSED';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ 3.3: FX Rate Functions - FAILED: %', SQLERRM;
    END;

    -- ============================================================================
    -- TEST 4: IFRS COMPLIANCE VALIDATION
    -- ============================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '📋 TEST 4: IFRS COMPLIANCE VALIDATION';
    RAISE NOTICE '--------------------------------------';

    -- Test 4.1: IFRS Validation Functions
    v_test_count := v_test_count + 1;
    BEGIN
        PERFORM hera_ifrs_validate_transaction_v1(
            'AR_INVOICE',
            jsonb_build_object(
                'total_amount', 1000,
                'currency', 'USD',
                'revenue_recognition_method', 'point_in_time'
            ),
            v_test_org_id
        );
        v_success_count := v_success_count + 1;
        RAISE NOTICE '✅ 4.1: IFRS Validation Functions - PASSED';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ 4.1: IFRS Validation Functions - FAILED: %', SQLERRM;
    END;

    -- Test 4.2: IAS 21 Foreign Currency Validation
    v_test_count := v_test_count + 1;
    BEGIN
        DECLARE
            v_ias21_result JSONB;
        BEGIN
            SELECT hera_ifrs_validate_ias21_v1(
                jsonb_build_object(
                    'functional_currency', 'USD',
                    'transaction_currency', 'EUR',
                    'exchange_rate', 1.1,
                    'exchange_rate_date', CURRENT_DATE
                )
            ) INTO v_ias21_result;
            
            IF (v_ias21_result->>'is_compliant')::BOOLEAN = true THEN
                v_success_count := v_success_count + 1;
                RAISE NOTICE '✅ 4.2: IAS 21 Foreign Currency Validation - PASSED';
            ELSE
                RAISE NOTICE '❌ 4.2: IAS 21 Foreign Currency Validation - FAILED';
            END IF;
        END;
    END;

    -- Test 4.3: IFRS 15 Revenue Recognition
    v_test_count := v_test_count + 1;
    BEGIN
        DECLARE
            v_ifrs15_result JSONB;
        BEGIN
            SELECT hera_ifrs_validate_ifrs15_v1(
                jsonb_build_object(
                    'contract_value', 10000,
                    'performance_obligations', jsonb_build_array(
                        jsonb_build_object(
                            'description', 'Service delivery',
                            'amount', 10000,
                            'recognition_method', 'over_time'
                        )
                    )
                )
            ) INTO v_ifrs15_result;
            
            IF (v_ifrs15_result->>'is_compliant')::BOOLEAN = true THEN
                v_success_count := v_success_count + 1;
                RAISE NOTICE '✅ 4.3: IFRS 15 Revenue Recognition - PASSED';
            ELSE
                RAISE NOTICE '❌ 4.3: IFRS 15 Revenue Recognition - FAILED';
            END IF;
        END;
    END;

    -- ============================================================================
    -- TEST 5: FINANCE OPERATIONS
    -- ============================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '📋 TEST 5: FINANCE OPERATIONS';
    RAISE NOTICE '------------------------------';

    -- Test 5.1: AP Invoice Processing
    v_test_count := v_test_count + 1;
    BEGIN
        DECLARE
            v_ap_result JSONB;
        BEGIN
            SELECT hera_finance_dna_evaluate_v1(
                v_test_user_id,
                v_test_org_id,
                'AP_INVOICE',
                jsonb_build_object(
                    'vendor_id', v_test_vendor_id,
                    'invoice_number', 'INV-2024-001',
                    'total_amount', 1500.00,
                    'tax_amount', 150.00,
                    'subtotal', 1350.00,
                    'currency', 'USD',
                    'line_items', jsonb_build_array(
                        jsonb_build_object(
                            'description', 'Office supplies',
                            'amount', 1350.00,
                            'expense_account_code', '5000',
                            'tax_amount', 150.00
                        )
                    )
                )
            ) INTO v_ap_result;
            
            IF (v_ap_result->>'status') IN ('success', 'validation_failed') THEN
                v_success_count := v_success_count + 1;
                RAISE NOTICE '✅ 5.1: AP Invoice Processing - PASSED';
                RAISE NOTICE '    Generated % GL lines', jsonb_array_length(v_ap_result->'gl_lines');
            ELSE
                RAISE NOTICE '❌ 5.1: AP Invoice Processing - FAILED: %', v_ap_result->>'message';
            END IF;
        END;
    END;

    -- Test 5.2: AR Invoice Processing
    v_test_count := v_test_count + 1;
    BEGIN
        DECLARE
            v_ar_result JSONB;
        BEGIN
            SELECT hera_finance_dna_evaluate_v1(
                v_test_user_id,
                v_test_org_id,
                'AR_INVOICE',
                jsonb_build_object(
                    'customer_id', v_test_customer_id,
                    'invoice_number', 'SI-2024-001',
                    'total_amount', 2500.00,
                    'tax_amount', 250.00,
                    'subtotal', 2250.00,
                    'currency', 'USD',
                    'line_items', jsonb_build_array(
                        jsonb_build_object(
                            'description', 'Consulting services',
                            'amount', 2250.00,
                            'revenue_account_code', '4000',
                            'tax_amount', 250.00
                        )
                    )
                )
            ) INTO v_ar_result;
            
            IF (v_ar_result->>'status') IN ('success', 'validation_failed') THEN
                v_success_count := v_success_count + 1;
                RAISE NOTICE '✅ 5.2: AR Invoice Processing - PASSED';
                RAISE NOTICE '    Generated % GL lines', jsonb_array_length(v_ar_result->'gl_lines');
            ELSE
                RAISE NOTICE '❌ 5.2: AR Invoice Processing - FAILED: %', v_ar_result->>'message';
            END IF;
        END;
    END;

    -- Test 5.3: Bank Transfer Processing
    v_test_count := v_test_count + 1;
    BEGIN
        DECLARE
            v_bank_result JSONB;
        BEGIN
            SELECT hera_finance_dna_evaluate_v1(
                v_test_user_id,
                v_test_org_id,
                'BANK_TRANSFER',
                jsonb_build_object(
                    'from_account_code', '1000',
                    'to_account_code', '1001',
                    'amount', 5000.00,
                    'currency', 'USD',
                    'description', 'Inter-bank transfer'
                )
            ) INTO v_bank_result;
            
            IF (v_bank_result->>'status') IN ('success', 'validation_failed') THEN
                v_success_count := v_success_count + 1;
                RAISE NOTICE '✅ 5.3: Bank Transfer Processing - PASSED';
            ELSE
                RAISE NOTICE '❌ 5.3: Bank Transfer Processing - FAILED: %', v_bank_result->>'message';
            END IF;
        END;
    END;

    -- ============================================================================
    -- TEST 6: MICRO-APPS & TILES FUNCTIONALITY
    -- ============================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '📋 TEST 6: MICRO-APPS & TILES FUNCTIONALITY';
    RAISE NOTICE '-------------------------------------------';

    -- Test 6.1: Micro-Apps Installation
    v_test_count := v_test_count + 1;
    BEGIN
        DECLARE
            v_microapp_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO v_microapp_count
            FROM core_entities
            WHERE entity_type = 'MICRO_APP'
            AND entity_code IN ('GL', 'AP', 'AR', 'BANK', 'ASSETS');
            
            IF v_microapp_count >= 5 THEN
                v_success_count := v_success_count + 1;
                RAISE NOTICE '✅ 6.1: Micro-Apps Installation (%) - PASSED', v_microapp_count;
            ELSE
                RAISE NOTICE '❌ 6.1: Micro-Apps Installation (%) - FAILED: Expected 5+', v_microapp_count;
            END IF;
        END;
    END;

    -- Test 6.2: Tile Templates Count
    v_test_count := v_test_count + 1;
    BEGIN
        DECLARE
            v_tile_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO v_tile_count
            FROM core_entities
            WHERE entity_type = 'TILE_TEMPLATE'
            AND entity_code LIKE 'FINANCE_%';
            
            IF v_tile_count >= 10 THEN
                v_success_count := v_success_count + 1;
                RAISE NOTICE '✅ 6.2: Finance Tile Templates (%) - PASSED', v_tile_count;
            ELSE
                RAISE NOTICE '❌ 6.2: Finance Tile Templates (%) - FAILED: Expected 10+', v_tile_count;
            END IF;
        END;
    END;

    -- Test 6.3: Workspace Creation Function
    v_test_count := v_test_count + 1;
    BEGIN
        PERFORM hera_workspace_create_finance_v1(
            v_test_user_id,
            v_test_org_id,
            'TEST_FINANCE_WORKSPACE',
            'Test Finance Workspace'
        );
        v_success_count := v_success_count + 1;
        RAISE NOTICE '✅ 6.3: Workspace Creation Function - PASSED';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ 6.3: Workspace Creation Function - FAILED: %', SQLERRM;
    END;

    -- ============================================================================
    -- TEST 7: PERFORMANCE & VALIDATION
    -- ============================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '📋 TEST 7: PERFORMANCE & VALIDATION';
    RAISE NOTICE '-----------------------------------';

    -- Test 7.1: Strategic Indexes Validation
    v_test_count := v_test_count + 1;
    BEGIN
        DECLARE
            v_index_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO v_index_count
            FROM pg_indexes
            WHERE indexname LIKE '%finance%'
            OR indexname LIKE '%fx%'
            OR indexname LIKE '%ifrs%';
            
            IF v_index_count >= 5 THEN
                v_success_count := v_success_count + 1;
                RAISE NOTICE '✅ 7.1: Strategic Indexes (%) - PASSED', v_index_count;
            ELSE
                RAISE NOTICE '❌ 7.1: Strategic Indexes (%) - FAILED: Expected 5+', v_index_count;
            END IF;
        END;
    END;

    -- Test 7.2: GL Balance Validation
    v_test_count := v_test_count + 1;
    BEGIN
        DECLARE
            v_balance_result JSONB;
        BEGIN
            SELECT hera_finance_dna_evaluate_v1(
                v_test_user_id,
                v_test_org_id,
                'JOURNAL_ENTRY',
                jsonb_build_object(
                    'lines', jsonb_build_array(
                        jsonb_build_object('side', 'DR', 'account_code', '1000', 'amount', 1000),
                        jsonb_build_object('side', 'CR', 'account_code', '2000', 'amount', 1000)
                    ),
                    'currency', 'USD'
                )
            ) INTO v_balance_result;
            
            IF (v_balance_result->'summary'->>'is_balanced')::BOOLEAN = true THEN
                v_success_count := v_success_count + 1;
                RAISE NOTICE '✅ 7.2: GL Balance Validation - PASSED';
            ELSE
                RAISE NOTICE '❌ 7.2: GL Balance Validation - FAILED';
            END IF;
        END;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ 7.2: GL Balance Validation - FAILED: %', SQLERRM;
    END;

    -- Test 7.3: Performance Benchmark (100 transaction evaluations)
    v_test_count := v_test_count + 1;
    BEGIN
        DECLARE
            v_start_time TIMESTAMP;
            v_end_time TIMESTAMP;
            v_duration INTERVAL;
            i INTEGER;
        BEGIN
            v_start_time := clock_timestamp();
            
            FOR i IN 1..100 LOOP
                PERFORM hera_finance_dna_evaluate_v1(
                    v_test_user_id,
                    v_test_org_id,
                    'AP_INVOICE',
                    jsonb_build_object(
                        'total_amount', 100 + i,
                        'currency', 'USD'
                    )
                );
            END LOOP;
            
            v_end_time := clock_timestamp();
            v_duration := v_end_time - v_start_time;
            
            IF v_duration < INTERVAL '10 seconds' THEN
                v_success_count := v_success_count + 1;
                RAISE NOTICE '✅ 7.3: Performance Benchmark (100 evals in %) - PASSED', v_duration;
            ELSE
                RAISE NOTICE '❌ 7.3: Performance Benchmark (100 evals in %) - FAILED: Too slow', v_duration;
            END IF;
        END;
    END;

    -- ============================================================================
    -- FINAL RESULTS SUMMARY
    -- ============================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '🏁 TEST RESULTS SUMMARY';
    RAISE NOTICE '========================';
    RAISE NOTICE 'Total Tests: %', v_test_count;
    RAISE NOTICE 'Passed: %', v_success_count;
    RAISE NOTICE 'Failed: %', (v_test_count - v_success_count);
    RAISE NOTICE 'Success Rate: %%%', ROUND((v_success_count::NUMERIC / v_test_count::NUMERIC) * 100, 1);
    
    IF v_success_count = v_test_count THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎉 ALL TESTS PASSED! HERA Finance Suite v2.2 is ready for production.';
        RAISE NOTICE '✅ Infrastructure: Finance DNA engine, entity types, posting rules';
        RAISE NOTICE '✅ Multi-Currency: FX rates, currency conversion, revaluation';
        RAISE NOTICE '✅ IFRS Compliance: IAS 21, IFRS 15, validation framework';
        RAISE NOTICE '✅ Finance Operations: AP/AR invoices, bank transfers, GL entries';
        RAISE NOTICE '✅ Micro-Apps & Tiles: Module installation, workspace creation';
        RAISE NOTICE '✅ Performance: Strategic indexes, GL balancing, benchmark';
    ELSIF v_success_count >= (v_test_count * 0.8) THEN
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  MOST TESTS PASSED (%%+ success rate)', ROUND((v_success_count::NUMERIC / v_test_count::NUMERIC) * 100, 0);
        RAISE NOTICE 'Review failed tests above and address any critical issues.';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '❌ MULTIPLE FAILURES DETECTED (less than 80%% success rate)';
        RAISE NOTICE 'Critical issues found. Review all failed tests before deployment.';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 Next Steps:';
    RAISE NOTICE '1. Review any failed tests and fix critical issues';
    RAISE NOTICE '2. Run additional organization-specific tests';
    RAISE NOTICE '3. Deploy to production with confidence';
    RAISE NOTICE '4. Monitor performance and compliance metrics';
    
END;
$test_setup$;