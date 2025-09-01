-- HERA DNA Universal Calendar - SQL Patterns
-- Smart Code: HERA.SQL.CALENDAR.PATTERNS.v1
-- 
-- Complete SQL implementation using Sacred Six Tables for universal calendar functionality

-- ====================================================================
-- 1. CALENDAR EVENTS (Universal Transactions Table)
-- ====================================================================

-- Create calendar event using universal_transactions
-- Events are stored as transactions with smart codes for business intelligence
INSERT INTO universal_transactions (
    id,
    transaction_type,
    transaction_date,
    organization_id,
    smart_code,
    from_entity_id,        -- Customer/Patient/Client
    to_entity_id,          -- Staff/Resource assigned
    reference_number,
    total_amount,
    currency_code,
    notes,
    metadata,
    status,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'appointment',         -- appointment, block, holiday, shift, maintenance
    '2024-12-15 14:30:00+00'::timestamptz,
    $organization_id,
    'HERA.SALON.CALENDAR.APPOINTMENT.PREMIUM.v1',
    $customer_entity_id,   -- From core_entities where entity_type='customer'  
    $stylist_entity_id,    -- From core_entities where entity_type='staff'
    'APT-' || to_char(NOW(), 'YYYYMMDD') || '-' || LPAD((EXTRACT(EPOCH FROM NOW())::bigint % 100000)::text, 5, '0'),
    150.00,                -- Service price
    'AED',
    'Brazilian blowout with consultation',
    jsonb_build_object(
        'calendar_event', true,
        'title', 'Premium Brazilian Blowout - Sarah Johnson',
        'start_time', '2024-12-15T14:30:00Z',
        'end_time', '2024-12-15T18:30:00Z',   -- 4 hours for chemical service
        'all_day', false,
        'service_type', 'chemical_treatment',
        'service_id', $service_entity_id,
        'duration_minutes', 240,
        'buffer_minutes', 30,
        'room_id', $room_entity_id,
        'equipment_required', ['brazilian_blowout_kit', 'professional_dryer'],
        'special_instructions', 'Client sensitive to ammonia - use organic formula',
        'reminder_sent', false,
        'confirmation_required', true,
        'deposit_paid', true,
        'deposit_amount', 50.00,
        'recurring_pattern', null,
        'parent_appointment_id', null,
        'cancellation_policy', '48_hours',
        'color_code', '#8b5cf6'
    ),
    'confirmed',           -- draft, confirmed, cancelled, completed, no_show
    NOW(),
    NOW()
);

-- ====================================================================
-- 2. CALENDAR RESOURCES (Core Entities Table)
-- ====================================================================

-- Create calendar resource (staff member)
INSERT INTO core_entities (
    id,
    entity_type,
    entity_name,
    entity_code,
    organization_id,
    smart_code,
    status,
    metadata,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'staff',
    'Rocky - Celebrity Stylist',
    'STAFF-ROCKY-001',
    $organization_id,
    'HERA.SALON.STAFF.CELEBRITY.STYLIST.v1',
    'active',
    jsonb_build_object(
        'calendar_resource', true,
        'resource_type', 'staff',
        'specializations', ARRAY['brazilian_blowout', 'keratin_treatment', 'color_specialist', 'bridal_styling'],
        'skill_level', 'celebrity',
        'hourly_rate', 200.00,
        'commission_rate', 0.40,
        'capacity', 1,                    -- Can handle 1 client at a time
        'simultaneous_bookings', false,
        'mobile_stylist', false,
        'languages', ARRAY['english', 'hindi', 'urdu'],
        'certifications', ARRAY['brazilian_blowout_certified', 'kerastase_expert', 'loreal_professionnel'],
        'years_experience', 15,
        'celebrity_clients', true,
        'instagram_handle', '@rocky_hair_artist',
        'booking_lead_time_hours', 48,
        'cancellation_fee', 100.00,
        'color_code', '#8b5cf6'
    ),
    NOW(),
    NOW()
);

