-- =============================================
-- HERA HCM (Human Capital Management) SMART CODES v1
-- Complete HR operations on 6 universal tables
-- Replaces Workday's 500+ tables with 95% cost savings
-- =============================================

-- Smart Code Registry for Human Capital Management
-- Following HERA DNA pattern: HERA.{MODULE}.{FUNCTION}.{OPERATION}.v{VERSION}

-- =============================================
-- EMPLOYEE MANAGEMENT
-- =============================================

-- Employee Master Data
INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.HCM.EMP.MASTER.v1', 'Employee master record', 'HCM', 
  '{"entity_type": "employee", "fields": ["employee_id", "hire_date", "department", "job_title", "reports_to"]}'),
('HERA.HCM.EMP.PERSONAL.v1', 'Employee personal information', 'HCM',
  '{"entity_type": "employee", "fields": ["date_of_birth", "gender", "nationality", "marital_status", "emergency_contact"]}'),
('HERA.HCM.EMP.CONTACT.v1', 'Employee contact details', 'HCM',
  '{"entity_type": "employee", "fields": ["address", "phone", "email", "preferred_contact_method"]}'),
('HERA.HCM.EMP.BANK.v1', 'Employee banking information', 'HCM',
  '{"entity_type": "employee", "fields": ["bank_name", "account_number", "routing_number", "payment_method"]}'),
('HERA.HCM.EMP.TAX.v1', 'Employee tax information', 'HCM',
  '{"entity_type": "employee", "fields": ["tax_id", "tax_code", "withholding_allowances", "tax_status"]}');

-- Employee Lifecycle
INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.HCM.EMP.ONBOARD.v1', 'Employee onboarding process', 'HCM',
  '{"transaction_type": "employee_onboarding", "workflow": ["documents", "orientation", "system_access", "equipment"]}'),
('HERA.HCM.EMP.TRANSFER.v1', 'Employee transfer/promotion', 'HCM',
  '{"transaction_type": "employee_transfer", "fields": ["from_department", "to_department", "new_role", "effective_date"]}'),
('HERA.HCM.EMP.TERMINATE.v1', 'Employee termination', 'HCM',
  '{"transaction_type": "employee_termination", "fields": ["termination_date", "reason", "final_pay", "exit_interview"]}'),
('HERA.HCM.EMP.REHIRE.v1', 'Employee rehire', 'HCM',
  '{"transaction_type": "employee_rehire", "fields": ["previous_employee_id", "rehire_date", "eligibility_status"]}');

-- =============================================
-- ORGANIZATIONAL STRUCTURE
-- =============================================

INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.HCM.ORG.DEPT.v1', 'Department master', 'HCM',
  '{"entity_type": "department", "fields": ["department_code", "department_name", "cost_center", "manager_id"]}'),
('HERA.HCM.ORG.TEAM.v1', 'Team structure', 'HCM',
  '{"entity_type": "team", "fields": ["team_name", "team_lead", "department_id", "team_size"]}'),
('HERA.HCM.ORG.ROLE.v1', 'Job role definition', 'HCM',
  '{"entity_type": "job_role", "fields": ["role_code", "role_title", "job_family", "level", "competencies"]}'),
('HERA.HCM.ORG.HIERARCHY.v1', 'Organizational hierarchy', 'HCM',
  '{"relationship_type": "reports_to", "fields": ["direct_reports", "dotted_line", "matrix_reporting"]}');

-- =============================================
-- PAYROLL & COMPENSATION
-- =============================================

-- Payroll Processing
INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.HCM.PAY.SALARY.v1', 'Employee salary component', 'HCM',
  '{"transaction_type": "payroll_salary", "fields": ["base_salary", "currency", "pay_frequency", "effective_date"]}'),
('HERA.HCM.PAY.ALLOWANCE.v1', 'Payroll allowances', 'HCM',
  '{"transaction_type": "payroll_allowance", "fields": ["allowance_type", "amount", "taxable", "recurring"]}'),
('HERA.HCM.PAY.DEDUCTION.v1', 'Payroll deductions', 'HCM',
  '{"transaction_type": "payroll_deduction", "fields": ["deduction_type", "amount", "pre_tax", "recurring"]}'),
('HERA.HCM.PAY.BONUS.v1', 'Bonus payment', 'HCM',
  '{"transaction_type": "payroll_bonus", "fields": ["bonus_type", "amount", "performance_period", "approval_status"]}'),
