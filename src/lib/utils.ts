/**
 * Optional class-name helper (shadcn-style). Angular templates usually use `[class.foo]` / `[ngClass]`;
 * use this when composing strings in TypeScript (e.g. dynamic host classes).
 */
export type ClassValue = string | number | null | undefined | false;

export function cn(...inputs: ClassValue[]): string {
  return inputs
    .filter((v) => v !== null && v !== undefined && v !== false && String(v).trim() !== '')
    .join(' ');
}
