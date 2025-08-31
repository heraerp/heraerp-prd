-- HERA DNA UPDATE: High Contrast UI Patterns
-- Learning from Ice Cream Manufacturing Implementation
-- Date: 2025-08-30
-- Purpose: Ensure all HERA DNA generated UIs have proper contrast and visibility

BEGIN;

-- Insert UI Pattern DNA for High Contrast Dark Theme
INSERT INTO core_entities (
    id,
    organization_id,
    entity_type,
    entity_name,
    entity_code,
    smart_code,
    metadata
) VALUES (
    gen_random_uuid(),
    'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944', -- HERA System Organization
    'ui_pattern',
    'High Contrast Dark Theme Pattern',
    'UI-PATTERN-DARK-CONTRAST',
    'HERA.UI.PATTERN.DARK.CONTRAST.v1',
    jsonb_build_object(
        'pattern_type', 'theme',
        'description', 'High contrast dark theme with excellent readability',
        'color_scheme', jsonb_build_object(
            'backgrounds', jsonb_build_object(
                'primary', 'bg-gray-50 dark:bg-gray-900',
                'card', 'bg-white dark:bg-gray-800',
                'card_nested', 'bg-gray-50 dark:bg-gray-900',
                'sidebar', 'bg-gray-900',
                'header', 'bg-white dark:bg-gray-900'
            ),
            'text', jsonb_build_object(
                'primary', 'text-gray-900 dark:text-white',
                'primary_numbers', 'text-black dark:text-white',
                'secondary', 'text-gray-700 dark:text-gray-300',
                'tertiary', 'text-gray-600 dark:text-gray-400',
                'zero_values', 'text-gray-500 dark:text-gray-300',
                'sidebar_primary', 'text-gray-100',
                'sidebar_secondary', 'text-gray-300',
                'sidebar_inactive', 'text-gray-300 hover:text-gray-100'
            ),
            'borders', jsonb_build_object(
                'primary', 'border-gray-200 dark:border-gray-700',
                'sidebar', 'border-gray-800',
                'subtle', 'border-gray-100 dark:border-gray-800'
            ),
            'accents', jsonb_build_object(
                'primary_gradient', 'from-pink-500 to-purple-600',
                'secondary_gradient', 'from-cyan-500 to-blue-600',
                'success_gradient', 'from-green-500 to-emerald-600',
                'warning_gradient', 'from-yellow-500 to-orange-600'
            )
        ),
        'visibility_rules', jsonb_build_object(
            'always_use_high_contrast_for_numbers', true,
            'zero_values_need_special_treatment', true,
            'dark_sidebar_requires_light_text', true,
            'avoid_low_contrast_glass_effects', true
        )
    )
);

-- Insert Component DNA for Stats Card with Proper Contrast
INSERT INTO core_entities (
    id,
    organization_id,
    entity_type,
    entity_name,
    entity_code,
    smart_code,
    metadata
) VALUES (
    gen_random_uuid(),
    'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944',
    'ui_component',
    'High Contrast Stats Card',
    'UI-COMP-STATS-CARD-HC',
    'HERA.UI.COMPONENT.STATS.CARD.HC.v1',
    jsonb_build_object(
        'component_type', 'stats_card',
        'template', '
<Card className="bg-gray-800 border border-gray-700 shadow-sm hover:shadow-md transition-shadow">
  <CardHeader className="pb-2">
    <div className="flex items-center justify-between">
      <CardTitle className="text-sm font-medium text-gray-300">
        {title}
      </CardTitle>
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br {gradient} flex items-center justify-center shadow-sm">
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </CardHeader>
  <CardContent className="pt-0">
    <div className="text-4xl font-black tracking-tight">
      <span className={value === 0 ? "text-gray-300" : "text-white"}>
        {value}
      </span>
    </div>
    <p className="text-xs font-medium text-gray-400 mt-1">
      {change}
    </p>
  </CardContent>
</Card>',
        'props', jsonb_build_object(
            'title', 'string',
            'value', 'number',
            'change', 'string',
            'icon', 'LucideIcon',
            'gradient', 'string'
        ),
        'visibility_notes', 'Numbers use text-white for values > 0, text-gray-300 for zero values to ensure visibility on dark backgrounds'
    )
);

-- Insert Sidebar Navigation Pattern with High Contrast
INSERT INTO core_entities (
    id,
    organization_id,
    entity_type,
    entity_name,
    entity_code,
    smart_code,
    metadata
) VALUES (
    gen_random_uuid(),
    'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944',
    'ui_component',
    'High Contrast Sidebar Navigation',
    'UI-COMP-SIDEBAR-NAV-HC',
    'HERA.UI.COMPONENT.SIDEBAR.NAV.HC.v1',
    jsonb_build_object(
        'component_type', 'sidebar',
        'template', '
<div className="fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-gray-900 to-gray-950 border-r border-gray-800">
  {/* Logo Section */}
  <div className="h-16 px-6 border-b border-gray-800 flex items-center">
    <h2 className="text-lg font-bold text-gray-100">{appName}</h2>
    <p className="text-xs text-gray-400">{appSubtitle}</p>
  </div>
  
  {/* Navigation Items */}
  <nav className="mt-6 px-4">
    {navItems.map((item) => (
      <Link
        href={item.href}
        className={cn(
          "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
          isActive 
            ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg" 
            : "text-gray-300 hover:text-gray-100 hover:bg-gray-800"
        )}
      >
        <div className={cn(
          "mr-3 p-1.5 rounded-md transition-all duration-200",
          isActive ? "bg-white/20" : "bg-gray-800 group-hover:bg-gray-700"
        )}>
          <Icon className={cn(
            "h-4 w-4",
            isActive ? "text-white" : "text-gray-400 group-hover:text-gray-200"
          )} />
        </div>
        {item.name}
      </Link>
    ))}
  </nav>
</div>',
        'visibility_features', jsonb_build_object(
            'dark_background_with_gradient', 'from-gray-900 to-gray-950',
            'light_text_throughout', 'text-gray-100 to text-gray-300',
            'icon_containers_for_visibility', 'bg-gray-800 with hover states',
            'high_contrast_active_state', 'gradient background with white text'
        )
    )
);

