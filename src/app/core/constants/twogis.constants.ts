/**
 * MapGL JS API + Geocoder (Catalog API) key from 2GIS Platform Manager.
 * https://docs.2gis.com/en/mapgl/start/first-steps
 *
 * Ключ задаётся в frontend/.env как TWOGIS_API_KEY=… (см. .env.example).
 * Перед serve/build выполняется `npm run env:generate` → twogis-env.generated.ts
 *
 * Либо в index.html до бандла:
 * `<script>window.__TWOGIS_API_KEY__ = '…';</script>`
 */
import { TWOGIS_API_KEY_FROM_DOTENV } from './twogis-env.generated';

declare global {
  interface Window {
    __TWOGIS_API_KEY__?: string;
  }
}

export function getTwogisApiKey(): string {
  if (typeof window !== 'undefined') {
    const fromWindow = window.__TWOGIS_API_KEY__;
    if (fromWindow && String(fromWindow).trim()) {
      return String(fromWindow).trim();
    }
  }
  return (TWOGIS_API_KEY_FROM_DOTENV || '').trim();
}
