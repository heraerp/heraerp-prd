-- HERA Design System DNA Component
-- Official design system for HERA ERP applications
-- Gradient-first, mobile-responsive, enterprise-ready

-- Design System DNA Entity
INSERT INTO core_entities (
  id,
  entity_type,
  entity_name,
  entity_code,
  organization_id,
  smart_code,
  metadata
) VALUES (
  gen_random_uuid(),
  'design_system_dna',
  'HERA Design System',
  'HERA-DESIGN-SYSTEM-v1',
  (SELECT id FROM core_organizations WHERE organization_code = 'HERA-DNA-SYS'),
  'HERA.DESIGN.GRADIENT.ENTERPRISE.V1',
  jsonb_build_object(
    'version', '1.0.0',
    'created_date', CURRENT_TIMESTAMP,
    'design_philosophy', 'Gradient-first, mobile-responsive, high-contrast enterprise design',
    'tagline', 'ERP in weeks, not years',
    'primary_colors', jsonb_build_object(
      'purple', '#7C3AED',
      'blue', '#3B82F6',
      'cyan', '#06B6D4'
    )
  )
);

-- Core Color Palette
INSERT INTO core_dynamic_data (
  id,
  entity_id,
  organization_id,
  field_name,
  field_value_text,
  field_type,
  metadata
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM core_entities WHERE entity_code = 'HERA-DESIGN-SYSTEM-v1'),
  (SELECT id FROM core_organizations WHERE organization_code = 'HERA-DNA-SYS'),
  'color_palette',
  '/* HERA Design System Color Palette */
:root {
  /* Primary Gradient Colors */
  --hera-purple: #7C3AED;
  --hera-purple-dark: #6366F1;
  --hera-blue: #3B82F6;
  --hera-sky: #0EA5E9;
  --hera-cyan: #06B6D4;
  
  /* Action Colors */
  --hera-violet-600: #7C3AED;
  --hera-violet-700: #6D28D9;
  --hera-violet-800: #5B21B6;
  
  /* Text Colors - High Contrast Only */
  --text-primary: #1F2937;    /* gray-800 */
  --text-secondary: #374151;  /* gray-700 */
  --text-tertiary: #4B5563;   /* gray-600 */
  --text-light: #6B7280;      /* gray-500 - use sparingly */
  
  /* Backgrounds */
  --bg-white: #FFFFFF;
  --bg-off-white: #F8FAFC;
  --bg-input: #F9FAFB;
  --bg-card: rgba(255, 255, 255, 0.98);
}',
  'css',
  jsonb_build_object(
    'category', 'colors',
    'description', 'Core color variables for HERA Design System'
  )
);

-- Typography System
INSERT INTO core_dynamic_data (
  id,
  entity_id,
  organization_id,
  field_name,
  field_value_text,
  field_type,
  metadata
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM core_entities WHERE entity_code = 'HERA-DESIGN-SYSTEM-v1'),
  (SELECT id FROM core_organizations WHERE organization_code = 'HERA-DNA-SYS'),
  'typography_system',
  '/* HERA Typography System */
.hera-font-stack {
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

/* Font Weights - Enterprise Standards */
.hera-font-medium { font-weight: 500; }
.hera-font-semibold { font-weight: 600; }
.hera-font-bold { font-weight: 700; }
.hera-font-extrabold { font-weight: 800; }
.hera-font-black { font-weight: 900; }

/* Responsive Typography Scale */
.hera-text-xs { @apply text-xs; }
.hera-text-sm { @apply text-sm md:text-base; }
.hera-text-base { @apply text-base md:text-lg; }
.hera-text-lg { @apply text-lg md:text-xl; }
.hera-text-xl { @apply text-xl md:text-2xl; }
.hera-text-2xl { @apply text-2xl md:text-3xl; }
.hera-text-3xl { @apply text-3xl md:text-4xl; }',
  'css',
  jsonb_build_object(
    'category', 'typography',
    'description', 'Typography system with mobile-first responsive scaling'
  )
);

-- Animation System
INSERT INTO core_dynamic_data (
  id,
  entity_id,
  organization_id,
  field_name,
  field_value_text,
  field_type,
  metadata
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM core_entities WHERE entity_code = 'HERA-DESIGN-SYSTEM-v1'),
  (SELECT id FROM core_organizations WHERE organization_code = 'HERA-DNA-SYS'),
  'animation_system',
  '/* HERA Animation System - Subtle & Professional */
