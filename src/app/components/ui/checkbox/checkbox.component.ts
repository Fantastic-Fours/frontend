import {
  booleanAttribute,
  Component,
  effect,
  ElementRef,
  forwardRef,
  input,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Custom checkbox (Angular port of shadcn-style React checkbox).
 * Use with {@link formControlName}, {@link ngModel}, or standalone bindings.
 */
@Component({
  selector: 'app-checkbox',
  standalone: true,
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true,
    },
  ],
  host: {
    class: 'app-checkbox-root',
  },
})
export class CheckboxComponent implements ControlValueAccessor {
  readonly indeterminate = input(false, { transform: booleanAttribute });

  private readonly nativeInput = viewChild<ElementRef<HTMLInputElement>>('nativeInput');

  /** Bound value (CVA). */
  value = false;
  /** Disabled state (CVA). */
  isDisabled = false;

  private onChange: (v: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    effect(() => {
      const ind = this.indeterminate();
      const el = this.nativeInput()?.nativeElement;
      if (el) {
        el.indeterminate = ind;
      }
    });
  }

  writeValue(v: boolean | null): void {
    this.value = !!v;
  }

  registerOnChange(fn: (v: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  onInputChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.value = checked;
    this.onChange(checked);
    this.onTouched();
  }

  onInputBlur(): void {
    this.onTouched();
  }
}