-- Insert Dashboard Layout Pattern
INSERT INTO core_entities (
    id,
    organization_id,
    entity_type,
    entity_name,
    entity_code,
    smart_code,
    metadata
) VALUES (
    gen_random_uuid(),
    'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944',
    'ui_pattern',
    'High Contrast Dashboard Layout',
    'UI-PATTERN-DASHBOARD-HC',
    'HERA.UI.PATTERN.DASHBOARD.HC.v1',
    jsonb_build_object(
        'pattern_type', 'layout',
        'description', 'Dashboard layout with proper contrast for all elements',
        'structure', jsonb_build_object(
            'background', 'bg-gray-50 dark:bg-gray-900',
            'header', jsonb_build_object(
                'title', 'text-3xl font-bold text-gray-900 dark:text-gray-100',
                'subtitle', 'text-gray-600 dark:text-gray-400'
            ),
            'cards', jsonb_build_object(
                'background', 'bg-white dark:bg-gray-800',
                'border', 'border border-gray-200 dark:border-gray-700',
                'shadow', 'shadow-sm hover:shadow-md'
            ),
            'data_display', jsonb_build_object(
                'large_numbers', 'text-4xl font-black text-black dark:text-white',
                'percentages', 'text-2xl font-bold text-black dark:text-white',
                'currency', 'font-semibold text-black dark:text-white',
                'labels', 'text-sm font-medium text-gray-700 dark:text-gray-300'
            )
        ),
        'implementation_notes', ARRAY[
            'Always use dark:text-white for important numbers',
            'Zero values should use text-gray-300 in dark mode',
            'Avoid glass morphism effects that reduce contrast',
            'Ensure 4.5:1 contrast ratio for WCAG AA compliance',
            'Test all color combinations in both light and dark modes'
        ]
    )
);

-- Insert Color Contrast Guidelines
INSERT INTO core_entities (
    id,
    organization_id,
    entity_type,
    entity_name,
    entity_code,
    smart_code,
    metadata
) VALUES (
    gen_random_uuid(),
    'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944',
    'guideline',
    'HERA UI Contrast Guidelines',
    'GUIDELINE-UI-CONTRAST',
    'HERA.GUIDELINE.UI.CONTRAST.v1',
    jsonb_build_object(
        'version', '1.0',
        'principles', ARRAY[
            'Numbers and data must always have maximum contrast',
            'Dark backgrounds require light text (gray-100 to white)',
            'Zero or empty values need special visual treatment',
            'Sidebars should use inverted color schemes for clarity',
            'Avoid low-contrast combinations like gray-500 on gray-800'
        ],
        'dos', ARRAY[
            'Use text-white or text-gray-100 on dark backgrounds',
            'Use text-black or text-gray-900 on light backgrounds',
            'Add icon containers with subtle backgrounds for visibility',
            'Use font-bold or font-black for important numbers',
            'Test visibility with different screen brightness levels'
        ],
        'donts', ARRAY[
            'Don''t use glass morphism with low opacity on data',
            'Don''t use gradient text on critical information',
            'Don''t rely on color alone to convey information',
            'Don''t use text-gray-500 or darker on dark backgrounds',
            'Don''t mix light and dark themes in the same view'
        ],
        'accessibility', jsonb_build_object(
            'wcag_level', 'AA',
            'contrast_ratios', jsonb_build_object(
                'normal_text', '4.5:1',
                'large_text', '3:1',
                'ui_components', '3:1'
            )
        )
    )
);

-- Create relationships to link patterns
INSERT INTO core_relationships (
    from_entity_id,
    to_entity_id,
    relationship_type,
    smart_code,
    metadata
)
SELECT 
    theme.id,
    component.id,
    'implements_pattern',
    'HERA.REL.PATTERN.IMPLEMENTATION.v1',
    jsonb_build_object('implementation_type', 'theme_application')
FROM core_entities theme
CROSS JOIN core_entities component
WHERE theme.entity_code = 'UI-PATTERN-DARK-CONTRAST'
  AND component.entity_code IN ('UI-COMP-STATS-CARD-HC', 'UI-COMP-SIDEBAR-NAV-HC')
  AND theme.organization_id = 'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944'
  AND component.organization_id = 'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944';

COMMIT;

-- Usage Example Comment
/*
To use these patterns in HERA DNA generation:

1. When generating a dashboard:
   - Apply UI-PATTERN-DARK-CONTRAST color scheme
   - Use UI-COMP-STATS-CARD-HC for metrics
   - Use UI-COMP-SIDEBAR-NAV-HC for navigation

2. Key learnings embedded:
   - Dark mode by default with proper contrast
   - Special handling for zero values
   - Icon containers for better visibility
   - Consistent text hierarchy

3. This ensures all future HERA builds have:
   - Readable text on all backgrounds
   - Proper contrast ratios
   - Consistent visual hierarchy
   - Accessibility compliance
*/