('HERA.HCM.PAY.OVERTIME.v1', 'Overtime payment', 'HCM',
  '{"transaction_type": "payroll_overtime", "fields": ["overtime_hours", "overtime_rate", "approval_status"]}');

-- Payroll Run
INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.HCM.PAY.RUN.v1', 'Payroll run execution', 'HCM',
  '{"transaction_type": "payroll_run", "fields": ["pay_period", "pay_date", "employee_count", "total_gross", "total_net"]}'),
('HERA.HCM.PAY.SLIP.v1', 'Payslip generation', 'HCM',
  '{"transaction_type": "payslip", "fields": ["employee_id", "pay_period", "gross_pay", "net_pay", "deductions", "ytd_totals"]}'),
('HERA.HCM.PAY.TAX.v1', 'Payroll tax calculation', 'HCM',
  '{"transaction_type": "payroll_tax", "fields": ["tax_type", "tax_amount", "tax_rate", "jurisdiction"]}'),
('HERA.HCM.PAY.RECONCILE.v1', 'Payroll reconciliation', 'HCM',
  '{"transaction_type": "payroll_reconciliation", "fields": ["gl_account", "debit_amount", "credit_amount"]}');

-- =============================================
-- BENEFITS ADMINISTRATION
-- =============================================

INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.HCM.BEN.HEALTH.v1', 'Health insurance benefit', 'HCM',
  '{"entity_type": "benefit", "fields": ["plan_name", "coverage_level", "employee_contribution", "employer_contribution"]}'),
('HERA.HCM.BEN.DENTAL.v1', 'Dental insurance benefit', 'HCM',
  '{"entity_type": "benefit", "fields": ["plan_name", "coverage_level", "deductible", "annual_maximum"]}'),
('HERA.HCM.BEN.LIFE.v1', 'Life insurance benefit', 'HCM',
  '{"entity_type": "benefit", "fields": ["coverage_amount", "beneficiaries", "employee_contribution"]}'),
('HERA.HCM.BEN.RETIRE.v1', 'Retirement benefit', 'HCM',
  '{"entity_type": "benefit", "fields": ["plan_type", "employee_contribution", "employer_match", "vesting_schedule"]}'),
('HERA.HCM.BEN.ENROLL.v1', 'Benefits enrollment', 'HCM',
  '{"transaction_type": "benefits_enrollment", "fields": ["enrollment_period", "effective_date", "elections"]}');

-- =============================================
-- TIME & ATTENDANCE
-- =============================================

INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.HCM.TIME.CLOCK.v1', 'Time clock entry', 'HCM',
  '{"transaction_type": "time_clock", "fields": ["clock_in", "clock_out", "location", "device_id"]}'),
('HERA.HCM.TIME.LEAVE.v1', 'Leave request', 'HCM',
  '{"transaction_type": "leave_request", "fields": ["leave_type", "start_date", "end_date", "days", "approval_status"]}'),
('HERA.HCM.TIME.HOLIDAY.v1', 'Holiday calendar', 'HCM',
  '{"entity_type": "holiday", "fields": ["holiday_name", "holiday_date", "country", "optional"]}'),
('HERA.HCM.TIME.SHIFT.v1', 'Shift schedule', 'HCM',
  '{"entity_type": "shift", "fields": ["shift_name", "start_time", "end_time", "break_duration"]}'),
('HERA.HCM.TIME.OVERTIME.REQ.v1', 'Overtime request', 'HCM',
  '{"transaction_type": "overtime_request", "fields": ["date", "hours", "reason", "approval_status"]}');

-- Leave Types
INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.HCM.LEAVE.ANNUAL.v1', 'Annual leave', 'HCM',
  '{"leave_type": "annual", "fields": ["entitlement", "balance", "accrual_rate"]}'),
('HERA.HCM.LEAVE.SICK.v1', 'Sick leave', 'HCM',
  '{"leave_type": "sick", "fields": ["entitlement", "balance", "medical_certificate_required"]}'),
('HERA.HCM.LEAVE.MATERNITY.v1', 'Maternity leave', 'HCM',
  '{"leave_type": "maternity", "fields": ["duration", "pay_percentage", "eligibility_criteria"]}'),
('HERA.HCM.LEAVE.PATERNITY.v1', 'Paternity leave', 'HCM',
  '{"leave_type": "paternity", "fields": ["duration", "pay_percentage", "eligibility_criteria"]}');

