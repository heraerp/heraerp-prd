# HERA Entity Diagrams

This directory contains automatically generated Mermaid diagrams for all HERA entity presets and architecture.

## 📊 Generated Files

### Architecture Diagrams
- `hera-6-tables.mmd/svg` - The Sacred Six tables foundation
- `global-entity-map.mmd/svg` - Complete entity relationship map

### Individual Entity Diagrams
- `product.mmd/svg` - Product management with pricing and inventory
- `service.mmd/svg` - Service catalog with duration and commission
- `customer.mmd/svg` - Customer profiles with loyalty and preferences  
- `employee.mmd/svg` - Staff management with roles and capabilities
- `appointment.mmd/svg` - Appointment scheduling system
- `vendor.mmd/svg` - Supplier and vendor management
- `category.mmd/svg` - Hierarchical categorization system
- `brand.mmd/svg` - Brand management with vendor relationships
- `role.mmd/svg` - Permission and role definitions

## 🔄 Regeneration

To update these diagrams when your entity presets change:

```bash
# Generate all diagrams
npm run docs:all-diagrams

# Individual entity diagrams only
npm run docs:diagrams

# Global relationship map only
npm run docs:global-graph
```

## 🎯 Key Features

- **Auto-Generated**: Read directly from your `entityPresets` registry
- **Always Current**: Update automatically when presets change
- **Professional Quality**: High-resolution SVG output ready for presentations
- **Smart Code Integration**: Relationships detected from HERA smart codes
- **Type Safe**: Uses your actual TypeScript interfaces
- **Zero Maintenance**: No manual diagram updates required

## 📖 Usage in Documentation

Include these diagrams in your documentation using:

```markdown
![Product Entity](./diagrams/product.svg)
![Global Entity Map](./diagrams/global-entity-map.svg)
```

## 🔧 Technical Details

- **Source**: Generated from `src/hooks/entityPresets.ts`
- **Engine**: Mermaid.js with `@mermaid-js/mermaid-cli`
- **Format**: Both `.mmd` source and `.svg` output
- **Styling**: Professional color scheme with consistent formatting
- **Dependencies**: Automatically installs required packages

---

*These diagrams prove that HERA's universal architecture can model any business complexity with just 6 tables!* 🚀