-- Create calendar resource (room/station)
INSERT INTO core_entities (
    id,
    entity_type,
    entity_name,
    entity_code,
    organization_id,
    smart_code,
    status,
    metadata,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'location',
    'VIP Suite 1',
    'ROOM-VIP-001',
    $organization_id,
    'HERA.SALON.RESOURCE.ROOM.VIP.v1',
    'active',
    jsonb_build_object(
        'calendar_resource', true,
        'resource_type', 'room',
        'capacity', 2,                    -- Can accommodate 2 clients
        'equipment', ARRAY['professional_styling_chair', 'premium_wash_basin', 'italian_hair_dryer', 'brazilian_blowout_station'],
        'amenities', ARRAY['private_entrance', 'complimentary_beverages', 'wifi', 'charging_station', 'mirror_lighting'],
        'square_meters', 25.5,
        'air_conditioning', true,
        'natural_light', true,
        'accessibility_compliant', true,
        'hourly_rate', 50.00,
        'cleaning_time_minutes', 30,
        'suitable_for_services', ARRAY['chemical_treatments', 'color_services', 'premium_styling', 'bridal_packages'],
        'max_chemical_treatments_per_day', 3,
        'ventilation_grade', 'premium',
        'color_code', '#f59e0b'
    ),
    NOW(),
    NOW()
);

-- ====================================================================
-- 3. RESOURCE AVAILABILITY (Core Dynamic Data Table)
-- ====================================================================

-- Staff availability schedule
INSERT INTO core_dynamic_data (
    id,
    entity_id,             -- Staff member entity ID
    organization_id,
    field_name,
    field_value_json,
    smart_code,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    $staff_entity_id,
    $organization_id,
    'weekly_availability',
    jsonb_build_object(
        'schedule_type', 'weekly_recurring',
        'timezone', 'Asia/Dubai',
        'weekly_hours', 40,
        'schedule', jsonb_build_array(
            jsonb_build_object('day', 1, 'day_name', 'Monday', 'start', '10:00', 'end', '21:00', 'available', true, 'break_start', '14:00', 'break_end', '15:00'),
            jsonb_build_object('day', 2, 'day_name', 'Tuesday', 'start', '10:00', 'end', '21:00', 'available', true, 'break_start', '14:00', 'break_end', '15:00'),
            jsonb_build_object('day', 3, 'day_name', 'Wednesday', 'start', '10:00', 'end', '21:00', 'available', true, 'break_start', '14:00', 'break_end', '15:00'),
            jsonb_build_object('day', 4, 'day_name', 'Thursday', 'start', '10:00', 'end', '21:00', 'available', true, 'break_start', '14:00', 'break_end', '15:00'),
            jsonb_build_object('day', 5, 'day_name', 'Friday', 'start', '10:00', 'end', '21:00', 'available', true, 'break_start', '12:30', 'break_end', '14:00'),
            jsonb_build_object('day', 6, 'day_name', 'Saturday', 'start', '10:00', 'end', '21:00', 'available', true, 'break_start', '14:00', 'break_end', '15:00'),
            jsonb_build_object('day', 0, 'day_name', 'Sunday', 'start', null, 'end', null, 'available', false, 'notes', 'Day off')
        ),
        'exceptions', jsonb_build_array(
            jsonb_build_object('date', '2024-12-25', 'available', false, 'reason', 'Christmas Holiday'),
            jsonb_build_object('date', '2024-12-31', 'start', '10:00', 'end', '17:00', 'reason', 'Early close New Year Eve'),
            jsonb_build_object('date', '2024-01-01', 'available', false, 'reason', 'New Year Holiday')
        ),
        'prayer_times', jsonb_build_object(
            'enabled', true,
            'duration_minutes', 15,
            'flexible_timing', true,
            'ramadan_adjustments', true
        ),
        'overtime_allowed', true,
        'weekend_premium', 1.5,
        'holiday_premium', 2.0
    ),
    'HERA.SALON.STAFF.AVAILABILITY.WEEKLY.v1',
    NOW(),
    NOW()
);

