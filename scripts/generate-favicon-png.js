#!/usr/bin/env node

/**
 * Generate PNG favicons from SVG
 * This script creates an HTML file that can be used to manually save PNG versions
 */

const fs = require('fs');
const path = require('path');

// Read the SVG file
const svgPath = path.join(__dirname, '../public/favicon.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

// Create an HTML file for manual conversion
const html = `<!DOCTYPE html>
<html>
<head>
    <title>HERA Favicon PNG Generator</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f3f4f6;
            padding: 40px;
            text-align: center;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        h1 {
            color: #1f2937;
            margin-bottom: 20px;
        }
        .instructions {
            color: #6b7280;
            margin-bottom: 40px;
            line-height: 1.6;
        }
        .favicon-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 30px;
            margin-top: 40px;
        }
        .favicon-item {
            text-align: center;
        }
        .favicon-wrapper {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 10px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        .favicon-label {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 5px;
        }
        .size-info {
            font-size: 12px;
            color: #9ca3af;
        }
        svg {
            display: block;
        }
        .download-btn {
            background: #1e293b;
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            text-decoration: none;
            font-size: 14px;
            display: inline-block;
            margin-top: 10px;
        }
        .download-btn:hover {
            background: #334155;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>HERA Favicon PNG Generator</h1>
        <div class="instructions">
            <p>Right-click on each favicon size below and select "Save Image As..." to save the PNG version.</p>
            <p>Save them in the <code>/public/assets/</code> directory with the specified filename.</p>
        </div>
        
        <div class="favicon-grid">
            <!-- 16x16 -->
            <div class="favicon-item">
                <div class="favicon-label">favicon-16x16.png</div>
                <div class="favicon-wrapper">
                    ${svgContent.replace('width="32" height="32"', 'width="16" height="16"')}
                </div>
                <div class="size-info">16x16 pixels</div>
            </div>
            
            <!-- 32x32 -->
            <div class="favicon-item">
                <div class="favicon-label">favicon-32x32.png</div>
                <div class="favicon-wrapper">
                    ${svgContent}
                </div>
                <div class="size-info">32x32 pixels</div>
            </div>
            
            <!-- 48x48 -->
            <div class="favicon-item">
                <div class="favicon-label">favicon-48x48.png</div>
                <div class="favicon-wrapper">
                    ${svgContent.replace('width="32" height="32"', 'width="48" height="48"')}
                </div>
                <div class="size-info">48x48 pixels</div>
            </div>
            
            <!-- 64x64 -->
            <div class="favicon-item">
                <div class="favicon-label">favicon-64x64.png</div>
                <div class="favicon-wrapper">
                    ${svgContent.replace('width="32" height="32"', 'width="64" height="64"')}
                </div>
                <div class="size-info">64x64 pixels</div>
            </div>
            
            <!-- 96x96 -->
            <div class="favicon-item">
                <div class="favicon-label">favicon-96x96.png</div>
                <div class="favicon-wrapper">
                    ${svgContent.replace('width="32" height="32"', 'width="96" height="96"')}
                </div>
                <div class="size-info">96x96 pixels</div>
            </div>
            
            <!-- 128x128 -->
            <div class="favicon-item">
                <div class="favicon-label">favicon-128x128.png</div>
                <div class="favicon-wrapper">
                    ${svgContent.replace('width="32" height="32"', 'width="128" height="128"')}
                </div>
                <div class="size-info">128x128 pixels</div>
            </div>
            
            <!-- 192x192 (Android) -->
            <div class="favicon-item">
                <div class="favicon-label">android-chrome-192x192.png</div>
                <div class="favicon-wrapper">
                    ${svgContent.replace('width="32" height="32"', 'width="192" height="192"')}
                </div>
                <div class="size-info">192x192 pixels (Android)</div>
            </div>
            
            <!-- 512x512 (Android) -->
            <div class="favicon-item">
                <div class="favicon-label">android-chrome-512x512.png</div>
                <div class="favicon-wrapper">
                    ${svgContent.replace('width="32" height="32"', 'width="512" height="512"')}
                </div>
                <div class="size-info">512x512 pixels (Android)</div>
            </div>
            
            <!-- Apple Touch Icon -->
            <div class="favicon-item">
                <div class="favicon-label">apple-touch-icon.png</div>
                <div class="favicon-wrapper">
                    ${svgContent.replace('width="32" height="32"', 'width="180" height="180"')}
                </div>
                <div class="size-info">180x180 pixels (iOS)</div>
            </div>
        </div>
    </div>
</body>
</html>`;

// Write the HTML file
const outputPath = path.join(__dirname, '../public/favicon-generator.html');
fs.writeFileSync(outputPath, html);

console.log('✅ Favicon generator HTML created at: public/favicon-generator.html');
console.log('\nTo generate PNG favicons:');
console.log('1. Open public/favicon-generator.html in a browser');
console.log('2. Right-click each favicon and save as PNG');
console.log('3. Save them in the public/assets/ directory');
console.log('\nAlternatively, use a tool like:');
console.log('- Online: https://realfavicongenerator.net/');
console.log('- CLI: npm install -g sharp-cli && sharp -i public/favicon.svg -o public/assets/favicon-32x32.png resize 32 32');