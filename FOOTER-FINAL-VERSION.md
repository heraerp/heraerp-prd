# Footer Component - Final Version Reference

## Overview
This document preserves the final version of the Footer component with enterprise design tokens.

## Key Features
- **4-column layout**: Brand section (2 columns), Product section, Company section
- **6 social icons**: LinkedIn, X (Twitter), YouTube, Instagram, Bluesky, Facebook
- **Enterprise design tokens**: `.glass`, `.ink`, `.ink-muted`, `var(--ink-primary)`, `var(--ink-secondary)`
- **Gradient effect**: Enabled by default with `showGradient={true}`
- **Correct links**: Privacy & Cookies points to `/policy`

## File Locations
- **Main Footer**: `/src/app/components/Footer.tsx`
- **Backup**: `/src/app/components/Footer.tsx.final-version.bak`
- **Used in**: `/src/app/layout.tsx`

## Git Commit
- Commit hash: 76870497
- Message: "feat: Update Footer and Navbar with enterprise design tokens"

## Design Tokens Used
- `.glass` - Main container glassmorphism effect
- `.ink` - Primary text (brand name, section headers)
- `.ink-muted` - Secondary text (description, copyright)
- `var(--ink-primary)` - Link hover color
- `var(--ink-secondary)` - Link default color
- `var(--surface-veil)` - Social icon backgrounds

## Important Notes
- Do NOT use the old HERAFooter component from `/src/components/ui/HERAFooter.tsx`
- The main Footer is imported in layout.tsx as `import Footer from '@/app/components/Footer'`
- Always maintain the 4-column layout for proper alignment
- Keep all 6 social media icons