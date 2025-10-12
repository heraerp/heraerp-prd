-- ============================================================================
-- HERA Finance DNA V3.6: Workforce Roster Management View
-- 
-- Comprehensive workforce roster view providing real-time employee scheduling,
-- availability tracking, skill matching, and roster optimization analytics.
-- 
-- Smart Code: HERA.WORK.ROSTER.MANAGEMENT.V3
-- ============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS vw_work_roster_v3 CASCADE;

-- Create workforce roster management view
CREATE VIEW vw_work_roster_v3 AS
WITH employee_base AS (
  -- Employee master data with comprehensive attributes
  SELECT 
    e.organization_id,
    e.id as employee_id,
    e.entity_name as employee_name,
    e.entity_code as employee_code,
    e.status as employee_status,
    e.created_at as employee_hired_date,
    
    -- Employment details
    COALESCE(hourly_rate.field_value_number, 15.00) as hourly_rate,
    COALESCE(contract_type.field_value_text, 'FULL_TIME') as contract_type,
    COALESCE(fte_pct.field_value_number, 100) as fte_percentage,
    COALESCE(cost_center.field_value_text, 'OPERATIONS') as cost_center,
    COALESCE(department.field_value_text, 'GENERAL') as department,
    COALESCE(location.field_value_text, 'MAIN') as primary_location,
    COALESCE(job_title.field_value_text, 'Staff Member') as job_title,
    COALESCE(seniority.field_value_number, 0) as seniority_years,
    
    -- Contact and personal information
    COALESCE(email.field_value_text, '') as email_address,
    COALESCE(phone.field_value_text, '') as phone_number,
    COALESCE(emergency_contact.field_value_text, '') as emergency_contact,
    COALESCE(languages.field_value_text, 'EN') as languages_spoken,
    
    -- Availability and constraints
    COALESCE(availability.field_value_json, '{}') as availability_pattern,
    COALESCE(max_hours_week.field_value_number, 40) as max_hours_per_week,
    COALESCE(min_hours_week.field_value_number, 0) as min_hours_per_week,
    COALESCE(overtime_eligible.field_value_boolean, true) as overtime_eligible,
    COALESCE(weekend_work.field_value_boolean, true) as weekend_available,
    COALESCE(night_shift.field_value_boolean, false) as night_shift_eligible,
    
    -- Performance and ratings
    COALESCE(performance_rating.field_value_number, 3.0) as performance_rating,
    COALESCE(reliability_score.field_value_number, 100) as reliability_score,
    COALESCE(training_status.field_value_text, 'COMPLETE') as training_status,
    COALESCE(certification_expires.field_value_date, '2099-12-31') as certification_expiry,
    
    -- Preferences and notes
    COALESCE(shift_preference.field_value_text, 'ANY') as shift_preference,
    COALESCE(work_notes.field_value_text, '') as special_notes
    
  FROM core_entities e
  LEFT JOIN core_dynamic_data hourly_rate ON 
    hourly_rate.entity_id = e.id AND hourly_rate.field_name = 'hourly_rate'
  LEFT JOIN core_dynamic_data contract_type ON 
    contract_type.entity_id = e.id AND contract_type.field_name = 'contract_type'
  LEFT JOIN core_dynamic_data fte_pct ON 
    fte_pct.entity_id = e.id AND fte_pct.field_name = 'fte_pct'
  LEFT JOIN core_dynamic_data cost_center ON 
    cost_center.entity_id = e.id AND cost_center.field_name = 'cost_center'
  LEFT JOIN core_dynamic_data department ON 
    department.entity_id = e.id AND department.field_name = 'department'
  LEFT JOIN core_dynamic_data location ON 
    location.entity_id = e.id AND location.field_name = 'location'
  LEFT JOIN core_dynamic_data job_title ON 
    job_title.entity_id = e.id AND job_title.field_name = 'job_title'
  LEFT JOIN core_dynamic_data seniority ON 
    seniority.entity_id = e.id AND seniority.field_name = 'seniority'
  LEFT JOIN core_dynamic_data email ON 
    email.entity_id = e.id AND email.field_name = 'email'
  LEFT JOIN core_dynamic_data phone ON 
    phone.entity_id = e.id AND phone.field_name = 'phone'
  LEFT JOIN core_dynamic_data emergency_contact ON 
    emergency_contact.entity_id = e.id AND emergency_contact.field_name = 'emergency_contact'
  LEFT JOIN core_dynamic_data languages ON 
    languages.entity_id = e.id AND languages.field_name = 'languages'
  LEFT JOIN core_dynamic_data availability ON 
    availability.entity_id = e.id AND availability.field_name = 'availability'
  LEFT JOIN core_dynamic_data max_hours_week ON 
    max_hours_week.entity_id = e.id AND max_hours_week.field_name = 'max_hours_week'
  LEFT JOIN core_dynamic_data min_hours_week ON 
    min_hours_week.entity_id = e.id AND min_hours_week.field_name = 'min_hours_week'
  LEFT JOIN core_dynamic_data overtime_eligible ON 
    overtime_eligible.entity_id = e.id AND overtime_eligible.field_name = 'overtime_eligible'
  LEFT JOIN core_dynamic_data weekend_work ON 
    weekend_work.entity_id = e.id AND weekend_work.field_name = 'weekend_work'
  LEFT JOIN core_dynamic_data night_shift ON 
    night_shift.entity_id = e.id AND night_shift.field_name = 'night_shift'
  LEFT JOIN core_dynamic_data performance_rating ON 
    performance_rating.entity_id = e.id AND performance_rating.field_name = 'performance_rating'
  LEFT JOIN core_dynamic_data reliability_score ON 
    reliability_score.entity_id = e.id AND reliability_score.field_name = 'reliability_score'
  LEFT JOIN core_dynamic_data training_status ON 
    training_status.entity_id = e.id AND training_status.field_name = 'training_status'
  LEFT JOIN core_dynamic_data certification_expires ON 
    certification_expires.entity_id = e.id AND certification_expires.field_name = 'certification_expires'
  LEFT JOIN core_dynamic_data shift_preference ON 
    shift_preference.entity_id = e.id AND shift_preference.field_name = 'shift_preference'
  LEFT JOIN core_dynamic_data work_notes ON 
    work_notes.entity_id = e.id AND work_notes.field_name = 'work_notes'
  WHERE e.entity_type = 'EMPLOYEE'
),
employee_skills AS (
  -- Employee skills and competencies
  SELECT 
    eb.employee_id,
    jsonb_agg(
      jsonb_build_object(
        'skill_id', r.to_entity_id,
        'skill_name', skill_e.entity_name,
        'skill_code', skill_e.entity_code,
        'skill_category', COALESCE(skill_category.field_value_text, 'GENERAL'),
        'proficiency_level', COALESCE((r.metadata->>'level')::INTEGER, 1),
        'certified', COALESCE((r.metadata->>'certified')::BOOLEAN, false),
        'certification_date', r.metadata->>'certification_date',
        'last_used_date', r.metadata->>'last_used_date',
        'years_experience', COALESCE((r.metadata->>'years_experience')::DECIMAL, 0)
      ) ORDER BY COALESCE((r.metadata->>'level')::INTEGER, 1) DESC
    ) as skills_detail,
    
    COUNT(*) as total_skills,
    AVG(COALESCE((r.metadata->>'level')::INTEGER, 1)) as avg_skill_level,
    COUNT(CASE WHEN COALESCE((r.metadata->>'certified')::BOOLEAN, false) THEN 1 END) as certified_skills_count
    
  FROM employee_base eb
  JOIN core_relationships r ON r.from_entity_id = eb.employee_id
  JOIN core_entities skill_e ON skill_e.id = r.to_entity_id
  LEFT JOIN core_dynamic_data skill_category ON 
    skill_category.entity_id = skill_e.id AND skill_category.field_name = 'category'
  WHERE r.relationship_type = 'EMPLOYEE_HAS_SKILL'
  AND skill_e.entity_type = 'SKILL'
  GROUP BY eb.employee_id
),
current_assignments AS (
  -- Current schedule assignments (next 7 days)
  SELECT 
    (utl.metadata->>'employee_id')::UUID as employee_id,
    COUNT(*) as upcoming_shifts,
    SUM((utl.metadata->>'shift_hours')::DECIMAL) as upcoming_hours,
    MIN(DATE(utl.metadata->>'date')) as next_shift_date,
    MAX(DATE(utl.metadata->>'date')) as last_shift_date,
    
    jsonb_agg(
      jsonb_build_object(
        'date', utl.metadata->>'date',
        'start_time', utl.metadata->>'start_time',
        'end_time', utl.metadata->>'end_time',
        'hours', utl.metadata->>'shift_hours',
        'template', utl.metadata->>'template_name',
        'role', utl.metadata->>'role_required',
        'location', COALESCE(utl.metadata->>'location', 'MAIN')
      ) ORDER BY DATE(utl.metadata->>'date')
    ) as upcoming_schedule
    
  FROM universal_transactions ut
  JOIN universal_transaction_lines utl ON utl.transaction_id = ut.id
  WHERE ut.transaction_type = 'WORK_SCHEDULE_RUN'
  AND utl.line_type = 'SHIFT_ASSIGNMENT'
  AND ut.status = 'COMPLETED'
  AND DATE(utl.metadata->>'date') >= CURRENT_DATE
  AND DATE(utl.metadata->>'date') <= CURRENT_DATE + INTERVAL '7 days'
  GROUP BY (utl.metadata->>'employee_id')::UUID
),
recent_performance AS (
  -- Recent performance metrics (last 30 days)
  SELECT 
    (ut.metadata->>'employee_id')::UUID as employee_id,
    COUNT(*) as timesheet_entries,
    AVG((utl.metadata->>'net_hours')::DECIMAL) as avg_daily_hours,
    SUM((utl.metadata->>'net_hours')::DECIMAL) as total_hours_30d,
    SUM((utl.metadata->>'overtime_hours')::DECIMAL) as total_overtime_30d,
    AVG(COALESCE((utl.metadata->>'productivity_score')::DECIMAL, 100)) as avg_productivity,
    AVG(COALESCE((utl.metadata->>'quality_score')::DECIMAL, 100)) as avg_quality,
    
    -- Attendance reliability
    COUNT(CASE 
      WHEN (utl.metadata->>'net_hours')::DECIMAL >= 
           COALESCE((utl.metadata->>'scheduled_hours')::DECIMAL, 8) * 0.9 
      THEN 1 
    END) as on_time_days,
    
    -- Schedule adherence
    AVG(
      CASE 
        WHEN COALESCE((utl.metadata->>'scheduled_hours')::DECIMAL, 0) > 0 
        THEN ((utl.metadata->>'net_hours')::DECIMAL / (utl.metadata->>'scheduled_hours')::DECIMAL) * 100
        ELSE 100 
      END
    ) as schedule_adherence_pct
    
  FROM universal_transactions ut
  JOIN universal_transaction_lines utl ON utl.transaction_id = ut.id
  WHERE ut.transaction_type = 'WORK_TIMESHEET_POST'
  AND utl.line_type = 'TIME_ENTRY'
  AND ut.status IN ('COMPLETED', 'COMPLIANCE_REVIEW')
  AND ut.created_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY (ut.metadata->>'employee_id')::UUID
),
time_off_requests AS (
  -- Time off and availability adjustments
  SELECT 
    (r.metadata->>'employee_id')::UUID as employee_id,
    COUNT(*) as active_time_off_requests,
    MIN(DATE(r.metadata->>'start_date')) as next_time_off_start,
    MAX(DATE(r.metadata->>'end_date')) as latest_time_off_end,
    
    jsonb_agg(
      jsonb_build_object(
        'type', r.metadata->>'time_off_type',
        'start_date', r.metadata->>'start_date',
        'end_date', r.metadata->>'end_date',
        'status', r.metadata->>'approval_status',
        'reason', r.metadata->>'reason'
      ) ORDER BY DATE(r.metadata->>'start_date')
    ) as time_off_detail
    
  FROM core_relationships r
  WHERE r.relationship_type = 'EMPLOYEE_TIME_OFF_REQUEST'
  AND DATE(r.metadata->>'end_date') >= CURRENT_DATE
  AND r.metadata->>'approval_status' IN ('APPROVED', 'PENDING')
  GROUP BY (r.metadata->>'employee_id')::UUID
),
roster_availability AS (
  -- Calculate availability scores for upcoming scheduling
  SELECT 
    eb.employee_id,
    
    -- Base availability calculation
    CASE 
      WHEN eb.employee_status = 'ACTIVE' AND eb.training_status = 'COMPLETE' 
      AND eb.certification_expiry > CURRENT_DATE THEN 100
      WHEN eb.employee_status = 'ACTIVE' AND eb.training_status != 'COMPLETE' THEN 75
      WHEN eb.employee_status = 'ON_LEAVE' THEN 0
      ELSE 50
    END as base_availability_score,
    
    -- Skill availability (based on skill count and levels)
    LEAST(100, ROUND(
      (COALESCE(es.total_skills, 0) * 10) + 
      (COALESCE(es.avg_skill_level, 1) * 15) +
      (COALESCE(es.certified_skills_count, 0) * 20)
    )) as skill_availability_score,
    
    -- Performance availability (based on recent performance)
    LEAST(100, ROUND(
      (COALESCE(rp.avg_productivity, 100) * 0.4) +
      (COALESCE(rp.avg_quality, 100) * 0.3) +
      (COALESCE(rp.schedule_adherence_pct, 100) * 0.3)
    )) as performance_availability_score,
    
    -- Workload availability (based on current assignments)
    CASE 
      WHEN COALESCE(ca.upcoming_hours, 0) = 0 THEN 100
      WHEN COALESCE(ca.upcoming_hours, 0) < eb.max_hours_per_week * 0.5 THEN 80
      WHEN COALESCE(ca.upcoming_hours, 0) < eb.max_hours_per_week * 0.8 THEN 60
      WHEN COALESCE(ca.upcoming_hours, 0) < eb.max_hours_per_week THEN 40
      ELSE 20
    END as workload_availability_score,
    
    -- Time off impact
    CASE 
      WHEN tor.active_time_off_requests > 0 THEN 0
      ELSE 100
    END as time_off_availability_score
    
  FROM employee_base eb
  LEFT JOIN employee_skills es ON es.employee_id = eb.employee_id
  LEFT JOIN recent_performance rp ON rp.employee_id = eb.employee_id
  LEFT JOIN current_assignments ca ON ca.employee_id = eb.employee_id
  LEFT JOIN time_off_requests tor ON tor.employee_id = eb.employee_id
)
SELECT 
  -- Employee identification
  eb.organization_id,
  eb.employee_id,
  eb.employee_name,
  eb.employee_code,
  eb.employee_status,
  eb.employee_hired_date,
  
  -- Employment details
  eb.hourly_rate,
  eb.contract_type,
  eb.fte_percentage,
  eb.cost_center,
  eb.department,
  eb.primary_location,
  eb.job_title,
  eb.seniority_years,
  
  -- Contact information
  eb.email_address,
  eb.phone_number,
  eb.emergency_contact,
  eb.languages_spoken,
  
  -- Work constraints and preferences
  eb.availability_pattern,
  eb.max_hours_per_week,
  eb.min_hours_per_week,
  eb.overtime_eligible,
  eb.weekend_available,
  eb.night_shift_eligible,
  eb.shift_preference,
  eb.special_notes,
  
  -- Performance and ratings
  eb.performance_rating,
  eb.reliability_score,
  eb.training_status,
  eb.certification_expiry,
  
  -- Skills summary
  COALESCE(es.total_skills, 0) as total_skills,
  COALESCE(es.avg_skill_level, 0) as avg_skill_level,
  COALESCE(es.certified_skills_count, 0) as certified_skills_count,
  COALESCE(es.skills_detail, '[]'::JSONB) as skills_detail,
  
  -- Current schedule information
  COALESCE(ca.upcoming_shifts, 0) as upcoming_shifts_7d,
  COALESCE(ca.upcoming_hours, 0) as upcoming_hours_7d,
  ca.next_shift_date,
  ca.last_shift_date,
  COALESCE(ca.upcoming_schedule, '[]'::JSONB) as upcoming_schedule_detail,
  
  -- Recent performance (30 days)
  COALESCE(rp.timesheet_entries, 0) as timesheet_entries_30d,
  COALESCE(rp.total_hours_30d, 0) as total_hours_30d,
  COALESCE(rp.total_overtime_30d, 0) as total_overtime_30d,
  COALESCE(rp.avg_productivity, 100) as avg_productivity_30d,
  COALESCE(rp.avg_quality, 100) as avg_quality_30d,
  COALESCE(rp.schedule_adherence_pct, 100) as schedule_adherence_pct_30d,
  ROUND(COALESCE(rp.on_time_days::DECIMAL / NULLIF(rp.timesheet_entries, 0), 1) * 100, 1) as attendance_reliability_pct,
  
  -- Time off information
  COALESCE(tor.active_time_off_requests, 0) as active_time_off_requests,
  tor.next_time_off_start,
  tor.latest_time_off_end,
  COALESCE(tor.time_off_detail, '[]'::JSONB) as time_off_detail,
  
  -- Availability scoring
  ra.base_availability_score,
  ra.skill_availability_score,
  ra.performance_availability_score,
  ra.workload_availability_score,
  ra.time_off_availability_score,
  
  -- Overall availability score (weighted average)
  ROUND(
    (ra.base_availability_score * 0.25) +
    (ra.skill_availability_score * 0.20) +
    (ra.performance_availability_score * 0.25) +
    (ra.workload_availability_score * 0.20) +
    (ra.time_off_availability_score * 0.10)
  ) as overall_availability_score,
  
  -- Derived status indicators
  CASE 
    WHEN eb.employee_status != 'ACTIVE' THEN 'UNAVAILABLE'
    WHEN tor.active_time_off_requests > 0 THEN 'ON_LEAVE'
    WHEN ca.upcoming_hours >= eb.max_hours_per_week * 0.9 THEN 'FULLY_SCHEDULED'
    WHEN ca.upcoming_hours >= eb.max_hours_per_week * 0.7 THEN 'MOSTLY_SCHEDULED'
    WHEN ca.upcoming_hours > 0 THEN 'PARTIALLY_SCHEDULED'
    ELSE 'AVAILABLE'
  END as current_availability_status,
  
  -- Risk indicators
  CASE 
    WHEN eb.certification_expiry <= CURRENT_DATE + INTERVAL '30 days' THEN 'CERTIFICATION_EXPIRING'
    WHEN rp.schedule_adherence_pct < 80 THEN 'ATTENDANCE_RISK'
    WHEN rp.avg_productivity < 70 THEN 'PERFORMANCE_RISK'
    WHEN ca.upcoming_hours > eb.max_hours_per_week THEN 'OVERBOOKED'
    ELSE 'NORMAL'
  END as risk_indicator,
  
  -- Utilization metrics
  CASE 
    WHEN eb.max_hours_per_week > 0 
    THEN ROUND((ca.upcoming_hours / eb.max_hours_per_week) * 100, 1)
    ELSE 0 
  END as weekly_utilization_pct,
  
  CASE 
    WHEN rp.total_hours_30d > 0 AND eb.max_hours_per_week > 0
    THEN ROUND((rp.total_hours_30d / (eb.max_hours_per_week * 4.33)) * 100, 1)
    ELSE 0 
  END as monthly_utilization_pct,
  
  -- Cost effectiveness
  CASE 
    WHEN rp.avg_productivity > 0 
    THEN ROUND(eb.hourly_rate / (rp.avg_productivity / 100), 2)
    ELSE eb.hourly_rate 
  END as effective_hourly_cost,
  
  -- Audit and control
  CURRENT_TIMESTAMP as roster_generated_at,
  'HERA.WORK.ROSTER.MANAGEMENT.V3' as smart_code

