# COMPONENT DNA LIBRARY REFERENCE

## 🧬 Complete UI Component DNA Catalog

### **Glass Panel Component - HERA.UI.GLASS.PANEL.v1**

**Purpose**: Universal glassmorphism container for any content

**DNA Query**: 
```sql
SELECT claude_get_component_dna('HERA.UI.GLASS.PANEL.v1');
```

**Usage Examples**:
```typescript
// Restaurant context
<GlassPanel variant="primary">
  <MenuItemCard item={menuItem} />
</GlassPanel>

// Healthcare context  
<GlassPanel elevation="high">
  <PatientProfile patient={patient} />
</GlassPanel>

// Manufacturing context
<GlassPanel blur="medium">
  <ProductionMetrics />
</GlassPanel>
```

**CSS DNA Features**:
- Semi-transparent backgrounds: `rgba(255, 255, 255, 0.1)`
- Backdrop blur: `blur(20px)` 
- Soft borders: `1px solid rgba(255, 255, 255, 0.2)`
- Elevated shadows: `0 8px 32px rgba(0, 0, 0, 0.1)`
- Hover animations: `translateY(-2px)` with smooth transitions

### **Glass Navigation - HERA.UI.GLASS.NAVBAR.FIORI.v1**

**Purpose**: SAP Fiori shell bar with glassmorphism styling

**Fiori Structure**:
- **Left Section**: Back button, app title, breadcrumb
- **Center Section**: Global search
- **Right Section**: Notifications, user menu, settings

**Glassmorphism Styling**:
- Ultra-transparent background: `rgba(255, 255, 255, 0.05)`
- Heavy backdrop blur: `blur(30px)`
- Minimal border: `1px solid rgba(255, 255, 255, 0.1)`

### **Glass Responsive Table - HERA.UI.GLASS.TABLE.FIORI.RESPONSIVE.v1**

**Purpose**: Enterprise data table with glassmorphism + micro charts

**Fiori Features**:
- Multi-column sorting
- Advanced filtering with value help
- Smart pagination
- Column personalization
- Export capabilities (Excel, PDF, CSV)

**Micro Charts Support**:
- Bullet charts for KPIs
- Line charts for trends  
- Comparison charts for analysis
- Radial charts for completion status

### **Complete Design System - HERA.DESIGN.GLASSMORPHISM.FIORI.v1**

**Color System**:
```css
/* Glass backgrounds */
--glass-primary: rgba(255, 255, 255, 0.1);
--glass-secondary: rgba(255, 255, 255, 0.05);
--glass-accent: rgba(59, 130, 246, 0.15);

/* Blur levels */
--blur-light: blur(10px);
--blur-medium: blur(20px); 
--blur-heavy: blur(30px);

/* Elevation shadows */
--shadow-low: 0 4px 16px rgba(0, 0, 0, 0.05);
--shadow-medium: 0 8px 32px rgba(0, 0, 0, 0.1);
--shadow-high: 0 16px 48px rgba(0, 0, 0, 0.15);
```

**Typography System**:
- Primary Font: Inter, system-ui, sans-serif
- Monospace: JetBrains Mono, monospace
- Weights: 300 (light) to 700 (bold)
- Sizes: 0.75rem (xs) to 1.875rem (3xl)

**Animation System**:
- Fast transitions: 0.15s cubic-bezier(0.4, 0, 0.2, 1)
- Normal transitions: 0.3s cubic-bezier(0.4, 0, 0.2, 1) 
- Slow transitions: 0.5s cubic-bezier(0.4, 0, 0.2, 1)

## 🔄 Using Component DNA in Development

### **Load Complete DNA Context**:
```sql
SELECT claude_load_dna_context('complete');
```

### **Get Specific Component**:
```sql
SELECT claude_get_component_dna('HERA.UI.GLASS.PANEL.v1');
```

### **Apply to Business Context**:
Claude CLI automatically applies DNA patterns to any business context:
- Restaurant POS systems
- Healthcare patient management
- Manufacturing production tracking
- Legal case management
- Retail e-commerce platforms

### **Store New Patterns**:
When Claude creates new components, they're automatically stored in the DNA library for future reuse across all projects.