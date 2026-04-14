/**
 * MapGL JS API + Geocoder (Catalog API) key from 2GIS Platform Manager.
 * https://docs.2gis.com/en/mapgl/start/first-steps
 *
 * Paste your demo key below, or set it in index.html before the app bundle:
 * `<script>window.__TWOGIS_API_KEY__ = '…';</script>`
 */
const TWOGIS_API_KEY_FILE = 'be1d9244-b813-4a85-b57a-9b58e4c10cfc';

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
  return TWOGIS_API_KEY_FILE.trim();
}
