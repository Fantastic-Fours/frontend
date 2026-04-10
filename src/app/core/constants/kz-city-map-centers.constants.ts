import type { KzBigCity } from './kz-cities.constants';

/** MapGL `center`: [longitude, latitude] */
export const KZ_CITY_MAP_CENTER: Record<KzBigCity, [number, number]> = {
  Алматы: [76.945, 43.238],
  Астана: [71.43, 51.16],
  Шымкент: [69.595, 42.32],
  Караганда: [73.1, 49.8],
  Актобе: [57.17, 50.28],
  Тараз: [71.37, 42.9],
  Павлодар: [76.95, 52.28],
  'Усть-Каменогорск': [82.62, 49.95],
  Семей: [80.23, 50.41],
};

export function mapCenterForCity(city: string | null | undefined): [number, number] {
  if (city && city in KZ_CITY_MAP_CENTER) {
    return KZ_CITY_MAP_CENTER[city as KzBigCity];
  }
  return KZ_CITY_MAP_CENTER['Алматы'];
}
