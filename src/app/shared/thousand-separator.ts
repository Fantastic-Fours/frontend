/** Digits only (strip everything else). */
export function stripNonDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Insert narrow spaces as thousand separators (e.g. 50000000 → "50 000 000").
 * Input must already be digits-only.
 */
export function formatDigitsWithSpaces(digitsOnly: string): string {
  if (!digitsOnly) return '';
  return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** Count digit characters strictly to the left of caret index. */
export function digitsLeftOfCaret(display: string, caret: number): number {
  let n = 0;
  const end = Math.min(Math.max(0, caret), display.length);
  for (let i = 0; i < end; i++) {
    if (/\d/.test(display[i])) n++;
  }
  return n;
}

/**
 * Caret index in `display` so that exactly `digitCount` digits lie to the left (0 = start).
 */
export function caretFromDigitsLeft(display: string, digitCount: number): number {
  if (digitCount <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < display.length; i++) {
    if (/\d/.test(display[i])) {
      seen++;
      if (seen === digitCount) return i + 1;
    }
  }
  return display.length;
}

const MAX_DIGITS = 18;

export interface ThousandSepInputOptions {
  onDigits: (digits: string) => void;
}

/**
 * Imperative helper for non–ControlValueAccessor inputs (e.g. estate filters).
 * Keeps spaces in the field, updates model with digits-only string, restores caret.
 */
export function processThousandSepInput(
  el: HTMLInputElement,
  { onDigits }: ThousandSepInputOptions,
): void {
  const selStart = el.selectionStart ?? 0;
  const digitsBefore = digitsLeftOfCaret(el.value, selStart);
  let raw = stripNonDigits(el.value);
  if (raw.length > MAX_DIGITS) raw = raw.slice(0, MAX_DIGITS);
  const formatted = formatDigitsWithSpaces(raw);
  el.value = formatted;
  const pos = caretFromDigitsLeft(formatted, digitsBefore);
  el.setSelectionRange(pos, pos);
  onDigits(raw);
}

/** Display helper for one-way [value] binding from a numeric model. */
export function displayThousandFromNumber(n: number | undefined | null): string {
  if (n == null || Number.isNaN(n)) return '';
  const int = Math.trunc(Number(n));
  if (!Number.isFinite(int)) return '';
  return formatDigitsWithSpaces(String(Math.abs(int)));
}
