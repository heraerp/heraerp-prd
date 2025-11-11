-- Organization Branding Table for Dynamic Branding Engine
-- Stores branding configuration per organization (completely data-driven)

CREATE TABLE IF NOT EXISTS organization_branding (
  organization_id UUID PRIMARY KEY REFERENCES core_organizations(id) ON DELETE CASCADE,
  organization_name TEXT NOT NULL,
  domain_name TEXT,
  custom_domain TEXT,
  is_white_label BOOLEAN DEFAULT FALSE,
  
  -- Theme Configuration (JSON)
  theme JSONB NOT NULL DEFAULT '{
    "primary_color": "#3b82f6",
    "secondary_color": "#64748b", 
    "accent_color": "#10b981",
    "success_color": "#10b981",
    "warning_color": "#f59e0b",
    "error_color": "#ef4444",
    "background_color": "#ffffff",
    "surface_color": "#f9fafb",
    "text_primary": "#111827",
    "text_secondary": "#6b7280",
    "border_color": "#e5e7eb",
    "font_family_heading": "Inter",
    "font_family_body": "Inter",
    "font_size_base": "16px",
    "line_height_base": "1.5",
    "border_radius": "8px",
    "shadow_intensity": "medium",
    "theme_mode": "light",
    "animations_enabled": true,
    "reduced_motion": false,
    "high_contrast": false
  }',
  
  -- SEO & Meta
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[],
  
  -- Legal
  privacy_policy_url TEXT,
  terms_of_service_url TEXT,
  copyright_text TEXT DEFAULT '© 2025 HERA Platform. All rights reserved.',
  
  -- Contact
  support_email TEXT,
  support_phone TEXT,
  support_url TEXT,
  
  -- Social Links (JSON)
  social_links JSONB DEFAULT '{}',
  
  -- Feature Flags (JSON)
  feature_flags JSONB DEFAULT '{}',
  
  -- Analytics
  google_analytics_id TEXT,
  facebook_pixel_id TEXT,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  
  -- Constraints
  CONSTRAINT valid_theme_colors CHECK (
    theme->>'primary_color' ~ '^#[0-9a-fA-F]{6}$' AND
    theme->>'secondary_color' ~ '^#[0-9a-fA-F]{6}$' AND
    theme->>'accent_color' ~ '^#[0-9a-fA-F]{6}$'
  ),
  CONSTRAINT valid_font_sizes CHECK (
    theme->>'font_size_base' ~ '^\d+px$'
  )
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_organization_branding_custom_domain 
ON organization_branding(custom_domain) WHERE custom_domain IS NOT NULL;

-- Index for white-label filtering
CREATE INDEX IF NOT EXISTS idx_organization_branding_white_label 
ON organization_branding(is_white_label) WHERE is_white_label = TRUE;

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_organization_branding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organization_branding_updated_at
  BEFORE UPDATE ON organization_branding
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_branding_updated_at();

-- RLS Policies
ALTER TABLE organization_branding ENABLE ROW LEVEL SECURITY;

-- Allow organization members to read their branding
CREATE POLICY "Users can read their organization branding" ON organization_branding
  FOR SELECT 
  USING (
    organization_id IN (
      SELECT r.target_entity_id 
      FROM core_relationships r 
      WHERE r.source_entity_id = auth.uid() 
      AND r.relationship_type = 'MEMBER_OF'
    )
  );

-- Allow organization admins to manage their branding
CREATE POLICY "Admins can manage their organization branding" ON organization_branding
  FOR ALL 
  USING (
    organization_id IN (
      SELECT r.target_entity_id 
      FROM core_relationships r 
      WHERE r.source_entity_id = auth.uid() 
      AND r.relationship_type = 'MEMBER_OF'
      AND r.relationship_data->>'role' IN ('owner', 'admin')
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON organization_branding TO authenticated;

-- Comments
COMMENT ON TABLE organization_branding IS 'Stores branding configuration for each organization (completely data-driven)';
COMMENT ON COLUMN organization_branding.theme IS 'Complete theme configuration as JSON (colors, fonts, layout, etc.)';
COMMENT ON COLUMN organization_branding.feature_flags IS 'Organization-specific feature toggles';
COMMENT ON COLUMN organization_branding.social_links IS 'Social media links and contact information';