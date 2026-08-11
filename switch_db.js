const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const target = process.argv[2];
if (target !== 'sqlite' && target !== 'postgres') {
  console.log('Usage: node switch_db.js <sqlite|postgres>');
  process.exit(1);
}

const rootDir = __dirname;
const schemaPath = path.join(rootDir, 'server', 'prisma', 'schema.prisma');
const envPath = path.join(rootDir, 'server', '.env');

let schema = fs.readFileSync(schemaPath, 'utf8');
let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

if (target === 'sqlite') {
  schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
  if (!env.includes('DATABASE_URL=')) {
    env += '\nDATABASE_URL="file:./dev.db"\n';
  } else {
    env = env.replace(/DATABASE_URL\s*=\s*".*"/g, 'DATABASE_URL="file:./dev.db"');
  }
  console.log('Switching to SQLite local database schema...');
} else {
  schema = schema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
  console.log('Switching to PostgreSQL cloud database schema...');
  console.log('Please make sure to set DATABASE_URL to your Supabase string in server/.env!');
}

fs.writeFileSync(schemaPath, schema, 'utf8');
fs.writeFileSync(envPath, env, 'utf8');

try {
  console.log('Generating Prisma Client...');
  execSync('cmd.exe /c "npx prisma generate"', { cwd: path.join(rootDir, 'server'), stdio: 'inherit' });
  console.log('Successfully switched database provider to:', target);
} catch (err) {
  console.error('Error generating Prisma client:', err.message);
}