-- =============================================
-- PERFORMANCE MANAGEMENT
-- =============================================

INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.HCM.PERF.GOAL.v1', 'Performance goal', 'HCM',
  '{"entity_type": "performance_goal", "fields": ["goal_description", "target", "weight", "due_date"]}'),
('HERA.HCM.PERF.REVIEW.v1', 'Performance review', 'HCM',
  '{"transaction_type": "performance_review", "fields": ["review_period", "overall_rating", "strengths", "improvements"]}'),
('HERA.HCM.PERF.360.v1', '360-degree feedback', 'HCM',
  '{"transaction_type": "360_feedback", "fields": ["feedback_provider", "relationship", "ratings", "comments"]}'),
('HERA.HCM.PERF.CALIBRATION.v1', 'Performance calibration', 'HCM',
  '{"transaction_type": "performance_calibration", "fields": ["department", "rating_distribution", "adjustments"]}'),
('HERA.HCM.PERF.PIP.v1', 'Performance improvement plan', 'HCM',
  '{"entity_type": "pip", "fields": ["start_date", "end_date", "objectives", "review_frequency"]}');

-- =============================================
-- LEARNING & DEVELOPMENT
-- =============================================

INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.HCM.LND.COURSE.v1', 'Training course', 'HCM',
  '{"entity_type": "training_course", "fields": ["course_name", "duration", "delivery_method", "provider"]}'),
('HERA.HCM.LND.ENROLL.v1', 'Course enrollment', 'HCM',
  '{"transaction_type": "course_enrollment", "fields": ["employee_id", "course_id", "enrollment_date", "status"]}'),
('HERA.HCM.LND.COMPLETE.v1', 'Course completion', 'HCM',
  '{"transaction_type": "course_completion", "fields": ["completion_date", "score", "certificate", "expiry_date"]}'),
('HERA.HCM.LND.SKILL.v1', 'Skill tracking', 'HCM',
  '{"entity_type": "skill", "fields": ["skill_name", "skill_category", "proficiency_levels"]}'),
('HERA.HCM.LND.CERT.v1', 'Certification tracking', 'HCM',
  '{"entity_type": "certification", "fields": ["certification_name", "issuing_body", "valid_from", "valid_to"]}');

-- Career Development
INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.HCM.CAREER.PATH.v1', 'Career path definition', 'HCM',
  '{"entity_type": "career_path", "fields": ["from_role", "to_role", "requirements", "timeline"]}'),
('HERA.HCM.CAREER.SUCCESSION.v1', 'Succession planning', 'HCM',
  '{"entity_type": "succession_plan", "fields": ["position", "successors", "readiness_level", "development_plan"]}'),
('HERA.HCM.CAREER.TALENT.v1', 'Talent pool', 'HCM',
  '{"entity_type": "talent_pool", "fields": ["talent_category", "employees", "criteria", "review_cycle"]}');

-- =============================================
-- RECRUITMENT & ONBOARDING
-- =============================================

INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.HCM.RECRUIT.JOB.v1', 'Job requisition', 'HCM',
  '{"entity_type": "job_requisition", "fields": ["position_title", "department", "hiring_manager", "headcount"]}'),
('HERA.HCM.RECRUIT.CANDIDATE.v1', 'Candidate profile', 'HCM',
  '{"entity_type": "candidate", "fields": ["name", "email", "phone", "resume", "source"]}'),
('HERA.HCM.RECRUIT.APPLICATION.v1', 'Job application', 'HCM',
  '{"transaction_type": "job_application", "fields": ["candidate_id", "requisition_id", "application_date", "status"]}'),
('HERA.HCM.RECRUIT.INTERVIEW.v1', 'Interview scheduling', 'HCM',
  '{"transaction_type": "interview", "fields": ["candidate_id", "interviewers", "date_time", "interview_type"]}'),
('HERA.HCM.RECRUIT.OFFER.v1', 'Job offer', 'HCM',
  '{"transaction_type": "job_offer", "fields": ["candidate_id", "position", "salary", "start_date", "expiry_date"]}');

-- =============================================
-- COMPLIANCE & REGULATIONS
-- =============================================

INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.HCM.COMP.VISA.v1', 'Visa/work permit tracking', 'HCM',
  '{"entity_type": "visa", "fields": ["visa_type", "issue_date", "expiry_date", "country", "renewal_status"]}'),