:root {
  --animation-fast: 200ms;
  --animation-normal: 300ms;
  --animation-slow: 500ms;
  --animation-bg-slow: 8000ms;
  --animation-gradient: 20000ms;
}

/* Subtle pulse for background elements */
@keyframes subtle-pulse {
  0%, 100% { 
    opacity: 0.15; 
    transform: scale(1); 
  }
  50% { 
    opacity: 0.25; 
    transform: scale(1.05); 
  }
}

/* Gradient animation */
@keyframes gradient-x {
  0%, 100% {
    background-size: 200% 200%;
    background-position: left center;
  }
  50% {
    background-size: 200% 200%;
    background-position: right center;
  }
}

.animate-subtle-pulse {
  animation: subtle-pulse var(--animation-bg-slow) ease-in-out infinite;
}

.animate-gradient-x {
  animation: gradient-x var(--animation-gradient) ease infinite;
  background-size: 200% 200%;
}',
  'css',
  jsonb_build_object(
    'category', 'animations',
    'description', 'Subtle animation system for professional enterprise UI'
  )
);

-- Component Patterns
INSERT INTO core_dynamic_data (
  id,
  entity_id,
  organization_id,
  field_name,
  field_value_text,
  field_type,
  metadata
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM core_entities WHERE entity_code = 'HERA-DESIGN-SYSTEM-v1'),
  (SELECT id FROM core_organizations WHERE organization_code = 'HERA-DNA-SYS'),
  'component_patterns',
  '/* HERA Component Patterns */

/* Cards */
.hera-card {
  @apply bg-white shadow-2xl border border-gray-100 transition-all duration-300;
}

/* Primary Button */
.hera-button-primary {
  @apply bg-gradient-to-r from-violet-600 to-sky-600 
         hover:from-violet-700 hover:to-sky-700
         text-white font-semibold shadow-lg hover:shadow-xl 
         transform hover:-translate-y-0.5 transition-all duration-200;
}

/* Input Fields */
.hera-input {
  @apply h-10 md:h-12 bg-gray-50 border-gray-200 
         focus:ring-2 focus:ring-violet-500 focus:border-transparent 
         transition-all;
}

/* Background Blobs */
.hera-blob {
  @apply rounded-full filter blur-3xl animate-subtle-pulse;
}

.hera-blob-sm { @apply w-32 h-32 md:w-48 md:h-48; }
.hera-blob-md { @apply w-48 h-48 md:w-64 md:h-64; }
.hera-blob-lg { @apply w-64 h-64 md:w-80 md:h-80; }

.hera-blob-subtle { @apply opacity-10; }
.hera-blob-light { @apply opacity-15; }
.hera-blob-medium { @apply opacity-20; }',
  'css',
  jsonb_build_object(
    'category', 'components',
    'description', 'Reusable component patterns for consistent UI'
  )
);

-- Layout System
INSERT INTO core_dynamic_data (
  id,
  entity_id,
  organization_id,
  field_name,
  field_value_text,
  field_type,
  metadata
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM core_entities WHERE entity_code = 'HERA-DESIGN-SYSTEM-v1'),
  (SELECT id FROM core_organizations WHERE organization_code = 'HERA-DNA-SYS'),
  'layout_pattern',
  '<div className="h-screen flex items-center justify-center relative overflow-hidden">
  {/* Gradient background */}
  <div className="absolute inset-0 animate-gradient-x" style={{
    background: "linear-gradient(135deg, #7dd3fc 0%, #c084fc 50%, #f0f4f8 100%)"
  }} />
  
  {/* Animated blobs - subtle and small */}
  <div className="absolute inset-0">
    <div className="hera-blob hera-blob-sm hera-blob-light absolute top-10 left-10" />
    <div className="hera-blob hera-blob-sm hera-blob-subtle absolute top-1/3 right-10" />
    <div className="hera-blob hera-blob-sm hera-blob-subtle absolute bottom-20 left-1/3" />
  </div>
  
  {/* White overlay for bottom readability */}
  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-60" />
  
  {/* Content with flex layout for single screen */}
  <div className="relative z-10 w-full max-w-md mx-auto px-4 flex flex-col h-screen py-6 md:py-8">
    {/* Logo section */}
    <div className="text-center mb-4 md:mb-6 flex-shrink-0">
      <img src="/logo.png" alt="HERA" className="h-16 md:h-20 w-auto mx-auto mb-3" />
      <p className="text-base md:text-lg text-gray-800 font-medium">
        ERP in weeks, not years
      </p>
    </div>
    
    {/* Main content - flex-grow */}
    <div className="flex-grow flex flex-col">
      {/* Your content here */}
    </div>
    
    {/* Footer - flex-shrink-0 */}
    <div className="mt-4 text-center flex-shrink-0">
      <p className="text-xs text-gray-600 font-medium">
        Powered by patent pending technology
      </p>
    </div>
  </div>
