/**
 * Пишет src/app/core/constants/twogis-env.generated.ts из:
 * 1) переменной окружения TWOGIS_API_KEY
 * 2) файла frontend/.env (строка TWOGIS_API_KEY=...)
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outFile = join(root, 'src/app/core/constants/twogis-env.generated.ts');

function parseDotEnv(text) {
  const out = {};
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

let key = (process.env.TWOGIS_API_KEY || '').trim();
if (!key) {
  const envPath = join(root, '.env');
  if (existsSync(envPath)) {
    const vars = parseDotEnv(readFileSync(envPath, 'utf8'));
    key = (vars.TWOGIS_API_KEY || '').trim();
  }
}

const escaped = key.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const content = `/* Автогенерация: npm run env:generate (читает TWOGIS_API_KEY и frontend/.env) */
/* Не коммитьте этот файл с реальным ключом — держите секрет в .env (не в git). */
export const TWOGIS_API_KEY_FROM_DOTENV = '${escaped}';
`;

writeFileSync(outFile, content, 'utf8');
