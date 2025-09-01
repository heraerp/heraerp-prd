# HERA Favicon Assets

This directory contains PNG versions of the HERA favicon converted from the original SVG file at `/public/favicon.svg`.

## Available Files

- **favicon-16x16.png** - Small favicon for browser tabs
- **favicon-32x32.png** - Standard favicon size
- **apple-touch-icon.png** - 180x180 icon for iOS devices
- **android-chrome-192x192.png** - Android app icon

## Original SVG

The original SVG favicon features:
- Dark gradient background (#1E293B to #0F172A)
- White "H" logo representing HERA
- Circle shape with subtle shadow

## Usage

```html
<!-- Standard favicon -->
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16x16.png">

<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">

<!-- Android Chrome -->
<link rel="icon" type="image/png" sizes="192x192" href="/assets/android-chrome-192x192.png">
```

## Additional Sizes

If you need additional sizes, you can:
1. Use the HTML files in `/public` directory to manually save different sizes
2. Use online tools like https://realfavicongenerator.net/
3. Use command-line tools like ImageMagick or sharp-cli

## Notes

The PNG files were generated to maintain the quality and appearance of the original SVG design while providing compatibility with systems that require raster image formats.