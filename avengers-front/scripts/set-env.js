const fs = require('fs');
const path = require('path');

const rawUrl = process.env.API_BASE_URL;

if (!rawUrl) {
  if (process.env.VERCEL === '1') {
    throw new Error('API_BASE_URL must be set for Vercel deployments.');
  }

  console.log('API_BASE_URL is not set; keeping the local production default.');
  process.exit(0);
}

const apiBaseUrl = rawUrl.trim().replace(/\/+$/, '');

try {
  const parsedUrl = new URL(apiBaseUrl);
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error();
  }
} catch {
  throw new Error('API_BASE_URL must be a valid HTTP or HTTPS URL.');
}

const environmentPath = path.join(__dirname, '../src/environments/environment.prod.ts');
const environment = `export const environment = {
  production: true,
  apiBaseUrl: ${JSON.stringify(apiBaseUrl)},
};
`;

fs.writeFileSync(environmentPath, environment);
console.log('Configured the production API URL from API_BASE_URL.');
