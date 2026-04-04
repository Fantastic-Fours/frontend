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

export type DropdownMultiOption = { label: string; value: string };

/**
 * Multi-select dropdown with checkbox rows and blue check icons (shadcn-style).
 * Value is {@link string[]} — suitable for privilege lists, tags, etc.
 */
@Component({
  selector: 'app-dropdown-multi-checkbox',
  standalone: true,
  templateUrl: './dropdown-multi-checkbox.component.html',
  styleUrl: './dropdown-multi-checkbox.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropdownMultiCheckboxComponent),
      multi: true,
    },
  ],
})
export class DropdownMultiCheckboxComponent implements ControlValueAccessor {
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly options = input.required<DropdownMultiOption[]>();
  readonly placeholder = input('Выберите…');

  readonly open = signal(false);
  readonly selected = signal<string[]>([]);
  readonly isDisabled = signal(false);

  private onChange: (v: string[]) => void = () => {};
  private onTouched: () => void = () => {};

  readonly summary = computed(() => {
    const sel = this.selected();
    const opts = this.options();
    if (sel.length === 0) return this.placeholder();
    if (sel.length <= 2) {
      return sel
        .map((v) => opts.find((o) => o.value === v)?.label ?? v)
        .join(', ');
    }
    return `Выбрано: ${sel.length}`;
  });

  writeValue(v: string[] | null): void {
    this.selected.set(Array.isArray(v) ? [...v] : []);
  }

  registerOnChange(fn: (v: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.isDisabled.set(disabled);
  }

  isChecked(value: string): boolean {
    return this.selected().includes(value);
  }

  toggle(value: string, ev: Event): void {
    ev.preventDefault();
    ev.stopPropagation();
    if (this.isDisabled()) return;
    const cur = new Set(this.selected());
    if (cur.has(value)) {
      cur.delete(value);
    } else {
      cur.add(value);
    }
    const next = Array.from(cur);
    this.selected.set(next);
    this.onChange(next);
    this.onTouched();
  }

  toggleOpen(ev: MouseEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    if (this.isDisabled()) return;
    this.open.update((o) => !o);
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
