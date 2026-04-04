import {
  Component,
  ElementRef,
  HostListener,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type DropdownSelectOption = { label: string; value: unknown };

function valuesEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  return false;
}

/**
 * Single-select dropdown (shadcn-style) with optional checkmark on the active row.
 * Implements {@link ControlValueAccessor} for {@link formControlName} / {@link ngModel}.
 */
@Component({
  selector: 'app-dropdown-select',
  standalone: true,
  templateUrl: './dropdown-select.component.html',
  styleUrl: './dropdown-select.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropdownSelectComponent),
      multi: true,
    },
  ],
})
export class DropdownSelectComponent implements ControlValueAccessor {
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly options = input.required<DropdownSelectOption[]>();
  readonly placeholder = input('Выберите…');

  readonly open = signal(false);
  readonly innerValue = signal<unknown>(undefined);
  readonly isDisabled = signal(false);

  private onChange: (v: unknown) => void = () => {};
  private onTouched: () => void = () => {};

  readonly displayLabel = computed(() => {
    const v = this.innerValue();
    const opt = this.options().find((o) => valuesEqual(o.value, v));
    return opt?.label ?? this.placeholder();
  });

  writeValue(v: unknown): void {
    this.innerValue.set(v);
  }

  registerOnChange(fn: (v: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.isDisabled.set(disabled);
  }

  equal(a: unknown, b: unknown): boolean {
    return valuesEqual(a, b);
  }

  optTrack(_i: number, opt: DropdownSelectOption): string {
    try {
      return JSON.stringify(opt.value) + '\0' + opt.label;
    } catch {
      return String(opt.label) + _i;
    }
  }

  toggle(ev: MouseEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    if (this.isDisabled()) return;
    this.open.update((o) => !o);
  }

  selectValue(v: unknown, ev: Event): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.innerValue.set(v);
    this.onChange(v);
    this.onTouched();
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent): void {
    if (!this.host.nativeElement.contains(ev.target as Node)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.open.set(false);
  }
}
