#!/usr/bin/env node

/**
 * Generate PWA icons programmatically
 * This script creates basic PNG icons for PWA support
 */

/* eslint-disable no-undef */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple SVG to serve as icon template
const createSVGIcon = (size) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="#1a1a2e"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.35}" fill="#ff4444"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.2}" fill="#1a1a2e"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.1}" fill="#ff4444"/>
    <text x="${size / 2}" y="${size * 0.85}" fill="#ffffff" font-family="Arial" font-size="${size * 0.15}" text-anchor="middle">${String.fromCodePoint(127919)}</text>
  </svg>`;

// Create icons directory if it doesn't exist
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate SVG icons (will be converted to PNGs, but SVGs work too)
const sizes = [192, 512];
sizes.forEach((size) => {
  const svgContent = createSVGIcon(size);
  const svgPath = path.join(publicDir, `pwa-${size}x${size}.svg`);
  fs.writeFileSync(svgPath, svgContent);
  console.log(`Created ${svgPath}`);
});

console.log('✅ PWA icons generated successfully!');
console.log('Note: These are SVG placeholders. For production, replace with proper PNGs.');
