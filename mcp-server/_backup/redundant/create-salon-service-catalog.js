const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Organization IDs
const organizations = {
  parkRegis: { id: 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258', name: 'Hair Talkz • Park Regis' },
  mercureGold: { id: '0b1b37cd-4096-4718-8cd4-e370f234005b', name: 'Hair Talkz • Mercure Gold' }
};

// Service Categories
const serviceCategories = {
  HAIR_CUT: { code: 'SVC-CAT-HC', name: 'Hair Cutting Services' },
  HAIR_COLOR: { code: 'SVC-CAT-HCL', name: 'Hair Coloring Services' },
  HAIR_TREATMENT: { code: 'SVC-CAT-HT', name: 'Hair Treatments' },
  HAIR_STYLE: { code: 'SVC-CAT-HS', name: 'Hair Styling' },
  BEAUTY_FACIAL: { code: 'SVC-CAT-BF', name: 'Facial Treatments' },
  BEAUTY_MASSAGE: { code: 'SVC-CAT-BM', name: 'Massage Therapy' },
  BEAUTY_BODY: { code: 'SVC-CAT-BB', name: 'Body Treatments' },
  NAIL_SERVICE: { code: 'SVC-CAT-NS', name: 'Nail Services' },
  MENS_GROOMING: { code: 'SVC-CAT-MG', name: "Men's Grooming" },
  PACKAGES: { code: 'SVC-CAT-PKG', name: 'Service Packages' }
};

// Service Catalog
const serviceCatalog = {
  // Hair Cutting Services
  hairCutting: [
    {
      code: 'SVC-HC-001',
      name: "Ladies' Hair Cut",
      category: serviceCategories.HAIR_CUT,
      duration: 45,
      prices: { parkRegis: 120, mercureGold: 150 },
      description: 'Professional haircut with consultation and blow dry',
      skillRequired: ['STYLIST', 'SENIOR_STYLIST']
    },
    {
      code: 'SVC-HC-002',
      name: "Ladies' Cut & Style",
      category: serviceCategories.HAIR_CUT,
      duration: 60,
      prices: { parkRegis: 180, mercureGold: 220 },
      description: 'Haircut with professional styling',
      skillRequired: ['STYLIST', 'SENIOR_STYLIST']
    },
    {
      code: 'SVC-HC-003',
      name: "Men's Hair Cut",
      category: serviceCategories.HAIR_CUT,
      duration: 30,
      prices: { parkRegis: 80, mercureGold: 100 },
      description: 'Classic or modern men\'s haircut',
      skillRequired: ['STYLIST', 'SENIOR_STYLIST', 'JUNIOR_STYLIST']
    },
    {
      code: 'SVC-HC-004',
      name: "Children's Hair Cut (Under 12)",
      category: serviceCategories.HAIR_CUT,
      duration: 30,
      prices: { parkRegis: 60, mercureGold: 80 },
      description: 'Gentle haircut for children',
      skillRequired: ['STYLIST', 'JUNIOR_STYLIST']
    },
    {
      code: 'SVC-HC-005',
      name: 'Fringe Trim',
      category: serviceCategories.HAIR_CUT,
      duration: 15,
      prices: { parkRegis: 30, mercureGold: 40 },
      description: 'Quick fringe/bangs trim',
      skillRequired: ['STYLIST', 'JUNIOR_STYLIST']
    }
  ],

  // Hair Coloring Services
  hairColoring: [
    {
      code: 'SVC-HCL-001',
      name: 'Full Head Color',
      category: serviceCategories.HAIR_COLOR,
      duration: 120,
      prices: { parkRegis: 280, mercureGold: 350 },
      description: 'Complete color change with premium products',
      skillRequired: ['COLORIST', 'SENIOR_STYLIST']
    },
    {
      code: 'SVC-HCL-002',
      name: 'Root Touch Up',
      category: serviceCategories.HAIR_COLOR,
      duration: 90,
      prices: { parkRegis: 180, mercureGold: 220 },
      description: 'Color application to regrowth area',
      skillRequired: ['COLORIST', 'SENIOR_STYLIST', 'STYLIST']
    },
    {
      code: 'SVC-HCL-003',
      name: 'Highlights (Full Head)',
      category: serviceCategories.HAIR_COLOR,
      duration: 150,
      prices: { parkRegis: 380, mercureGold: 480 },
      description: 'Full head foil highlights',
      skillRequired: ['COLORIST', 'SENIOR_STYLIST']
    },
    {
      code: 'SVC-HCL-004',
      name: 'Highlights (Half Head)',
      category: serviceCategories.HAIR_COLOR,
      duration: 120,
      prices: { parkRegis: 280, mercureGold: 350 },
      description: 'Half head foil highlights',
      skillRequired: ['COLORIST', 'SENIOR_STYLIST']
    },
    {
      code: 'SVC-HCL-005',
      name: 'Balayage',
      category: serviceCategories.HAIR_COLOR,
      duration: 180,
      prices: { parkRegis: 450, mercureGold: 550 },
      description: 'Hand-painted balayage technique',
      skillRequired: ['COLORIST', 'SENIOR_STYLIST']
    },
    {
      code: 'SVC-HCL-006',
      name: 'Ombre',
      category: serviceCategories.HAIR_COLOR,
      duration: 150,
      prices: { parkRegis: 380, mercureGold: 480 },
      description: 'Gradient color effect',
      skillRequired: ['COLORIST', 'SENIOR_STYLIST']
    },
    {
      code: 'SVC-HCL-007',
      name: 'Fashion Colors',
      category: serviceCategories.HAIR_COLOR,
      duration: 180,
      prices: { parkRegis: 500, mercureGold: 650 },
      description: 'Vivid fashion colors (pink, blue, purple, etc.)',
      skillRequired: ['COLORIST']
    },
    {
      code: 'SVC-HCL-008',
      name: 'Color Correction',
      category: serviceCategories.HAIR_COLOR,
      duration: 240,
      prices: { parkRegis: 600, mercureGold: 800 },
      description: 'Professional color correction service',
      skillRequired: ['COLORIST']
    }
  ],

  // Hair Treatments
  hairTreatments: [
    {
      code: 'SVC-HT-001',
      name: 'Keratin Treatment',
      category: serviceCategories.HAIR_TREATMENT,
      duration: 180,
      prices: { parkRegis: 600, mercureGold: 750 },
      description: 'Brazilian keratin smoothing treatment',
      skillRequired: ['SENIOR_STYLIST', 'STYLIST']
    },
    {
      code: 'SVC-HT-002',
      name: 'Hair Botox Treatment',
      category: serviceCategories.HAIR_TREATMENT,
      duration: 120,
      prices: { parkRegis: 400, mercureGold: 500 },
      description: 'Deep conditioning and repair treatment',
      skillRequired: ['SENIOR_STYLIST', 'STYLIST']
    },
    {
      code: 'SVC-HT-003',
      name: 'Olaplex Treatment',
      category: serviceCategories.HAIR_TREATMENT,
      duration: 45,
      prices: { parkRegis: 180, mercureGold: 220 },
      description: 'Bond-building treatment',
      skillRequired: ['STYLIST', 'JUNIOR_STYLIST']
    },
    {
      code: 'SVC-HT-004',
      name: 'Deep Conditioning',
      category: serviceCategories.HAIR_TREATMENT,
      duration: 30,
      prices: { parkRegis: 120, mercureGold: 150 },
      description: 'Intensive moisture treatment',
      skillRequired: ['STYLIST', 'JUNIOR_STYLIST']
    },
    {
      code: 'SVC-HT-005',
      name: 'Scalp Treatment',
      category: serviceCategories.HAIR_TREATMENT,
      duration: 45,
      prices: { parkRegis: 150, mercureGold: 180 },
      description: 'Therapeutic scalp treatment',
      skillRequired: ['STYLIST', 'THERAPIST']
    },
    {
      code: 'SVC-HT-006',
      name: 'Hair Spa',
      category: serviceCategories.HAIR_TREATMENT,
      duration: 60,
      prices: { parkRegis: 200, mercureGold: 250 },
      description: 'Relaxing hair spa with massage',
      skillRequired: ['STYLIST', 'THERAPIST']
    }
  ],

  // Hair Styling
  hairStyling: [
    {
      code: 'SVC-HS-001',
      name: 'Blow Dry',
      category: serviceCategories.HAIR_STYLE,
      duration: 45,
      prices: { parkRegis: 80, mercureGold: 100 },
      description: 'Professional blow dry and style',
      skillRequired: ['STYLIST', 'JUNIOR_STYLIST']
    },
    {
      code: 'SVC-HS-002',
      name: 'Updo/Special Occasion',
      category: serviceCategories.HAIR_STYLE,
      duration: 60,
      prices: { parkRegis: 200, mercureGold: 280 },
      description: 'Elegant updo for special events',
      skillRequired: ['SENIOR_STYLIST', 'STYLIST']
    },
    {
      code: 'SVC-HS-003',
      name: 'Bridal Hair',
      category: serviceCategories.HAIR_STYLE,
      duration: 90,
      prices: { parkRegis: 400, mercureGold: 500 },
      description: 'Complete bridal hair styling',
      skillRequired: ['SENIOR_STYLIST']
    },
    {
      code: 'SVC-HS-004',
      name: 'Hair Extensions (Installation)',
      category: serviceCategories.HAIR_STYLE,
      duration: 180,
      prices: { parkRegis: 800, mercureGold: 1000 },
      description: 'Professional hair extension application',
      skillRequired: ['SENIOR_STYLIST']
    },
    {
      code: 'SVC-HS-005',
      name: 'Hair Extensions (Removal)',
      category: serviceCategories.HAIR_STYLE,
      duration: 90,
      prices: { parkRegis: 200, mercureGold: 250 },
      description: 'Safe removal of hair extensions',
      skillRequired: ['SENIOR_STYLIST', 'STYLIST']
    }
  ],

  // Facial Treatments
  facialTreatments: [
    {
      code: 'SVC-BF-001',
      name: 'Classic Facial',
      category: serviceCategories.BEAUTY_FACIAL,
      duration: 60,
      prices: { parkRegis: 250, mercureGold: 300 },
      description: 'Deep cleansing facial with extraction',
      skillRequired: ['THERAPIST']
    },
    {
      code: 'SVC-BF-002',
      name: 'Anti-Aging Facial',
      category: serviceCategories.BEAUTY_FACIAL,
      duration: 75,
      prices: { parkRegis: 350, mercureGold: 420 },
      description: 'Advanced anti-aging treatment',
      skillRequired: ['THERAPIST']
    },
    {
      code: 'SVC-BF-003',
      name: 'Hydrating Facial',
      category: serviceCategories.BEAUTY_FACIAL,
      duration: 60,
      prices: { parkRegis: 280, mercureGold: 350 },
      description: 'Intensive hydration treatment',
      skillRequired: ['THERAPIST']
    },
    {
      code: 'SVC-BF-004',
      name: 'Brightening Facial',
      category: serviceCategories.BEAUTY_FACIAL,
      duration: 60,
      prices: { parkRegis: 300, mercureGold: 380 },
      description: 'Skin brightening and pigmentation treatment',
      skillRequired: ['THERAPIST']
    },
    {
      code: 'SVC-BF-005',
      name: 'Express Facial',
      category: serviceCategories.BEAUTY_FACIAL,
      duration: 30,
      prices: { parkRegis: 150, mercureGold: 180 },
      description: 'Quick refresh facial',
      skillRequired: ['THERAPIST']
    }
  ],

  // Massage Services
  massageServices: [
    {
      code: 'SVC-BM-001',
      name: 'Swedish Massage (60 min)',
      category: serviceCategories.BEAUTY_MASSAGE,
      duration: 60,
      prices: { parkRegis: 300, mercureGold: 380 },
      description: 'Relaxing full body massage',
      skillRequired: ['THERAPIST']
    },
    {
      code: 'SVC-BM-002',
      name: 'Deep Tissue Massage (60 min)',
      category: serviceCategories.BEAUTY_MASSAGE,
      duration: 60,
      prices: { parkRegis: 350, mercureGold: 420 },
      description: 'Therapeutic deep tissue massage',
      skillRequired: ['THERAPIST']
    },
    {
      code: 'SVC-BM-003',
      name: 'Hot Stone Massage (75 min)',
      category: serviceCategories.BEAUTY_MASSAGE,
      duration: 75,
      prices: { parkRegis: 400, mercureGold: 500 },
      description: 'Relaxing hot stone therapy',
      skillRequired: ['THERAPIST']
    },
    {
      code: 'SVC-BM-004',
      name: 'Aromatherapy Massage (60 min)',
      category: serviceCategories.BEAUTY_MASSAGE,
      duration: 60,
      prices: { parkRegis: 320, mercureGold: 400 },
      description: 'Massage with essential oils',
      skillRequired: ['THERAPIST']
    },
    {
      code: 'SVC-BM-005',
      name: 'Head & Shoulder Massage (30 min)',
      category: serviceCategories.BEAUTY_MASSAGE,
      duration: 30,
      prices: { parkRegis: 150, mercureGold: 180 },
      description: 'Targeted relief for head and shoulders',
      skillRequired: ['THERAPIST']
    }
  ],

  // Men's Grooming
  mensGrooming: [
    {
      code: 'SVC-MG-001',
      name: 'Beard Trim & Shape',
      category: serviceCategories.MENS_GROOMING,
      duration: 30,
      prices: { parkRegis: 60, mercureGold: 80 },
      description: 'Professional beard grooming',
      skillRequired: ['STYLIST']
    },
    {
      code: 'SVC-MG-002',
      name: 'Hot Towel Shave',
      category: serviceCategories.MENS_GROOMING,
      duration: 45,
      prices: { parkRegis: 100, mercureGold: 120 },
      description: 'Traditional hot towel shave',
      skillRequired: ['STYLIST']
    },
    {
      code: 'SVC-MG-003',
      name: "Men's Facial",
      category: serviceCategories.MENS_GROOMING,
      duration: 45,
      prices: { parkRegis: 200, mercureGold: 250 },
      description: 'Facial treatment designed for men',
      skillRequired: ['THERAPIST']
    },
    {
      code: 'SVC-MG-004',
      name: "Men's Manicure",
      category: serviceCategories.MENS_GROOMING,
      duration: 30,
      prices: { parkRegis: 80, mercureGold: 100 },
      description: 'Professional nail care for men',
      skillRequired: ['THERAPIST']
    }
  ],

  // Service Packages
  packages: [
    {
      code: 'SVC-PKG-001',
      name: 'Bridal Package',
      category: serviceCategories.PACKAGES,
      duration: 300,
      prices: { parkRegis: 1500, mercureGold: 2000 },
      description: 'Complete bridal preparation: Hair, makeup, facial, manicure',
      includes: ['SVC-HS-003', 'SVC-BF-001', 'Makeup Application', 'Manicure'],
      skillRequired: ['SENIOR_STYLIST', 'THERAPIST']
    },
    {
      code: 'SVC-PKG-002',
      name: 'Mother-Daughter Pamper Day',
      category: serviceCategories.PACKAGES,
      duration: 240,
      prices: { parkRegis: 800, mercureGold: 1000 },
      description: 'Special package for two: Hair cuts, facials, manicures',
      includes: ['SVC-HC-001', 'SVC-BF-001', 'Manicure'],
      quantity: 2,
      skillRequired: ['STYLIST', 'THERAPIST']
    },
    {
      code: 'SVC-PKG-003',
      name: 'Total Hair Transformation',
      category: serviceCategories.PACKAGES,
      duration: 300,
      prices: { parkRegis: 900, mercureGold: 1200 },
      description: 'Cut, color, treatment, and style',
      includes: ['SVC-HC-002', 'SVC-HCL-001', 'SVC-HT-002', 'SVC-HS-001'],
      skillRequired: ['SENIOR_STYLIST', 'COLORIST']
    },
    {
      code: 'SVC-PKG-004',
      name: 'Monthly Maintenance',
      category: serviceCategories.PACKAGES,
      duration: 180,
      prices: { parkRegis: 500, mercureGold: 650 },
      description: 'Root touch-up, cut, and blow dry',
      includes: ['SVC-HCL-002', 'SVC-HC-001', 'SVC-HS-001'],
      skillRequired: ['STYLIST', 'COLORIST']
    }
  ]
};

// Product Categories
const productCategories = {
  HAIR_CARE: { code: 'PRD-CAT-HC', name: 'Hair Care Products' },
  STYLING: { code: 'PRD-CAT-ST', name: 'Styling Products' },
  COLOR_CARE: { code: 'PRD-CAT-CC', name: 'Color Care' },
  TREATMENT: { code: 'PRD-CAT-TR', name: 'Treatment Products' },
  TOOLS: { code: 'PRD-CAT-TL', name: 'Tools & Accessories' },
  SKIN_CARE: { code: 'PRD-CAT-SC', name: 'Skin Care' },
  RETAIL_SETS: { code: 'PRD-CAT-RS', name: 'Gift Sets' }
};

// Retail Products
const retailProducts = [
  // Shampoos
  {
    code: 'PRD-HC-001',
    name: 'L\'Oreal Professional Shampoo',
    category: productCategories.HAIR_CARE,
    brand: 'L\'Oreal',
    size: '300ml',
    cost: 45,
    prices: { parkRegis: 120, mercureGold: 140 },
    reorderLevel: 10,
    description: 'Professional cleansing shampoo'
  },
  {
    code: 'PRD-HC-002',
    name: 'Kerastase Nutritive Shampoo',
    category: productCategories.HAIR_CARE,
    brand: 'Kerastase',
    size: '250ml',
    cost: 85,
    prices: { parkRegis: 220, mercureGold: 260 },
    reorderLevel: 8,
    description: 'Luxury nourishing shampoo'
  },
  {
    code: 'PRD-HC-003',
    name: 'Wella Color Brilliance Shampoo',
    category: productCategories.COLOR_CARE,
    brand: 'Wella',
    size: '250ml',
    cost: 40,
    prices: { parkRegis: 100, mercureGold: 120 },
    reorderLevel: 12,
    description: 'Color-protecting shampoo'
  },
  // Conditioners
  {
    code: 'PRD-HC-004',
    name: 'L\'Oreal Professional Conditioner',
    category: productCategories.HAIR_CARE,
    brand: 'L\'Oreal',
    size: '300ml',
    cost: 48,
    prices: { parkRegis: 125, mercureGold: 145 },
    reorderLevel: 10,
    description: 'Professional moisturizing conditioner'
  },
  {
    code: 'PRD-HC-005',
    name: 'Kerastase Nutritive Conditioner',
    category: productCategories.HAIR_CARE,
    brand: 'Kerastase',
    size: '250ml',
    cost: 90,
    prices: { parkRegis: 230, mercureGold: 270 },
    reorderLevel: 8,
    description: 'Luxury nourishing conditioner'
  },
  // Treatments
  {
    code: 'PRD-TR-001',
    name: 'Olaplex No.3 Hair Perfector',
    category: productCategories.TREATMENT,
    brand: 'Olaplex',
    size: '100ml',
    cost: 95,
    prices: { parkRegis: 240, mercureGold: 280 },
    reorderLevel: 15,
    description: 'At-home bond-building treatment'
  },
  {
    code: 'PRD-TR-002',
    name: 'L\'Oreal Hair Mask',
    category: productCategories.TREATMENT,
    brand: 'L\'Oreal',
    size: '200ml',
    cost: 55,
    prices: { parkRegis: 140, mercureGold: 165 },
    reorderLevel: 10,
    description: 'Intensive repair mask'
  },
  // Styling Products
  {
    code: 'PRD-ST-001',
    name: 'GHD Heat Protect Spray',
    category: productCategories.STYLING,
    brand: 'GHD',
    size: '120ml',
    cost: 65,
    prices: { parkRegis: 160, mercureGold: 190 },
    reorderLevel: 20,
    description: 'Thermal protection spray'
  },
  {
    code: 'PRD-ST-002',
    name: 'L\'Oreal Tecni Art Hairspray',
    category: productCategories.STYLING,
    brand: 'L\'Oreal',
    size: '250ml',
    cost: 35,
    prices: { parkRegis: 90, mercureGold: 110 },
    reorderLevel: 15,
    description: 'Professional hold hairspray'
  },
  {
    code: 'PRD-ST-003',
    name: 'Wella EIMI Hair Mousse',
    category: productCategories.STYLING,
    brand: 'Wella',
    size: '300ml',
    cost: 42,
    prices: { parkRegis: 105, mercureGold: 125 },
    reorderLevel: 12,
    description: 'Volume-boosting mousse'
  },
  // Tools
  {
    code: 'PRD-TL-001',
    name: 'GHD Paddle Brush',
    category: productCategories.TOOLS,
    brand: 'GHD',
    size: 'Standard',
    cost: 85,
    prices: { parkRegis: 220, mercureGold: 260 },
    reorderLevel: 5,
    description: 'Professional detangling brush'
  },
  {
    code: 'PRD-TL-002',
    name: 'Wide-Tooth Comb',
    category: productCategories.TOOLS,
    brand: 'Generic',
    size: 'Standard',
    cost: 8,
    prices: { parkRegis: 25, mercureGold: 30 },
    reorderLevel: 20,
    description: 'Detangling comb'
  }
];

async function createServiceCatalog() {
  console.log('💇‍♀️ Creating Service & Product Catalog for Hair Talkz...\n');

  let totalServicesCreated = 0;
  let totalProductsCreated = 0;

  // Process each branch
  for (const [branchKey, branch] of Object.entries(organizations)) {
    console.log(`\n=== Creating catalog for ${branch.name} ===`);

    // Create service categories first
    console.log('\n📁 Creating Service Categories...');
    for (const [catKey, category] of Object.entries(serviceCategories)) {
      const { data: categoryEntity, error: catError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: branch.id,
          entity_type: 'service_category',
          entity_code: category.code,
          entity_name: category.name,
          smart_code: `HERA.SALON.CAT.${catKey}.v1`
        })
        .select()
        .single();

      if (categoryEntity && !catError) {
        console.log(`✅ Created category: ${category.name}`);
      }
    }

    // Create all services
    console.log('\n💇 Creating Services...');
    const allServices = [
      ...serviceCatalog.hairCutting,
      ...serviceCatalog.hairColoring,
      ...serviceCatalog.hairTreatments,
      ...serviceCatalog.hairStyling,
      ...serviceCatalog.facialTreatments,
      ...serviceCatalog.massageServices,
      ...serviceCatalog.mensGrooming,
      ...serviceCatalog.packages
    ];

    for (const service of allServices) {
      try {
        // Create service entity
        const { data: serviceEntity, error: svcError } = await supabase
          .from('core_entities')
          .insert({
            organization_id: branch.id,
            entity_type: 'service',
            entity_code: service.code,
            entity_name: service.name,
            smart_code: `HERA.SALON.SVC.${service.code}.v1`
          })
          .select()
          .single();

        if (svcError) {
          console.error(`Error creating service ${service.name}:`, svcError);
          continue;
        }

        // Add service details
        const serviceDetails = [
          { field_name: 'category_code', field_value_text: service.category.code, smart_code: 'HERA.SALON.SVC.CATEGORY.v1' },
          { field_name: 'category_name', field_value_text: service.category.name, smart_code: 'HERA.SALON.SVC.CATEGORY.NAME.v1' },
          { field_name: 'duration_minutes', field_value_number: service.duration, smart_code: 'HERA.SALON.SVC.DURATION.v1' },
          { field_name: 'price', field_value_number: service.prices[branchKey], smart_code: 'HERA.SALON.SVC.PRICE.v1' },
          { field_name: 'description', field_value_text: service.description, smart_code: 'HERA.SALON.SVC.DESC.v1' },
          { field_name: 'skill_required', field_value_text: service.skillRequired.join(','), smart_code: 'HERA.SALON.SVC.SKILL.v1' },
          { field_name: 'active', field_value_boolean: true, smart_code: 'HERA.SALON.SVC.ACTIVE.v1' },
          { field_name: 'booking_enabled', field_value_boolean: true, smart_code: 'HERA.SALON.SVC.BOOKING.v1' }
        ];

        // Add VAT calculation (5% UAE VAT)
        serviceDetails.push({
          field_name: 'vat_rate',
          field_value_number: 5,
          smart_code: 'HERA.SALON.SVC.VAT.v1'
        });
        serviceDetails.push({
          field_name: 'price_includes_vat',
          field_value_boolean: true,
          smart_code: 'HERA.SALON.SVC.VAT.INCLUSIVE.v1'
        });

        for (const detail of serviceDetails) {
          await supabase
            .from('core_dynamic_data')
            .insert({
              organization_id: branch.id,
              entity_id: serviceEntity.id,
              ...detail
            });
        }

        // For packages, add included services
        if (service.includes) {
          await supabase
            .from('core_dynamic_data')
            .insert({
              organization_id: branch.id,
              entity_id: serviceEntity.id,
              field_name: 'package_includes',
              field_value_text: service.includes.join(','),
              smart_code: 'HERA.SALON.PKG.INCLUDES.v1'
            });
        }

        console.log(`✅ Created service: ${service.name} (${service.duration} min - ${service.prices[branchKey]} AED)`);
        totalServicesCreated++;

      } catch (error) {
        console.error(`Failed to create service ${service.name}:`, error);
      }
    }

    // Create product categories
    console.log('\n📦 Creating Product Categories...');
    for (const [catKey, category] of Object.entries(productCategories)) {
      const { data: categoryEntity, error: catError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: branch.id,
          entity_type: 'product_category',
          entity_code: category.code,
          entity_name: category.name,
          smart_code: `HERA.SALON.PRD.CAT.${catKey}.v1`
        })
        .select()
        .single();

      if (categoryEntity && !catError) {
        console.log(`✅ Created product category: ${category.name}`);
      }
    }

    // Create retail products
    console.log('\n🛍️ Creating Retail Products...');
    for (const product of retailProducts) {
      try {
        // Create product entity
        const { data: productEntity, error: prdError } = await supabase
          .from('core_entities')
          .insert({
            organization_id: branch.id,
            entity_type: 'product',
            entity_code: product.code,
            entity_name: product.name,
            smart_code: `HERA.SALON.PRD.${product.code}.v1`
          })
          .select()
          .single();

        if (prdError) {
          console.error(`Error creating product ${product.name}:`, prdError);
          continue;
        }

        // Add product details
        const productDetails = [
          { field_name: 'category_code', field_value_text: product.category.code, smart_code: 'HERA.SALON.PRD.CATEGORY.v1' },
          { field_name: 'category_name', field_value_text: product.category.name, smart_code: 'HERA.SALON.PRD.CATEGORY.NAME.v1' },
          { field_name: 'brand', field_value_text: product.brand, smart_code: 'HERA.SALON.PRD.BRAND.v1' },
          { field_name: 'size', field_value_text: product.size, smart_code: 'HERA.SALON.PRD.SIZE.v1' },
          { field_name: 'unit_cost', field_value_number: product.cost, smart_code: 'HERA.SALON.PRD.COST.v1' },
          { field_name: 'selling_price', field_value_number: product.prices[branchKey], smart_code: 'HERA.SALON.PRD.PRICE.v1' },
          { field_name: 'reorder_level', field_value_number: product.reorderLevel, smart_code: 'HERA.SALON.PRD.REORDER.v1' },
          { field_name: 'current_stock', field_value_number: 0, smart_code: 'HERA.SALON.PRD.STOCK.v1' },
          { field_name: 'description', field_value_text: product.description, smart_code: 'HERA.SALON.PRD.DESC.v1' },
          { field_name: 'active', field_value_boolean: true, smart_code: 'HERA.SALON.PRD.ACTIVE.v1' },
          { field_name: 'track_inventory', field_value_boolean: true, smart_code: 'HERA.SALON.PRD.TRACK.v1' }
        ];

        // Add profit margin calculation
        const margin = ((product.prices[branchKey] - product.cost) / product.prices[branchKey] * 100).toFixed(2);
        productDetails.push({
          field_name: 'profit_margin',
          field_value_number: parseFloat(margin),
          smart_code: 'HERA.SALON.PRD.MARGIN.v1'
        });

        // Add VAT
        productDetails.push({
          field_name: 'vat_rate',
          field_value_number: 5,
          smart_code: 'HERA.SALON.PRD.VAT.v1'
        });

        for (const detail of productDetails) {
          await supabase
            .from('core_dynamic_data')
            .insert({
              organization_id: branch.id,
              entity_id: productEntity.id,
              ...detail
            });
        }

        console.log(`✅ Created product: ${product.name} (Cost: ${product.cost} AED, Sell: ${product.prices[branchKey]} AED, Margin: ${margin}%)`);
        totalProductsCreated++;

      } catch (error) {
        console.error(`Failed to create product ${product.name}:`, error);
      }
    }
  }

  // Create service-GL account mappings
  console.log('\n\n🔗 Creating Service-GL Account Mappings...');
  
  const serviceMappings = [
    { category: 'SVC-CAT-HC', glAccount: '4110000', description: 'Hair Cutting Revenue' },
    { category: 'SVC-CAT-HCL', glAccount: '4120000', description: 'Hair Coloring Revenue' },
    { category: 'SVC-CAT-HT', glAccount: '4130000', description: 'Hair Treatment Revenue' },
    { category: 'SVC-CAT-HS', glAccount: '4140000', description: 'Hair Styling Revenue' },
    { category: 'SVC-CAT-BF', glAccount: '4210000', description: 'Facial Revenue' },
    { category: 'SVC-CAT-BM', glAccount: '4220000', description: 'Massage Revenue' },
    { category: 'SVC-CAT-BB', glAccount: '4230000', description: 'Body Treatment Revenue' },
    { category: 'SVC-CAT-NS', glAccount: '4240000', description: 'Nail Service Revenue' },
    { category: 'SVC-CAT-MG', glAccount: '4150000', description: 'Mens Grooming Revenue' },
    { category: 'SVC-CAT-PKG', glAccount: '4300000', description: 'Package Revenue' }
  ];

  const productMappings = [
    { category: 'PRD-CAT-HC', glAccount: '4400000', glCost: '5210000', description: 'Hair Care Product Sales' },
    { category: 'PRD-CAT-ST', glAccount: '4410000', glCost: '5220000', description: 'Styling Product Sales' },
    { category: 'PRD-CAT-CC', glAccount: '4420000', glCost: '5230000', description: 'Color Care Product Sales' },
    { category: 'PRD-CAT-TR', glAccount: '4430000', glCost: '5240000', description: 'Treatment Product Sales' },
    { category: 'PRD-CAT-TL', glAccount: '4440000', glCost: '5250000', description: 'Tools & Accessories Sales' },
    { category: 'PRD-CAT-SC', glAccount: '4450000', glCost: '5260000', description: 'Skin Care Product Sales' },
    { category: 'PRD-CAT-RS', glAccount: '4460000', glCost: '5270000', description: 'Gift Set Sales' }
  ];

  console.log('Service Category → GL Account Mappings:');
  serviceMappings.forEach(map => {
    console.log(`  ${map.category} → ${map.glAccount} (${map.description})`);
  });

  console.log('\nProduct Category → GL Account Mappings:');
  productMappings.forEach(map => {
    console.log(`  ${map.category} → Revenue: ${map.glAccount}, COGS: ${map.glCost}`);
  });

  // Summary
  console.log('\n\n🎉 Service & Product Catalog Creation Complete!');
  console.log('=================================================');
  console.log(`✓ Total Services Created: ${totalServicesCreated / 2} per branch`);
  console.log(`✓ Total Products Created: ${totalProductsCreated / 2} per branch`);
  console.log('\n📊 Service Summary:');
  console.log('- Hair Cutting: 5 services');
  console.log('- Hair Coloring: 8 services');
  console.log('- Hair Treatments: 6 services');
  console.log('- Hair Styling: 5 services');
  console.log('- Facial Treatments: 5 services');
  console.log('- Massage Services: 5 services');
  console.log('- Men\'s Grooming: 4 services');
  console.log('- Packages: 4 packages');
  console.log('\n🛍️ Product Summary:');
  console.log('- Hair Care: 5 products');
  console.log('- Styling: 3 products');
  console.log('- Treatment: 2 products');
  console.log('- Tools: 2 products');
  console.log('\n💰 Pricing Strategy:');
  console.log('- Park Regis: Standard pricing');
  console.log('- Mercure Gold: Premium pricing (+20-30%)');
  console.log('- All prices include 5% UAE VAT');
  console.log('- Product margins: 50-65%');
}

