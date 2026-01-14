const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sizes = [
    // Apple sizes
    { size: 180, name: 'apple-icon-180x180.png' },  // iPhone retina
    { size: 167, name: 'apple-icon-167x167.png' },  // iPad Pro
    { size: 152, name: 'apple-icon-152x152.png' },  // iPad retina
    { size: 120, name: 'apple-icon-120x120.png' },  // iPhone
    { size: 76, name: 'apple-icon-76x76.png' },     // iPad
    // Android/PWA sizes
    { size: 512, name: 'icon-512x512.png' },        // Android high-res
    { size: 192, name: 'icon-192x192.png' },        // Android standard
    { size: 384, name: 'icon-384x384.png' },        // Android medium
];

const inputPath = path.join(__dirname, '../public/apple-icon.png');
const outputDir = path.join(__dirname, '../public');

async function generateIcons() {
    console.log('Generating Apple touch icons from:', inputPath);

    for (const { size, name } of sizes) {
        const outputPath = path.join(outputDir, name);
        await sharp(inputPath)
            .resize(size, size)
            .png()
            .toFile(outputPath);
        console.log(`Created: ${name} (${size}x${size})`);
    }

    // Also create a default 180x180 as apple-touch-icon.png
    await sharp(inputPath)
        .resize(180, 180)
        .png()
        .toFile(path.join(outputDir, 'apple-touch-icon.png'));
    console.log('Created: apple-touch-icon.png (180x180) - default size');

    console.log('Done!');
}

generateIcons().catch(console.error);
