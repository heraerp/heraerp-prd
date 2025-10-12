-- ============================================================================
-- HERA Finance DNA V3.6: Workforce Optimization Suggestion Function
-- 
-- AI-powered workforce optimization suggestions including staffing changes,
-- cross-training recommendations, overtime reduction, and cost efficiency.
-- 
-- Smart Code: HERA.WORK.OPT.SUGGEST.V3
-- ============================================================================

CREATE OR REPLACE FUNCTION hera_work_opt_suggest_V3(
  p_org_id UUID,
  p_actor_id UUID,
  p_optimization_meta JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_run_id UUID := gen_random_uuid();
  v_start_time TIMESTAMP := CLOCK_TIMESTAMP();
  v_processing_time_ms INTEGER;
  
  -- Optimization parameters
  v_analysis_period TEXT;
  v_location_ids UUID[];
  v_objectives TEXT[]; -- cost_reduce, efficiency_improve, overtime_minimize, coverage_optimize
  v_constraints JSONB;
  v_current_baseline JSONB;
  
  -- Analysis data
  v_current_workforce JSONB := '[]';
  v_schedule_patterns JSONB := '[]';
  v_cost_analysis JSONB := '{}';
  v_efficiency_metrics JSONB := '{}';
  
  -- Suggestion generation
  v_optimization_suggestions JSONB := '[]';
  v_total_suggestions INTEGER := 0;
  v_potential_savings DECIMAL := 0;
  v_implementation_complexity INTEGER := 0;
  
  -- AI analysis results
  v_staffing_recommendations JSONB := '[]';
  v_cross_training_opportunities JSONB := '[]';
  v_overtime_reduction_strategies JSONB := '[]';
  v_schedule_optimizations JSONB := '[]';
  
  -- Processing counters
  v_employees_analyzed INTEGER := 0;
  v_schedules_analyzed INTEGER := 0;
  v_opportunities_identified INTEGER := 0;
  v_line_counter INTEGER := 1;
  
  -- Working variables
  v_employee_record RECORD;
  v_schedule_record RECORD;
  v_optimization_record RECORD;
BEGIN
  -- ==========================================================================
  -- 1. Parse Optimization Parameters and Validation
  -- ==========================================================================
  
  -- Extract optimization metadata
  v_analysis_period := COALESCE(p_optimization_meta->>'analysis_period', 
    TO_CHAR(CURRENT_DATE - INTERVAL '30 days', 'YYYY-MM'));
  
  -- Parse objectives
  SELECT array_agg(value) INTO v_objectives
  FROM jsonb_array_elements_text(COALESCE(p_optimization_meta->'objectives', 
    '["cost_reduce", "efficiency_improve"]'));
  
  -- Parse location filters
  SELECT array_agg((value)::UUID) INTO v_location_ids
  FROM jsonb_array_elements_text(COALESCE(p_optimization_meta->'location_ids', '[]'));
  
  v_constraints := COALESCE(p_optimization_meta->'constraints', jsonb_build_object(
    'max_staff_change_pct', 15,
    'min_coverage_hours', 40,
    'max_overtime_pct', 10,
    'preserve_core_team', true
  ));
  
  -- ==========================================================================
  -- 2. Create Optimization Suggestion Transaction
  -- ==========================================================================
  
  INSERT INTO universal_transactions (
    id, organization_id, transaction_type, transaction_code, 
    smart_code, total_amount, currency, status,
    metadata, created_at, posted_at
  ) VALUES (
    v_run_id, p_org_id, 'WORK_OPT_SUGGEST', 
    'WORK-OPT-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    'HERA.WORK.OPT.SUGGEST.V3',
    0, 'GBP', 'PROCESSING',
    jsonb_build_object(
      'analysis_period', v_analysis_period,
      'location_ids', v_location_ids,
      'objectives', v_objectives,
      'constraints', v_constraints,
      'actor_id', p_actor_id
    ),
    NOW(), NOW()
  );
  
  -- ==========================================================================
  -- 3. Analyze Current Workforce and Performance
  -- ==========================================================================
  
  -- Load current workforce data with performance metrics
  WITH workforce_analysis AS (
    SELECT 
      e.id as employee_id,
      e.entity_name as employee_name,
      e.entity_code as employee_code,
      COALESCE(hourly_rate.field_value_number, 15.00) as hourly_rate,
      COALESCE(contract_type.field_value_text, 'FULL_TIME') as contract_type,
      COALESCE(fte_pct.field_value_number, 100) as fte_pct,
      COALESCE(cost_center.field_value_text, 'OPERATIONS') as cost_center,
      
      -- Calculate recent performance metrics
      COALESCE(
        (SELECT AVG((utl.metadata->>'net_hours')::DECIMAL)
         FROM universal_transactions ut
         JOIN universal_transaction_lines utl ON utl.transaction_id = ut.id
         WHERE ut.organization_id = p_org_id
         AND ut.transaction_type = 'WORK_TIMESHEET_POST'
         AND (utl.metadata->>'employee_id')::UUID = e.id
         AND ut.created_at >= CURRENT_DATE - INTERVAL '30 days'
         AND utl.line_type = 'TIME_ENTRY'
        ), 0
      ) as avg_hours_per_week,
      
      COALESCE(
        (SELECT AVG((utl.metadata->>'overtime_hours')::DECIMAL)
         FROM universal_transactions ut
         JOIN universal_transaction_lines utl ON utl.transaction_id = ut.id
         WHERE ut.organization_id = p_org_id
         AND ut.transaction_type = 'WORK_TIMESHEET_POST'
         AND (utl.metadata->>'employee_id')::UUID = e.id
         AND ut.created_at >= CURRENT_DATE - INTERVAL '30 days'
         AND utl.line_type = 'TIME_ENTRY'
        ), 0
      ) as avg_overtime_hours,
      
      -- Skill analysis
      COALESCE(
        (SELECT jsonb_agg(jsonb_build_object(
          'skill_id', r.to_entity_id,
          'skill_name', skill_e.entity_name,
          'level', (r.metadata->>'level')::INTEGER
        ))
         FROM core_relationships r
         JOIN core_entities skill_e ON skill_e.id = r.to_entity_id
         WHERE r.from_entity_id = e.id
         AND r.relationship_type = 'EMPLOYEE_HAS_SKILL'
         AND skill_e.entity_type = 'SKILL'
        ), '[]'::JSONB
      ) as skills,
      
      -- Calculate utilization rate
      CASE 
        WHEN COALESCE(fte_pct.field_value_number, 100) > 0 
        THEN ROUND(
          (COALESCE(
            (SELECT AVG((utl.metadata->>'net_hours')::DECIMAL)
             FROM universal_transactions ut
             JOIN universal_transaction_lines utl ON utl.transaction_id = ut.id
             WHERE ut.organization_id = p_org_id
             AND ut.transaction_type = 'WORK_TIMESHEET_POST'
             AND (utl.metadata->>'employee_id')::UUID = e.id
             AND ut.created_at >= CURRENT_DATE - INTERVAL '30 days'
             AND utl.line_type = 'TIME_ENTRY'
            ), 0
          ) / ((fte_pct.field_value_number / 100) * 40)) * 100, 2
        )
        ELSE 0 
      END as utilization_rate_pct
      
    FROM core_entities e
    LEFT JOIN core_dynamic_data hourly_rate ON 
      hourly_rate.entity_id = e.id AND hourly_rate.field_name = 'hourly_rate'
    LEFT JOIN core_dynamic_data contract_type ON 
      contract_type.entity_id = e.id AND contract_type.field_name = 'contract_type'
    LEFT JOIN core_dynamic_data fte_pct ON 
      fte_pct.entity_id = e.id AND fte_pct.field_name = 'fte_pct'
    LEFT JOIN core_dynamic_data cost_center ON 
      cost_center.entity_id = e.id AND cost_center.field_name = 'cost_center'
    WHERE e.organization_id = p_org_id 
    AND e.entity_type = 'EMPLOYEE'
    AND e.status = 'ACTIVE'
    AND (cardinality(v_location_ids) = 0 OR 
         EXISTS (SELECT 1 FROM core_relationships r 
                 WHERE r.from_entity_id = e.id 
                 AND r.relationship_type = 'EMPLOYEE_ASSIGNED_TO_LOCATION'
                 AND r.to_entity_id = ANY(v_location_ids)))
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'employee_id', wa.employee_id,
      'employee_name', wa.employee_name,
      'employee_code', wa.employee_code,
      'hourly_rate', wa.hourly_rate,
      'contract_type', wa.contract_type,
      'fte_pct', wa.fte_pct,
      'cost_center', wa.cost_center,
      'avg_hours_per_week', wa.avg_hours_per_week,
      'avg_overtime_hours', wa.avg_overtime_hours,
      'utilization_rate_pct', wa.utilization_rate_pct,
      'skills', wa.skills
    )
  ) INTO v_current_workforce
  FROM workforce_analysis wa;
  
  v_employees_analyzed := jsonb_array_length(v_current_workforce);
  
  -- ==========================================================================
  -- 4. AI-Powered Optimization Analysis
  -- ==========================================================================
  
  -- Analyze staffing optimization opportunities
  FOR v_employee_record IN 
    SELECT 
      (emp->>'employee_id')::UUID as employee_id,
      emp->>'employee_name' as employee_name,
      (emp->>'hourly_rate')::DECIMAL as hourly_rate,
      emp->>'contract_type' as contract_type,
      (emp->>'avg_hours_per_week')::DECIMAL as avg_hours,
      (emp->>'avg_overtime_hours')::DECIMAL as overtime_hours,
      (emp->>'utilization_rate_pct')::DECIMAL as utilization_rate,
      emp->'skills' as skills
    FROM jsonb_array_elements(v_current_workforce) as emp
  LOOP
    
    -- Identify optimization opportunities for this employee
    DECLARE
      v_optimization_opportunity JSONB := '{}';
      v_opportunity_type TEXT;
      v_potential_impact DECIMAL := 0;
    BEGIN
      
      -- Check for overtime reduction opportunities
      IF v_employee_record.overtime_hours > 5 THEN
        v_optimization_opportunity := jsonb_build_object(
          'employee_id', v_employee_record.employee_id,
          'employee_name', v_employee_record.employee_name,
          'opportunity_type', 'OVERTIME_REDUCTION',
          'current_overtime_hours', v_employee_record.overtime_hours,
          'recommended_action', 'Redistribute workload or add staff support',
          'potential_savings_weekly', v_employee_record.overtime_hours * v_employee_record.hourly_rate * 0.5,
          'implementation_effort', 'MEDIUM',
          'confidence_score', 0.85
        );
        
        v_overtime_reduction_strategies := v_overtime_reduction_strategies || jsonb_build_array(v_optimization_opportunity);
        v_opportunities_identified := v_opportunities_identified + 1;
        v_potential_savings := v_potential_savings + (v_employee_record.overtime_hours * v_employee_record.hourly_rate * 0.5 * 52);
      END IF;
      
      -- Check for underutilization opportunities
      IF v_employee_record.utilization_rate < 70 AND v_employee_record.contract_type = 'FULL_TIME' THEN
        v_optimization_opportunity := jsonb_build_object(
          'employee_id', v_employee_record.employee_id,
          'employee_name', v_employee_record.employee_name,
          'opportunity_type', 'UTILIZATION_IMPROVEMENT',
          'current_utilization_pct', v_employee_record.utilization_rate,
          'target_utilization_pct', 85,
          'recommended_action', 'Increase responsibility or consider part-time conversion',
          'potential_savings_weekly', (85 - v_employee_record.utilization_rate) * v_employee_record.hourly_rate * 0.4,
          'implementation_effort', 'LOW',
          'confidence_score', 0.75
        );
        
        v_staffing_recommendations := v_staffing_recommendations || jsonb_build_array(v_optimization_opportunity);
        v_opportunities_identified := v_opportunities_identified + 1;
        v_potential_savings := v_potential_savings + ((85 - v_employee_record.utilization_rate) * v_employee_record.hourly_rate * 0.4 * 52);
      END IF;
      
      -- Check for cross-training opportunities based on skills
      IF jsonb_array_length(v_employee_record.skills) < 3 THEN
        v_optimization_opportunity := jsonb_build_object(
          'employee_id', v_employee_record.employee_id,
          'employee_name', v_employee_record.employee_name,
          'opportunity_type', 'CROSS_TRAINING',
          'current_skills_count', jsonb_array_length(v_employee_record.skills),
          'recommended_skills', jsonb_build_array('time_management', 'customer_service', 'quality_control'),
          'recommended_action', 'Enroll in skill development program',
          'potential_value_increase', v_employee_record.hourly_rate * 0.15,
          'implementation_effort', 'HIGH',
          'confidence_score', 0.60
        );
        
        v_cross_training_opportunities := v_cross_training_opportunities || jsonb_build_array(v_optimization_opportunity);
        v_opportunities_identified := v_opportunities_identified + 1;
      END IF;
      
    END;
  END LOOP;
  
  -- ==========================================================================
  -- 5. Generate Schedule Optimization Suggestions
  -- ==========================================================================
  
  -- Analyze schedule patterns for optimization
  WITH schedule_analysis AS (
    SELECT 
      (utl.metadata->>'template_name') as shift_template,
      (utl.metadata->>'date')::DATE as shift_date,
      COUNT(DISTINCT (utl.metadata->>'employee_id')::UUID) as employees_assigned,
      SUM((utl.metadata->>'shift_hours')::DECIMAL) as total_hours,
      AVG((utl.metadata->>'hourly_rate')::DECIMAL) as avg_hourly_rate,
      SUM((utl.metadata->>'total_cost')::DECIMAL) as total_cost
    FROM universal_transactions ut
    JOIN universal_transaction_lines utl ON utl.transaction_id = ut.id
    WHERE ut.organization_id = p_org_id
    AND ut.transaction_type = 'WORK_SCHEDULE_RUN'
    AND ut.status = 'COMPLETED'
    AND utl.line_type = 'SHIFT_ASSIGNMENT'
    AND ut.created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY (utl.metadata->>'template_name'), (utl.metadata->>'date')::DATE
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'shift_template', sa.shift_template,
      'avg_employees_per_shift', AVG(sa.employees_assigned),
      'avg_hours_per_shift', AVG(sa.total_hours),
      'avg_cost_per_shift', AVG(sa.total_cost),
      'optimization_potential', CASE 
        WHEN AVG(sa.employees_assigned) > 5 THEN 'HIGH'
        WHEN AVG(sa.total_cost) > 500 THEN 'MEDIUM'
        ELSE 'LOW'
      END
    )
  ) INTO v_schedule_patterns
  FROM schedule_analysis sa;
  
  v_schedules_analyzed := jsonb_array_length(v_schedule_patterns);
  
  -- Generate schedule optimization suggestions
  FOR v_schedule_record IN 
    SELECT 
      sched->>'shift_template' as template_name,
      (sched->>'avg_employees_per_shift')::DECIMAL as avg_employees,
      (sched->>'avg_cost_per_shift')::DECIMAL as avg_cost,
      sched->>'optimization_potential' as potential
    FROM jsonb_array_elements(v_schedule_patterns) as sched
    WHERE sched->>'optimization_potential' IN ('HIGH', 'MEDIUM')
  LOOP
    
    DECLARE
      v_schedule_optimization JSONB;
    BEGIN
      
      v_schedule_optimization := jsonb_build_object(
        'template_name', v_schedule_record.template_name,
        'opportunity_type', 'SCHEDULE_EFFICIENCY',
        'current_avg_employees', v_schedule_record.avg_employees,
        'current_avg_cost', v_schedule_record.avg_cost,
        'recommended_action', CASE 
          WHEN v_schedule_record.potential = 'HIGH' THEN 'Reduce staffing by 1-2 employees'
          ELSE 'Optimize shift timing and break schedules'
        END,
        'potential_savings_per_shift', CASE 
          WHEN v_schedule_record.potential = 'HIGH' THEN v_schedule_record.avg_cost * 0.20
          ELSE v_schedule_record.avg_cost * 0.10
        END,
        'implementation_effort', 'MEDIUM',
        'confidence_score', 0.70
      );
      
      v_schedule_optimizations := v_schedule_optimizations || jsonb_build_array(v_schedule_optimization);
      v_opportunities_identified := v_opportunities_identified + 1;
      
      v_potential_savings := v_potential_savings + (
        CASE 
          WHEN v_schedule_record.potential = 'HIGH' THEN v_schedule_record.avg_cost * 0.20 * 30 -- Monthly
          ELSE v_schedule_record.avg_cost * 0.10 * 30
        END
      );
      
    END;
  END LOOP;
  
  -- ==========================================================================
  -- 6. Consolidate and Rank Optimization Suggestions
  -- ==========================================================================
  
  -- Combine all suggestions with priority ranking
  v_optimization_suggestions := jsonb_build_array() || v_overtime_reduction_strategies || v_staffing_recommendations || v_cross_training_opportunities || v_schedule_optimizations;
  v_total_suggestions := jsonb_array_length(v_optimization_suggestions);
  
  -- Calculate implementation complexity (1-5 scale)
  v_implementation_complexity := CASE 
    WHEN v_total_suggestions <= 3 THEN 2
    WHEN v_total_suggestions <= 6 THEN 3
    WHEN v_total_suggestions <= 10 THEN 4
    ELSE 5
  END;
  
  -- Record optimization suggestions
  INSERT INTO universal_transaction_lines (
    id, transaction_id, organization_id, line_type, line_number,
    line_amount, metadata, smart_code
  ) VALUES (
    gen_random_uuid(), v_run_id, p_org_id, 'OPTIMIZATION_SUGGESTIONS', v_line_counter,
    v_potential_savings,
    jsonb_build_object(
      'analysis_period', v_analysis_period,
      'employees_analyzed', v_employees_analyzed,
      'schedules_analyzed', v_schedules_analyzed,
      'total_suggestions', v_total_suggestions,
      'opportunities_identified', v_opportunities_identified,
      'potential_annual_savings', v_potential_savings,
      'implementation_complexity', v_implementation_complexity,
      'optimization_categories', jsonb_build_object(
        'overtime_reduction', jsonb_array_length(v_overtime_reduction_strategies),
        'staffing_optimization', jsonb_array_length(v_staffing_recommendations),
        'cross_training', jsonb_array_length(v_cross_training_opportunities),
        'schedule_optimization', jsonb_array_length(v_schedule_optimizations)
      ),
      'all_suggestions', v_optimization_suggestions
    ),
    'HERA.WORK.OPT.SUGGESTIONS.V3'
  );
  
  -- ==========================================================================
  -- 7. Complete Transaction and Return Results
  -- ==========================================================================
  
  v_processing_time_ms := EXTRACT(EPOCH FROM (CLOCK_TIMESTAMP() - v_start_time)) * 1000;
  
  UPDATE universal_transactions 
  SET 
    status = 'COMPLETED',
    total_amount = v_potential_savings,
    metadata = metadata || jsonb_build_object(
      'optimization_results', jsonb_build_object(
        'employees_analyzed', v_employees_analyzed,
        'schedules_analyzed', v_schedules_analyzed,
        'total_suggestions', v_total_suggestions,
        'potential_annual_savings', v_potential_savings,
        'implementation_complexity', v_implementation_complexity
      ),
      'processing_time_ms', v_processing_time_ms,
      'completed_at', NOW()
    )
  WHERE id = v_run_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'optimization_run_id', v_run_id,
    'analysis_period', v_analysis_period,
    'organization_id', p_org_id,
    'processing_time_ms', v_processing_time_ms,
    'optimization_summary', jsonb_build_object(
      'employees_analyzed', v_employees_analyzed,
      'schedules_analyzed', v_schedules_analyzed,
      'total_suggestions', v_total_suggestions,
      'opportunities_identified', v_opportunities_identified,
      'potential_annual_savings', v_potential_savings,
      'implementation_complexity', v_implementation_complexity
    ),
    'suggestion_categories', jsonb_build_object(
      'overtime_reduction', v_overtime_reduction_strategies,
      'staffing_optimization', v_staffing_recommendations,
      'cross_training_opportunities', v_cross_training_opportunities,
      'schedule_optimizations', v_schedule_optimizations
    ),
    'top_recommendations', v_optimization_suggestions,
    'smart_code', 'HERA.WORK.OPT.SUGGEST.V3'
  );

EXCEPTION WHEN OTHERS THEN
  -- Update transaction status to failed
  UPDATE universal_transactions 
  SET 
    status = 'FAILED',
    metadata = metadata || jsonb_build_object(
      'error_message', SQLERRM,
      'error_code', SQLSTATE,
      'failed_at', NOW()
    )
  WHERE id = v_run_id;
  
  RETURN jsonb_build_object(
    'success', false,
    'error_code', 'WORKFORCE_OPTIMIZATION_FAILED',
    'error_message', SQLERRM,
    'optimization_run_id', v_run_id,
    'smart_code', 'HERA.WORK.OPT.SUGGEST.V3'
  );
END;
$$;

-- ============================================================================
-- Grants
-- ============================================================================

GRANT EXECUTE ON FUNCTION hera_work_opt_suggest_V3(UUID, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION hera_work_opt_suggest_V3(UUID, UUID, JSONB) TO service_role;

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON FUNCTION hera_work_opt_suggest_V3(UUID, UUID, JSONB) IS 'HERA Finance DNA V3.6: Workforce Optimization Suggestion function that analyzes current workforce performance and generates AI-powered recommendations for staffing changes, cross-training opportunities, overtime reduction, and schedule optimization with potential savings calculations.';