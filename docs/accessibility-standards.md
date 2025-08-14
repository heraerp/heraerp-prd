# HERA DNA Accessibility Standards

## Text Contrast Guidelines

HERA follows WCAG AA compliance standards for text contrast to ensure accessibility for all users.

### ✅ USE THESE CLASSES (Accessible)

#### Primary Text
```css
.text-accessible-primary   /* oklch(0.15 0.096 250) - 4.5:1 contrast */
.text-contrast-high        /* oklch(0.1 0.096 250) - Maximum contrast */
```

#### Secondary Text  
```css
.text-accessible-secondary /* oklch(0.25 0.144 250) - 3:1 contrast */
.text-contrast-medium      /* oklch(0.2 0.144 250) - High contrast */
```

#### Muted Text
```css
.text-accessible-muted     /* oklch(0.35 0.168 250) - Minimum readable */
.text-contrast-readable    /* oklch(0.3 0.168 250) - Medium-dark readable */
```

#### Enhanced Tailwind Overrides
```css
.text-gray-700  /* Enhanced contrast - oklch(0.2 0.144 250) */
.text-gray-600  /* Enhanced contrast - oklch(0.25 0.144 250) */
.text-gray-500  /* Enhanced contrast - oklch(0.3 0.168 250) */
```

### ❌ AVOID THESE (Poor Contrast)

```css
/* ❌ Default Tailwind - Poor contrast */
text-gray-400   /* Too light - fails WCAG AA */
text-gray-300   /* Too light - fails WCAG AA */
text-gray-200   /* Too light - fails WCAG AA */

/* ❌ Low contrast text */
text-slate-400  /* Insufficient contrast */
text-zinc-400   /* Insufficient contrast */
```

## Implementation Guidelines

### 1. Use Semantic Classes
```jsx
// ✅ Good - Semantic and accessible
<p className="text-accessible-primary">Main content text</p>
<p className="text-accessible-secondary">Supporting text</p>
<p className="text-accessible-muted">Supplementary information</p>

// ❌ Bad - Poor contrast
<p className="text-gray-400">This text is hard to read</p>
```

### 2. Links and Interactive Elements
```jsx
// ✅ Good - Accessible links
<a className="link-accessible">Learn more</a>

// ✅ Good - Enhanced contrast for buttons
<button className="text-gray-700 hover:text-gray-900">
  Click me
</button>
```

### 3. Dark Mode Support
All accessibility classes automatically adapt to dark mode:
```css
.dark .text-accessible-primary { color: oklch(0.85 0.05 250); }
.dark .text-accessible-secondary { color: oklch(0.85 0.05 250); }
.dark .text-accessible-muted { color: oklch(0.85 0.05 250); }
```

## Automatic Fixes Applied

### Global CSS Overrides
The following Tailwind utilities have been enhanced for better contrast:
- `.text-gray-500` → Enhanced to `oklch(0.3 0.168 250)`
- `.text-gray-600` → Enhanced to `oklch(0.25 0.144 250)`  
- `.text-gray-700` → Enhanced to `oklch(0.2 0.144 250)`

### Future-Proof Development

1. **Use semantic classes** instead of color-specific utilities
2. **Test with accessibility tools** during development
3. **Follow the accessibility hierarchy**:
   - Primary text: Highest contrast
   - Secondary text: Medium contrast  
   - Muted text: Minimum readable contrast

## ESLint Integration (Recommended)

Add to your ESLint config to catch accessibility issues:

```json
{
  "plugins": ["jsx-a11y"],
  "rules": {
    "jsx-a11y/color-contrast": "warn"
  }
}
```

## Testing Contrast

### Browser Tools
- Chrome DevTools Accessibility panel
- Firefox Accessibility Inspector
- WAVE Web Accessibility Evaluator

### Automated Testing
```bash
# Add accessibility testing to CI/CD
npm install --save-dev axe-core @axe-core/react
```

## HERA DNA Standard

This accessibility system is part of HERA's DNA - it ensures that all applications built on HERA are accessible by default, eliminating the need for manual contrast fixes in every component.

**Benefits:**
- 🎯 WCAG AA compliant out of the box
- 🔧 No manual contrast calculations needed
- 🌍 Universal accessibility across all HERA applications
- 🚀 Future-proof against accessibility regressions
- 📱 Consistent experience across devices and themes

---

*This standard applies to all HERA applications and ensures that accessibility is built into the foundation, not added as an afterthought.*