-- Room availability and maintenance schedule
INSERT INTO core_dynamic_data (
    id,
    entity_id,             -- Room entity ID
    organization_id,
    field_name,
    field_value_json,
    smart_code,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    $room_entity_id,
    $organization_id,
    'room_schedule',
    jsonb_build_object(
        'operating_hours', jsonb_build_object(
            'monday', jsonb_build_object('start', '09:00', 'end', '22:00'),
            'tuesday', jsonb_build_object('start', '09:00', 'end', '22:00'),
            'wednesday', jsonb_build_object('start', '09:00', 'end', '22:00'),
            'thursday', jsonb_build_object('start', '09:00', 'end', '22:00'),
            'friday', jsonb_build_object('start', '09:00', 'end', '22:00'),
            'saturday', jsonb_build_object('start', '09:00', 'end', '22:00'),
            'sunday', jsonb_build_object('start', '10:00', 'end', '20:00')
        ),
        'maintenance_schedule', jsonb_build_array(
            jsonb_build_object('day', 'Monday', 'start', '08:00', 'end', '09:00', 'type', 'deep_cleaning'),
            jsonb_build_object('day', 'Friday', 'start', '22:00', 'end', '23:00', 'type', 'weekly_maintenance')
        ),
        'booking_rules', jsonb_build_object(
            'min_booking_duration_minutes', 60,
            'max_booking_duration_minutes', 480,
            'buffer_time_minutes', 30,
            'max_consecutive_chemical_treatments', 2,
            'ventilation_time_after_chemical_minutes', 30,
            'double_booking_allowed', false
        ),
        'equipment_maintenance', jsonb_build_array(
            jsonb_build_object('equipment', 'hair_dryer', 'last_service', '2024-11-15', 'next_service', '2024-12-15'),
            jsonb_build_object('equipment', 'styling_chair', 'last_service', '2024-10-01', 'next_service', '2025-01-01')
        )
    ),
    'HERA.SALON.RESOURCE.ROOM.SCHEDULE.v1',
    NOW(),
    NOW()
);

-- ====================================================================
-- 4. EVENT-RESOURCE ASSIGNMENTS (Core Relationships Table)
-- ====================================================================

-- Assign stylist to appointment
INSERT INTO core_relationships (
    id,
    from_entity_id,        -- Appointment (universal_transactions.id)
    to_entity_id,          -- Staff member (core_entities.id)
    relationship_type,
    organization_id,
    smart_code,
    metadata,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    $appointment_transaction_id,
    $stylist_entity_id,
    'assigned_to',
    $organization_id,
    'HERA.SALON.CALENDAR.ASSIGNMENT.STAFF.v1',
    jsonb_build_object(
        'assignment_type', 'primary_stylist',
        'role', 'lead_stylist',
        'assigned_at', NOW(),
        'assigned_by', $manager_entity_id,
        'commission_rate', 0.40,
        'hourly_rate', 200.00,
        'estimated_duration_minutes', 240,
        'skill_match_score', 0.95,
        'preference_match', 'client_requested',
        'auto_assigned', false,
        'confirmed_by_staff', true,
        'confirmed_at', NOW()
    ),
    NOW(),
    NOW()
);

-- Assign room to appointment
INSERT INTO core_relationships (
    id,
    from_entity_id,        -- Appointment (universal_transactions.id)
    to_entity_id,          -- Room (core_entities.id)
    relationship_type,
    organization_id,
    smart_code,
    metadata,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    $appointment_transaction_id,
    $room_entity_id,
    'uses_resource',
    $organization_id,
    'HERA.SALON.CALENDAR.ASSIGNMENT.ROOM.v1',
    jsonb_build_object(
        'assignment_type', 'primary_location',
        'room_rate', 50.00,
        'setup_time_minutes', 15,
        'cleanup_time_minutes', 30,
        'equipment_checklist', ARRAY['brazilian_blowout_kit', 'professional_dryer', 'styling_tools'],
        'special_requirements', ARRAY['premium_ventilation', 'chemical_treatment_setup'],
        'auto_assigned', false,
        'reservation_priority', 'high'
    ),
    NOW(),
    NOW()
);

-- ====================================================================
-- 5. EVENT DETAILS (Universal Transaction Lines Table)
-- ====================================================================