FROM employee_base eb
LEFT JOIN employee_skills es ON es.employee_id = eb.employee_id
LEFT JOIN current_assignments ca ON ca.employee_id = eb.employee_id
LEFT JOIN recent_performance rp ON rp.employee_id = eb.employee_id
LEFT JOIN time_off_requests tor ON tor.employee_id = eb.employee_id
LEFT JOIN roster_availability ra ON ra.employee_id = eb.employee_id

ORDER BY 
  eb.organization_id,
  overall_availability_score DESC,
  eb.seniority_years DESC,
  eb.employee_name;

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Primary roster management index
CREATE INDEX idx_vw_work_roster_v3_primary 
ON vw_work_roster_v3 (organization_id, current_availability_status, overall_availability_score DESC);

-- Skill-based scheduling index
CREATE INDEX idx_vw_work_roster_v3_skills 
ON vw_work_roster_v3 (organization_id, total_skills DESC, avg_skill_level DESC, certified_skills_count DESC);

-- Availability and scheduling index
CREATE INDEX idx_vw_work_roster_v3_availability 
ON vw_work_roster_v3 (organization_id, employee_status, time_off_availability_score, workload_availability_score);

-- Performance and reliability index
CREATE INDEX idx_vw_work_roster_v3_performance 
ON vw_work_roster_v3 (organization_id, performance_availability_score DESC, schedule_adherence_pct_30d DESC);

-- Cost and utilization index
CREATE INDEX idx_vw_work_roster_v3_cost 
ON vw_work_roster_v3 (organization_id, effective_hourly_cost, weekly_utilization_pct DESC);

-- Risk management index
CREATE INDEX idx_vw_work_roster_v3_risk 
ON vw_work_roster_v3 (organization_id, risk_indicator, certification_expiry);

-- Department and location index
CREATE INDEX idx_vw_work_roster_v3_dept_location 
ON vw_work_roster_v3 (organization_id, department, primary_location, current_availability_status);

-- ============================================================================
-- Grants
-- ============================================================================

GRANT SELECT ON vw_work_roster_v3 TO authenticated;
GRANT SELECT ON vw_work_roster_v3 TO service_role;

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON VIEW vw_work_roster_v3 IS 'HERA Finance DNA V3.6: Comprehensive workforce roster management view providing real-time employee scheduling, availability tracking, skill matching, performance analytics, and optimization scoring for AI-powered workforce planning and roster management.';