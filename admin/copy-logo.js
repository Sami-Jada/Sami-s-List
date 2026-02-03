const path = require('path');
const fs = require('fs');
const root = path.join(__dirname, '..');
const src = path.join(root, 'mobile', 'assets', 'images', 'Logos', 'logo.svg');
const destDir = path.join(__dirname, 'public');
const dest = path.join(destDir, 'logo.svg');
if (!fs.existsSync(src)) {
  console.warn('Logo not found at', src);
  process.exit(1);
}
fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log('Copied logo to admin/public/logo.svg');