-- Service line items for the appointment
INSERT INTO universal_transaction_lines (
    id,
    transaction_id,        -- Links to universal_transactions
    line_number,
    line_entity_id,        -- Service entity from core_entities
    description,
    quantity,
    unit_price,
    line_amount,
    organization_id,
    smart_code,
    metadata,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    $appointment_transaction_id,
    1,
    $service_entity_id,    -- Brazilian Blowout service from core_entities
    'Brazilian Blowout Treatment - Premium Organic Formula',
    1.00,
    150.00,
    150.00,
    $organization_id,
    'HERA.SALON.SERVICE.CHEMICAL.BRAZILIAN.v1',
    jsonb_build_object(
        'service_category', 'chemical_treatment',
        'duration_minutes', 240,
        'skill_level_required', 'advanced',
        'chemical_products', ARRAY['organic_brazilian_formula', 'neutralizing_shampoo', 'conditioning_mask'],
        'equipment_required', ARRAY['professional_flat_iron', 'ceramic_blow_dryer', 'wide_tooth_comb'],
        'client_hair_type', 'thick_curly',
        'client_allergies', ARRAY['ammonia'],
        'formula_customization', 'organic_sensitive_formula',
        'expected_results', 'smooth_frizz_free_12_weeks',
        'aftercare_instructions', true,
        'follow_up_required', true,
        'follow_up_days', 14,
        'warranty_weeks', 8,
        'touch_up_eligible', true,
        'commission_eligible', true,
        'commission_rate', 0.40
    ),
    NOW(),
    NOW()
);

-- Add-on service: Premium conditioning treatment
INSERT INTO universal_transaction_lines (
    id,
    transaction_id,
    line_number,
    line_entity_id,        -- Premium conditioning service
    description,
    quantity,
    unit_price,
    line_amount,
    organization_id,
    smart_code,
    metadata,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    $appointment_transaction_id,
    2,
    $conditioning_service_entity_id,
    'Deep Conditioning Treatment - Kerastase Premium',
    1.00,
    45.00,
    45.00,
    $organization_id,
    'HERA.SALON.SERVICE.CONDITIONING.PREMIUM.v1',
    jsonb_build_object(
        'service_category', 'conditioning',
        'duration_minutes', 30,
        'addon_to_main_service', true,
        'product_line', 'kerastase',
        'treatment_type', 'intensive_repair',
        'suitable_after_chemical', true,
        'commission_eligible', true,
        'commission_rate', 0.25
    ),
    NOW(),
    NOW()
);

-- ====================================================================
-- 6. SMART QUERIES FOR CALENDAR OPERATIONS
-- ====================================================================

