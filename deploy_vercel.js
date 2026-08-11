const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const renderUrl = 'https://surepact-greenfield-v2.onrender.com';

console.log(`Setting up Vercel production build proxying to Render: ${renderUrl}`);

// 1. Ensure client/.env.production.local has relative VITE_API_URL
const clientEnvProd = path.join(rootDir, 'client', '.env.production.local');
fs.writeFileSync(clientEnvProd, 'VITE_API_URL=/api\n', 'utf8');

// 2. Build client
console.log('Building client application...');
execSync('cmd.exe /c "npm --prefix client run build"', { stdio: 'inherit' });

// 3. Create .vercel/output/config.json with API rewrites to Render & SPA fallback
const vercelOutputDir = path.join(rootDir, '.vercel', 'output');
if (!fs.existsSync(vercelOutputDir)) {
  fs.mkdirSync(vercelOutputDir, { recursive: true });
}

const configJson = {
  version: 3,
  routes: [
    { src: '/api/(.*)', dest: `${renderUrl}/api/$1` },
    { handle: 'filesystem' },
    { src: '/(.*)', dest: '/index.html' }
  ]
};

const configJsonPath = path.join(vercelOutputDir, 'config.json');
fs.writeFileSync(configJsonPath, JSON.stringify(configJson, null, 2), 'utf8');
console.log('Wrote .vercel/output/config.json proxy routes to Render.');

// 4. Copy client/dist into .vercel/output/static
const vercelStaticDir = path.join(vercelOutputDir, 'static');
if (fs.existsSync(vercelStaticDir)) {
  fs.rmSync(vercelStaticDir, { recursive: true, force: true });
}
fs.mkdirSync(vercelStaticDir, { recursive: true });

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

copyRecursiveSync(path.join(rootDir, 'client', 'dist'), vercelStaticDir);
console.log('Copied client/dist to .vercel/output/static.');

// 5. Deploy prebuilt to Vercel
console.log('Deploying prebuilt build to Vercel production...');
execSync('cmd.exe /c "npx vercel deploy --prebuilt --prod --yes"', { stdio: 'inherit' });
console.log('Vercel prebuilt deployment complete!');