('HERA.HCM.COMP.CONTRACT.v1', 'Employment contract', 'HCM',
  '{"entity_type": "employment_contract", "fields": ["contract_type", "start_date", "end_date", "terms"]}'),
('HERA.HCM.COMP.AUDIT.v1', 'HR compliance audit', 'HCM',
  '{"transaction_type": "compliance_audit", "fields": ["audit_type", "audit_date", "findings", "corrective_actions"]}'),
('HERA.HCM.COMP.POLICY.v1', 'HR policy', 'HCM',
  '{"entity_type": "hr_policy", "fields": ["policy_name", "version", "effective_date", "acknowledgment_required"]}'),
('HERA.HCM.COMP.INCIDENT.v1', 'HR incident', 'HCM',
  '{"transaction_type": "hr_incident", "fields": ["incident_type", "date", "parties_involved", "resolution"]}');

-- =============================================
-- ANALYTICS & INSIGHTS
-- =============================================

INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.HCM.ANALYTICS.HEADCOUNT.v1', 'Headcount analytics', 'HCM',
  '{"report_type": "headcount", "metrics": ["total", "by_department", "by_location", "trend"]}'),
('HERA.HCM.ANALYTICS.TURNOVER.v1', 'Turnover analytics', 'HCM',
  '{"report_type": "turnover", "metrics": ["voluntary", "involuntary", "by_department", "cost"]}'),
('HERA.HCM.ANALYTICS.DIVERSITY.v1', 'Diversity analytics', 'HCM',
  '{"report_type": "diversity", "metrics": ["gender", "ethnicity", "age_distribution", "pay_equity"]}'),
('HERA.HCM.ANALYTICS.ENGAGEMENT.v1', 'Employee engagement', 'HCM',
  '{"report_type": "engagement", "metrics": ["satisfaction_score", "eNPS", "pulse_survey", "retention_risk"]}'),
('HERA.HCM.ANALYTICS.COST.v1', 'HR cost analytics', 'HCM',
  '{"report_type": "hr_cost", "metrics": ["cost_per_hire", "training_roi", "benefits_cost", "overtime_cost"]}');

-- =============================================
-- EMPLOYEE SELF-SERVICE
-- =============================================

INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.HCM.ESS.PROFILE.v1', 'Employee profile update', 'HCM',
  '{"transaction_type": "profile_update", "fields": ["contact_info", "emergency_contact", "bank_details"]}'),
('HERA.HCM.ESS.LEAVE.REQ.v1', 'Self-service leave request', 'HCM',
  '{"transaction_type": "leave_request_ess", "fields": ["leave_type", "dates", "reason", "approver"]}'),
('HERA.HCM.ESS.PAYSLIP.v1', 'View payslip', 'HCM',
  '{"transaction_type": "payslip_view", "fields": ["pay_period", "download_format"]}'),
('HERA.HCM.ESS.BENEFITS.v1', 'Benefits self-service', 'HCM',
  '{"transaction_type": "benefits_ess", "fields": ["view_elections", "change_beneficiaries", "life_events"]}'),
('HERA.HCM.ESS.EXPENSE.v1', 'Expense claim', 'HCM',
  '{"transaction_type": "expense_claim", "fields": ["expense_type", "amount", "receipt", "approval_status"]}');

-- =============================================
-- MULTI-COUNTRY SUPPORT
-- =============================================

INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.HCM.COUNTRY.US.v1', 'US payroll rules', 'HCM',
  '{"country": "US", "features": ["federal_tax", "state_tax", "401k", "healthcare", "FLSA"]}'),
('HERA.HCM.COUNTRY.UK.v1', 'UK payroll rules', 'HCM',
  '{"country": "UK", "features": ["PAYE", "NI", "pension", "statutory_pay", "RTI"]}'),
('HERA.HCM.COUNTRY.AE.v1', 'UAE payroll rules', 'HCM',
  '{"country": "AE", "features": ["WPS", "gratuity", "housing_allowance", "visa_tracking"]}'),
('HERA.HCM.COUNTRY.IN.v1', 'India payroll rules', 'HCM',
  '{"country": "IN", "features": ["PF", "ESI", "PT", "TDS", "gratuity", "bonus_act"]}'),
('HERA.HCM.COUNTRY.SG.v1', 'Singapore payroll rules', 'HCM',
  '{"country": "SG", "features": ["CPF", "SDL", "FWL", "income_tax", "employment_pass"]}');