-- Query 1: Get all appointments for a specific date range
CREATE OR REPLACE FUNCTION get_calendar_events(
    org_id uuid,
    start_date timestamptz,
    end_date timestamptz,
    resource_ids uuid[] DEFAULT NULL
) RETURNS TABLE (
    event_id uuid,
    title text,
    start_time timestamptz,
    end_time timestamptz,
    all_day boolean,
    resource_id uuid,
    resource_name text,
    customer_name text,
    status text,
    smart_code text,
    metadata jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ut.id as event_id,
        COALESCE(ut.metadata->>'title', ut.notes, ut.transaction_type) as title,
        ut.transaction_date as start_time,
        (ut.metadata->>'end_time')::timestamptz as end_time,
        COALESCE((ut.metadata->>'all_day')::boolean, false) as all_day,
        ut.to_entity_id as resource_id,
        staff.entity_name as resource_name,
        customer.entity_name as customer_name,
        ut.status,
        ut.smart_code,
        ut.metadata
    FROM universal_transactions ut
    LEFT JOIN core_entities staff ON ut.to_entity_id = staff.id
    LEFT JOIN core_entities customer ON ut.from_entity_id = customer.id
    WHERE ut.organization_id = org_id
        AND ut.smart_code LIKE 'HERA.%.CALENDAR.%'
        AND ut.transaction_date >= start_date
        AND ut.transaction_date <= end_date
        AND (resource_ids IS NULL OR ut.to_entity_id = ANY(resource_ids))
    ORDER BY ut.transaction_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Query 2: Get resource availability for scheduling
CREATE OR REPLACE FUNCTION get_resource_availability(
    org_id uuid,
    resource_id uuid,
    check_date date
) RETURNS jsonb AS $$
DECLARE
    availability jsonb;
    day_of_week int;
    existing_bookings jsonb;
BEGIN
    -- Get day of week (0 = Sunday, 1 = Monday, etc.)
    day_of_week := extract(dow from check_date);
    
    -- Get base availability from dynamic data
    SELECT field_value_json
    INTO availability
    FROM core_dynamic_data
    WHERE entity_id = resource_id
        AND organization_id = org_id
        AND field_name = 'weekly_availability';
    
    -- Get existing bookings for the date
    SELECT jsonb_agg(
        jsonb_build_object(
            'start', transaction_date,
            'end', (metadata->>'end_time')::timestamptz,
            'title', COALESCE(metadata->>'title', notes)
        )
    )
    INTO existing_bookings
    FROM universal_transactions
    WHERE organization_id = org_id
        AND to_entity_id = resource_id
        AND DATE(transaction_date) = check_date
        AND status IN ('confirmed', 'pending');
    
    -- Combine availability with existing bookings
    RETURN jsonb_build_object(
        'date', check_date,
        'day_of_week', day_of_week,
        'base_availability', availability,
        'existing_bookings', COALESCE(existing_bookings, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql;

-- Query 3: Find available time slots for appointment booking
CREATE OR REPLACE FUNCTION find_available_slots(
    org_id uuid,
    service_duration_minutes int,
    preferred_date date DEFAULT CURRENT_DATE,
    preferred_staff_id uuid DEFAULT NULL,
    days_ahead int DEFAULT 14
) RETURNS TABLE (
    available_date date,
    available_start_time time,
    available_end_time time,
    staff_id uuid,
    staff_name text,
    confidence_score decimal
) AS $$
BEGIN
    -- Complex availability calculation logic would go here
    -- This is a simplified version
    RETURN QUERY
    SELECT 
        (preferred_date + generate_series(0, days_ahead) * interval '1 day')::date as available_date,
        '10:00:00'::time as available_start_time,
        ('10:00:00'::time + (service_duration_minutes || ' minutes')::interval)::time as available_end_time,
        ce.id as staff_id,
        ce.entity_name as staff_name,
        0.85::decimal as confidence_score
    FROM core_entities ce
    WHERE ce.organization_id = org_id
        AND ce.entity_type = 'staff'
        AND ce.smart_code LIKE 'HERA.%.STAFF.%'
        AND (preferred_staff_id IS NULL OR ce.id = preferred_staff_id)
        AND ce.status = 'active'
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 7. INDEXES FOR PERFORMANCE
-- ====================================================================

-- Indexes for calendar queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calendar_events_org_date 
ON universal_transactions (organization_id, transaction_date) 
WHERE smart_code LIKE 'HERA.%.CALENDAR.%';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calendar_events_resource_date
ON universal_transactions (to_entity_id, transaction_date, organization_id)
WHERE smart_code LIKE 'HERA.%.CALENDAR.%';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calendar_resources_org_type
ON core_entities (organization_id, entity_type)
WHERE smart_code LIKE 'HERA.%.CALENDAR.RESOURCE.%';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calendar_availability
ON core_dynamic_data (entity_id, field_name, organization_id)
WHERE field_name IN ('weekly_availability', 'room_schedule');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calendar_assignments
ON core_relationships (from_entity_id, relationship_type, organization_id)
WHERE relationship_type IN ('assigned_to', 'uses_resource');

-- ====================================================================
-- 8. BUSINESS RULE CONSTRAINTS
-- ====================================================================

-- Prevent double-booking of resources
CREATE OR REPLACE FUNCTION prevent_double_booking()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for overlapping appointments on the same resource
    IF EXISTS (
        SELECT 1 FROM universal_transactions existing
        WHERE existing.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
            AND existing.organization_id = NEW.organization_id
            AND existing.to_entity_id = NEW.to_entity_id  -- Same resource
            AND existing.status IN ('confirmed', 'pending')
            AND existing.smart_code LIKE 'HERA.%.CALENDAR.%'
            AND (
                -- New appointment starts during existing appointment
                (NEW.transaction_date >= existing.transaction_date 
                 AND NEW.transaction_date < (existing.metadata->>'end_time')::timestamptz)
                OR
                -- New appointment ends during existing appointment
                ((NEW.metadata->>'end_time')::timestamptz > existing.transaction_date 
                 AND (NEW.metadata->>'end_time')::timestamptz <= (existing.metadata->>'end_time')::timestamptz)
                OR
                -- New appointment completely encompasses existing appointment
                (NEW.transaction_date <= existing.transaction_date 
                 AND (NEW.metadata->>'end_time')::timestamptz >= (existing.metadata->>'end_time')::timestamptz)
            )
    ) THEN
        RAISE EXCEPTION 'Resource already booked for this time slot. Smart Code: %', NEW.smart_code;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger
DROP TRIGGER IF EXISTS tr_prevent_double_booking ON universal_transactions;
CREATE TRIGGER tr_prevent_double_booking
    BEFORE INSERT OR UPDATE ON universal_transactions
    FOR EACH ROW
    WHEN (NEW.smart_code LIKE 'HERA.%.CALENDAR.%')
    EXECUTE FUNCTION prevent_double_booking();

-- ====================================================================
-- 9. SAMPLE DATA INSERTION
-- ====================================================================

-- Sample organization (if not exists)
INSERT INTO core_organizations (id, organization_name, organization_code, status, created_at, updated_at)
VALUES ('123e4567-e89b-12d3-a456-426614174000', 'Glamour Palace Salon', 'GLAMOUR-001', 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Sample services
INSERT INTO core_entities (id, entity_type, entity_name, entity_code, organization_id, smart_code, metadata, status, created_at, updated_at) VALUES
('223e4567-e89b-12d3-a456-426614174001', 'service', 'Brazilian Blowout', 'SRV-BRAZILIAN-001', '123e4567-e89b-12d3-a456-426614174000', 'HERA.SALON.SERVICE.CHEMICAL.BRAZILIAN.v1', 
 '{"duration_minutes": 240, "price": 150.00, "category": "chemical_treatment", "skill_level": "advanced"}', 'active', NOW(), NOW()),
('223e4567-e89b-12d3-a456-426614174002', 'service', 'Keratin Treatment', 'SRV-KERATIN-001', '123e4567-e89b-12d3-a456-426614174000', 'HERA.SALON.SERVICE.CHEMICAL.KERATIN.v1',
 '{"duration_minutes": 180, "price": 120.00, "category": "chemical_treatment", "skill_level": "intermediate"}', 'active', NOW(), NOW()),
('223e4567-e89b-12d3-a456-426614174003', 'service', 'Premium Cut & Style', 'SRV-CUT-PREMIUM-001', '123e4567-e89b-12d3-a456-426614174000', 'HERA.SALON.SERVICE.CUT.PREMIUM.v1',
 '{"duration_minutes": 90, "price": 80.00, "category": "cutting", "skill_level": "senior"}', 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Sample staff
INSERT INTO core_entities (id, entity_type, entity_name, entity_code, organization_id, smart_code, metadata, status, created_at, updated_at) VALUES
('323e4567-e89b-12d3-a456-426614174001', 'staff', 'Rocky - Celebrity Stylist', 'STAFF-ROCKY-001', '123e4567-e89b-12d3-a456-426614174000', 'HERA.SALON.STAFF.CELEBRITY.STYLIST.v1',
 '{"specializations": ["brazilian_blowout", "keratin_treatment", "color_specialist"], "hourly_rate": 200.00, "commission_rate": 0.40}', 'active', NOW(), NOW()),
('323e4567-e89b-12d3-a456-426614174002', 'staff', 'Vinay - Senior Stylist', 'STAFF-VINAY-001', '123e4567-e89b-12d3-a456-426614174000', 'HERA.SALON.STAFF.SENIOR.STYLIST.v1',
 '{"specializations": ["cutting", "styling", "color"], "hourly_rate": 150.00, "commission_rate": 0.35}', 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Sample customers
INSERT INTO core_entities (id, entity_type, entity_name, entity_code, organization_id, smart_code, metadata, status, created_at, updated_at) VALUES
('423e4567-e89b-12d3-a456-426614174001', 'customer', 'Sarah Johnson', 'CUST-SARAH-001', '123e4567-e89b-12d3-a456-426614174000', 'HERA.SALON.CUSTOMER.VIP.v1',
 '{"vip_level": "platinum", "hair_type": "thick_curly", "allergies": ["ammonia"], "preferred_stylist": "323e4567-e89b-12d3-a456-426614174001"}', 'active', NOW(), NOW()),
('423e4567-e89b-12d3-a456-426614174002', 'customer', 'Emma Davis', 'CUST-EMMA-001', '123e4567-e89b-12d3-a456-426614174000', 'HERA.SALON.CUSTOMER.REGULAR.v1',
 '{"hair_type": "fine_straight", "visit_frequency": "monthly", "average_spend": 120.00}', 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;