</div>',
  'jsx',
  jsonb_build_object(
    'category', 'layout',
    'description', 'Standard single-screen layout pattern for HERA applications'
  )
);

-- Design Principles
INSERT INTO core_dynamic_data (
  id,
  entity_id,
  organization_id,
  field_name,
  field_value_text,
  field_type,
  metadata
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM core_entities WHERE entity_code = 'HERA-DESIGN-SYSTEM-v1'),
  (SELECT id FROM core_organizations WHERE organization_code = 'HERA-DNA-SYS'),
  'design_principles',
  jsonb_build_object(
    'gradient_first', 'Primary gradient from purple to cyan defines the HERA brand',
    'high_contrast', 'All text must maintain high contrast for readability - minimum gray-600',
    'mobile_first', 'Design for mobile screens first, enhance for desktop',
    'single_screen', 'Auth pages fit perfectly on one screen without scrolling',
    'subtle_animations', 'Animations should be slow (8s+) and gentle for professional feel',
    'enterprise_ready', 'Clean, professional appearance suitable for enterprise deployment'
  )::text,
  'json',
  jsonb_build_object(
    'category', 'principles',
    'description', 'Core design principles for HERA applications'
  )
);

-- Link to existing HERA DNA System
INSERT INTO core_relationships (
  id,
  from_entity_id,
  to_entity_id,
  relationship_type,
  organization_id,
  metadata
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM core_entities WHERE entity_code = 'HERA-DESIGN-SYSTEM-v1'),
  (SELECT id FROM core_entities WHERE entity_code = 'HERA-DNA-SYSTEM' AND entity_type = 'dna_system'),
  'part_of',
  (SELECT id FROM core_organizations WHERE organization_code = 'HERA-DNA-SYS'),
  jsonb_build_object(
    'integration_type', 'design_system',
    'priority', 'primary',
    'created_date', CURRENT_TIMESTAMP
  )
);

-- Create UI Component DNA entries for key components
-- HERA Gradient Background DNA
INSERT INTO core_entities (
  id,
  entity_type,
  entity_name,
  entity_code,
  organization_id,
  smart_code,
  metadata
) VALUES (
  gen_random_uuid(),
  'ui_component_dna',
  'HERA Gradient Background',
  'HERA-GRADIENT-BG-v1',
  (SELECT id FROM core_organizations WHERE organization_code = 'HERA-DNA-SYS'),
  'HERA.UI.GRADIENT.BACKGROUND.V1',
  jsonb_build_object(
    'component_type', 'background',
    'design_system', 'HERA-DESIGN-SYSTEM-v1'
  )
);

-- HERA Button DNA
INSERT INTO core_entities (
  id,
  entity_type,
  entity_name,
  entity_code,
  organization_id,
  smart_code,
  metadata
) VALUES (
  gen_random_uuid(),
  'ui_component_dna',
  'HERA Primary Button',
  'HERA-BUTTON-PRIMARY-v1',
  (SELECT id FROM core_organizations WHERE organization_code = 'HERA-DNA-SYS'),
  'HERA.UI.BUTTON.PRIMARY.V1',
  jsonb_build_object(
    'component_type', 'button',
    'design_system', 'HERA-DESIGN-SYSTEM-v1'
  )
);

-- HERA Input DNA
INSERT INTO core_entities (
  id,
  entity_type,
  entity_name,
  entity_code,
  organization_id,
  smart_code,
  metadata
) VALUES (
  gen_random_uuid(),
  'ui_component_dna',
  'HERA Input Field',
  'HERA-INPUT-FIELD-v1',
  (SELECT id FROM core_organizations WHERE organization_code = 'HERA-DNA-SYS'),
  'HERA.UI.INPUT.FIELD.V1',
  jsonb_build_object(
    'component_type', 'input',
    'design_system', 'HERA-DESIGN-SYSTEM-v1'
  )
);