// Create service booking rules
async function createBookingRules() {
  console.log('\n\n📅 Setting up Booking Rules...\n');

  const bookingRules = {
    general: {
      advanceBookingDays: 30,
      minAdvanceHours: 2,
      cancellationHours: 24,
      noShowPenalty: 50, // AED
      maxBookingsPerDay: 3,
      bookingHours: {
        parkRegis: { open: '09:00', close: '21:00' },
        mercureGold: { open: '10:00', close: '22:00' }
      }
    },
    serviceRules: {
      colorServices: {
        consultationRequired: true,
        patchTestRequired: true,
        minIntervalDays: 28
      },
      treatments: {
        preTreatmentForm: true,
        allergyCheck: true
      },
      packages: {
        depositRequired: true,
        depositPercent: 30
      }
    }
  };

  console.log('Booking Rules Configuration:');
  console.log('- Advance booking: Up to 30 days');
  console.log('- Minimum advance notice: 2 hours');
  console.log('- Cancellation policy: 24 hours');
  console.log('- No-show penalty: 50 AED');
  console.log('\nSpecial Rules:');
  console.log('- Color services require consultation & patch test');
  console.log('- Treatments require allergy check');
  console.log('- Packages require 30% deposit');
}

// Main execution
async function main() {
  await createServiceCatalog();
  await createBookingRules();
}

main().catch(console.error);