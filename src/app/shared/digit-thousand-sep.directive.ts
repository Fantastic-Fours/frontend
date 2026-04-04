import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import {
  stripNonDigits,
  formatDigitsWithSpaces,
  digitsLeftOfCaret,
  caretFromDigitsLeft,
} from './thousand-separator';

const MAX_DIGITS = 18;

/**
 * Integer thousands separator for `<input>` (use `type="text"` + `inputmode="numeric"`).
 * Must be used with `formControlName`, `formControl`, or `ngModel` on the same element.
 *
 * - **Display:** spaces as thousand separators while typing
 * - **Model:** number (default) or digits-only string (`digitThousandStringModel`)
 */
@Directive({
  selector: 'input[digitThousandSep]',
  standalone: true,
})
export class DigitThousandSepDirective implements ControlValueAccessor {
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private readonly ngControl = inject(NgControl, { self: true });

  readonly stringModel = input(false, { alias: 'digitThousandStringModel' });
  readonly emptyNumeric = input<'null' | 'zero'>('null', { alias: 'digitThousandEmpty' });

  private onChange: (v: string | number | null) => void = () => {};
  private onTouched: () => void = () => {};
  private updatingFromWrite = false;

  constructor() {
    this.ngControl.valueAccessor = this;
  }

  writeValue(value: string | number | null | undefined): void {
    this.updatingFromWrite = true;
    try {
      const raw = stripNonDigits(value == null ? '' : String(value)).slice(0, MAX_DIGITS);
      const formatted = formatDigitsWithSpaces(raw);
      const inputEl = this.el.nativeElement;
      if (inputEl.value !== formatted) inputEl.value = formatted;
    } finally {
      this.updatingFromWrite = false;
    }
  }

  registerOnChange(fn: (v: string | number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.el.nativeElement.disabled = isDisabled;
  }

  @HostListener('input')
  onInput(): void {
    if (this.updatingFromWrite) return;
    const inputEl = this.el.nativeElement;
    const sel = inputEl.selectionStart ?? 0;
    const digitsBefore = digitsLeftOfCaret(inputEl.value, sel);
    let raw = stripNonDigits(inputEl.value);
    if (raw.length > MAX_DIGITS) raw = raw.slice(0, MAX_DIGITS);
    const formatted = formatDigitsWithSpaces(raw);
    inputEl.value = formatted;
    const pos = caretFromDigitsLeft(formatted, digitsBefore);
    inputEl.setSelectionRange(pos, pos);

    this.emitModel(raw);
  }

  @HostListener('blur')
  onBlur(): void {
    this.onTouched();
  }

  private emitModel(rawDigits: string): void {
    if (this.stringModel()) {
      this.onChange(rawDigits);
      return;
    }
    if (rawDigits === '') {
      this.onChange(this.emptyNumeric() === 'zero' ? 0 : null);
      return;
    }
    const n = Number(rawDigits);
    this.onChange(Number.isFinite(n) ? n : this.emptyNumeric() === 'zero' ? 0 : null);
  }
}
