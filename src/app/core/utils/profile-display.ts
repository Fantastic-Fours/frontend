import type { UserProfile } from '../interfaces/user.types';

/** Отображаемое имя: имя + фамилия, иначе логин. */
export function profileDisplayName(p: UserProfile | null | undefined): string {
  if (!p) return '';
  const fn = (p.first_name ?? '').trim();
  const ln = (p.last_name ?? '').trim();
  const full = `${fn} ${ln}`.trim();
  if (full) return full;
  return (p.username ?? '').trim();
}

/** Инициалы для аватара. */
export function profileInitials(p: UserProfile | null | undefined): string {
  const name = profileDisplayName(p);
  if (!name) return '?';
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  }
  return name.slice(0, 2).toUpperCase();
}
