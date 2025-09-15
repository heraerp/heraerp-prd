-- Seed three organizations for Salon (AED, Finance DNA enabled)
-- HO + two branches (codes: ORG-HO-DXB, ORG-BR-DXB1, ORG-BR-DXB2)

INSERT INTO core_organizations (
  organization_name,
  organization_code,
  organization_type,
  industry_classification,
  currency_code,
  timezone,
  status,
  settings,
  features_enabled
) VALUES
  (
    'Head Office (Dubai)',
    'ORG-HO-DXB',
    'services',
    'beauty_services',
    'AED',
    'Asia/Dubai',
    'active',
    jsonb_build_object('role','head_office','finance_dna_enabled',true,'country','AE'),
    jsonb_build_object('finance_dna',true)
  ),
  (
    'Branch 1 - Dubai Main',
    'ORG-BR-DXB1',
    'services',
    'beauty_services',
    'AED',
    'Asia/Dubai',
    'active',
    jsonb_build_object('role','branch','parent_org_code','ORG-HO-DXB','country','AE','area','Main'),
    jsonb_build_object('finance_dna',true)
  ),
  (
    'Branch 2 - Dubai Marina',
    'ORG-BR-DXB2',
    'services',
    'beauty_services',
    'AED',
    'Asia/Dubai',
    'active',
    jsonb_build_object('role','branch','parent_org_code','ORG-HO-DXB','country','AE','area','Marina'),
    jsonb_build_object('finance_dna',true)
  )
ON CONFLICT (organization_code) DO NOTHING;

-- Return inserted orgs for verification
SELECT organization_code, id, organization_name, currency_code, status
FROM core_organizations
WHERE organization_code IN ('ORG-HO-DXB','ORG-BR-DXB1','ORG-BR-DXB2')
ORDER BY organization_code;

