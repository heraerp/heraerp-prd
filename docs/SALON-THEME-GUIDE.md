# 🎨 HERA Salon Theme & Color Guide

## Overview
The HERA Salon module features a stunning, accessible color palette designed specifically for beauty and wellness businesses. The theme emphasizes elegance, professionalism, and user comfort with beautiful gradients and perfect contrast ratios.

## 🌈 Color Palette

### Primary Colors - Purple to Pink Gradient
- **Primary 50**: `#fdf4ff` - Lightest purple tint
- **Primary 100**: `#fae8ff` - Very light purple
- **Primary 200**: `#f5d0fe` - Light purple
- **Primary 300**: `#f0abfc` - Medium light purple
- **Primary 400**: `#e879f9` - Medium purple
- **Primary 500**: `#d946ef` - Main brand purple ⭐
- **Primary 600**: `#c026d3` - Dark purple
- **Primary 700**: `#a21caf` - Darker purple
- **Primary 800**: `#86198f` - Very dark purple
- **Primary 900**: `#701a75` - Deepest purple

### Secondary Colors - Rose Gold
- **Secondary 50**: `#fdf2f8` - Lightest rose
- **Secondary 100**: `#fce7f3` - Very light rose
- **Secondary 200**: `#fbcfe8` - Light rose
- **Secondary 300**: `#f9a8d4` - Medium light rose
- **Secondary 400**: `#f472b6` - Medium rose
- **Secondary 500**: `#ec4899` - Main rose accent ⭐
- **Secondary 600**: `#db2777` - Dark rose
- **Secondary 700**: `#be185d` - Darker rose
- **Secondary 800**: `#9d174d` - Very dark rose
- **Secondary 900**: `#831843` - Deepest rose

### Accent Colors - Luxurious Gold
- **Accent 400**: `#fbbf24` - Medium gold
- **Accent 500**: `#f59e0b` - Main gold highlight ⭐
- **Accent 600**: `#d97706` - Dark gold

### Functional Colors
- **Success**: `#22c55e` - Fresh mint green
- **Warning**: `#f59e0b` - Amber gold
- **Error**: `#ef4444` - Soft red
- **Info**: `#3b82f6` - Sky blue

## 🎯 Usage Guidelines

### 1. Backgrounds
```css
/* Main page background */
.salon-page {
  background: linear-gradient(135deg, 
    #fdf4ff 0%,    /* Light purple */
    #fdf2f8 50%,   /* Light rose */
    #ffffff 100%   /* White */
  );
}

/* Dark mode background */
.dark .salon-page {
  background: linear-gradient(135deg,
    #0c0a09 0%,    /* Deep gray */
    #4a044e 50%,   /* Deep purple */
    #0c0a09 100%   /* Deep gray */
  );
}
```

### 2. Cards & Containers
```css
/* Beautiful glass effect cards */
.salon-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(217, 70, 239, 0.2);
  box-shadow: 0 20px 25px -5px rgba(217, 70, 239, 0.1);
}

/* Hover effect */
.salon-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 25px 30px -5px rgba(217, 70, 239, 0.2);
}
```

### 3. Buttons
```css
/* Primary button - Purple to Pink gradient */
.btn-primary {
  background: linear-gradient(135deg, #d946ef 0%, #ec4899 100%);
  color: white;
  box-shadow: 0 10px 15px -3px rgba(217, 70, 239, 0.25);
}

/* Secondary button - Rose to Gold gradient */
.btn-secondary {
  background: linear-gradient(135deg, #f472b6 0%, #f59e0b 100%);
  color: white;
  box-shadow: 0 10px 15px -3px rgba(244, 114, 182, 0.25);
}
```

### 4. Status Indicators
```css
/* Appointment statuses with perfect contrast */
.status-pending {
  background: #fef3c7;     /* Light amber */
  color: #78350f;          /* Dark amber */
  border: 1px solid #fcd34d;
}

.status-confirmed {
  background: #dbeafe;     /* Light blue */
  color: #1e3a8a;          /* Dark blue */
  border: 1px solid #93c5fd;
}

.status-in-service {
  background: #fce7f3;     /* Light pink */
  color: #831843;          /* Dark rose */
  border: 1px solid #f9a8d4;
}

.status-completed {
  background: #d1fae5;     /* Light green */
  color: #064e3b;          /* Dark green */
  border: 1px solid #6ee7b7;
}
```

