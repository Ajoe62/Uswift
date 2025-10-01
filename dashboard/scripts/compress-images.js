const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const avatarsDir = path.join(__dirname, '../public/avatars');
const outputDir = path.join(__dirname, '../public/avatars/optimized');

// Create optimized directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('🖼️  Starting image compression...\n');

fs.readdirSync(avatarsDir).forEach((file) => {
  if (file.match(/\.(jpg|jpeg|png)$/i)) {
    const inputPath = path.join(avatarsDir, file);
    const stats = fs.statSync(inputPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    // Convert to WebP for maximum compression
    const outputPath = path.join(outputDir, file.replace(/\.(jpg|jpeg|png)$/i, '.webp'));

    sharp(inputPath)
      .resize(96, 96, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 80 })
      .toFile(outputPath)
      .then((info) => {
        const newSizeKB = (info.size / 1024).toFixed(2);
        const savings = (((stats.size - info.size) / stats.size) * 100).toFixed(1);
        console.log(`✅ ${file}`);
        console.log(`   Before: ${sizeMB}MB → After: ${newSizeKB}KB (${savings}% reduction)\n`);
      })
      .catch((err) => console.error(`❌ Error processing ${file}:`, err));
  }
});

console.log('\n📝 Instructions:');
console.log('1. Check the optimized/ folder for compressed images');
console.log('2. Replace original files with optimized versions');
console.log('3. Update testimonials.json to use .webp extensions');
console.log('4. Delete the optimized/ folder after replacing originals\n');
