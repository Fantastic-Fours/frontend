import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const proxyOutFile = join(root, 'proxy.conf.json');
const browserEnvOutFile = join(root, 'src/app/core/constants/backend-env.generated.ts');
const defaultBackendUrl = 'http://localhost:8000';

function parseDotEnv(text) {
  const out = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    out[key] = value;
  }

  return out;
}

function resolveBackendUrl() {
  const envFromProcess = (process.env.BACKEND_URL || '').trim();
  if (envFromProcess) return envFromProcess;

  const envPath = join(root, '.env');
  if (!existsSync(envPath)) return defaultBackendUrl;

  const vars = parseDotEnv(readFileSync(envPath, 'utf8'));
  return (vars.BACKEND_URL || '').trim() || defaultBackendUrl;
}

const backendUrl = resolveBackendUrl();
const escapedBackendUrl = backendUrl.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const proxyContent = `${JSON.stringify(
  {
    '/api': {
      target: backendUrl,
      secure: false,
    },
    '/media': {
      target: backendUrl,
      secure: false,
    },
  },
  null,
  2,
)}
`;

const browserEnvContent = `/* Автогенерация: npm run env:generate (читает BACKEND_URL и frontend/.env) */
export const BACKEND_URL_FROM_DOTENV = '${escapedBackendUrl}';
`;

writeFileSync(proxyOutFile, proxyContent, 'utf8');
writeFileSync(browserEnvOutFile, browserEnvContent, 'utf8');