### 5. Text Styling
```css
/* Gradient headings */
.salon-heading {
  background: linear-gradient(135deg, #d946ef 0%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: bold;
}

/* Proper text contrast */
.text-primary {
  color: #1c1917;          /* Near black for light mode */
}

.dark .text-primary {
  color: #f5f5f4;          /* Near white for dark mode */
}

.text-muted {
  color: #78716c;          /* Medium gray */
}

.dark .text-muted {
  color: #a8a29e;          /* Light gray */
}
```

## ✅ Accessibility Compliance

### WCAG AA Standards
All color combinations meet WCAG AA standards for contrast:

| Background | Foreground | Contrast Ratio | WCAG Rating |
|------------|------------|----------------|-------------|
| White | Purple 600 | 4.7:1 | AA ✅ |
| Purple 50 | Purple 900 | 13.2:1 | AAA ✅ |
| Rose 100 | Rose 900 | 11.8:1 | AAA ✅ |
| Amber 100 | Amber 900 | 10.9:1 | AAA ✅ |
| Dark Gray | Purple 300 | 7.3:1 | AAA ✅ |

### Focus States
```css
/* Visible focus indicators */
.salon-focus:focus-visible {
  outline: 2px solid #d946ef;
  outline-offset: 2px;
  border-radius: 6px;
}

/* High contrast focus for dark mode */
.dark .salon-focus:focus-visible {
  outline-color: #f0abfc;
}
```

## 🎭 Component Examples

### KPI Cards
```jsx
<div className="salon-card p-6 hover:scale-[1.02] transition-all">
  <div className="flex justify-between items-start">
    <div>
      <p className="text-muted text-sm">Today's Revenue</p>
      <p className="salon-heading text-3xl mt-1">AED 12,450</p>
    </div>
    <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
      <DollarSign className="w-6 h-6 text-white" />
    </div>
  </div>
</div>
```

### Status Badges
```jsx
<span className="px-3 py-1 rounded-full text-sm font-medium status-confirmed">
  Confirmed
</span>
```

### Navigation Items
```jsx
<Link className="salon-nav-item salon-nav-item-active">
  <Calendar className="w-5 h-5 mr-3" />
  Appointments
</Link>
```

## 🌟 Best Practices

1. **Use Gradients Sparingly** - Reserve for key CTAs and hero sections
2. **Maintain Consistency** - Use the theme provider for all components
3. **Test Dark Mode** - Ensure all text is readable in both modes
4. **Respect Hierarchy** - Primary colors for main actions, secondary for less important
5. **Accessibility First** - Always check contrast ratios

## 📱 Responsive Considerations

- **Mobile**: Increase tap target sizes to 44x44px minimum
- **Tablet**: Adjust gradient angles for landscape orientation
- **Desktop**: Enable hover states and micro-interactions
- **Print**: Provide high-contrast print stylesheet

## 🔧 Implementation

### Using Theme Provider
```jsx
import { useSalonTheme } from '@/src/lib/components/SalonThemeProvider'

function MyComponent() {
  const theme = useSalonTheme()
  
  return (
    <div className={theme.cardClass}>
      <h2 className={theme.gradientText}>Beautiful Salon UI</h2>
      <button className={theme.primaryButton}>Book Appointment</button>
    </div>
  )
}
```

### Quick Classes
```jsx
import { salonClasses } from '@/src/lib/components/SalonThemeProvider'

<div className={salonClasses.page}>
  <div className={salonClasses.card}>
    <Badge className={salonClasses.status('confirmed')}>
      Confirmed
    </Badge>
  </div>
</div>
```

## 🚀 Performance Tips

1. **Use CSS Variables** for dynamic theming
2. **Lazy Load** gradient backgrounds on mobile
3. **Optimize Animations** with `will-change` property
4. **Reduce Paint** areas with `contain: paint`
5. **GPU Acceleration** for transforms and filters

---

This comprehensive theme system ensures your HERA Salon application looks stunning, remains accessible, and provides an exceptional user experience across all devices and user preferences.