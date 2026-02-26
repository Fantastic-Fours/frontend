import { Component } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MortgageApiService } from '../../core/services/mortgage-api.service';
import type { MortgageProgramItem, MortgageMatchRequest } from '../../core/interfaces/mortgage.types';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-mortgage-match-page',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, DecimalPipe],
  templateUrl: './mortgage-match.page.html',
  styleUrl: './mortgage-match.page.scss',
})
export class MortgageMatchPage {
  form: FormGroup;
  programs: MortgageProgramItem[] = [];
  totalCount = 0;
  loading = false;
  error: string | null = null;
  submitted = false;

  housingTypes = [
    { value: 'primary', label: 'Основное жильё' },
    { value: 'secondary', label: 'Вторичное жильё' },
  ] as const;

  sortByOptions = [
    { value: 'score', label: 'По совпадению' },
    { value: 'rate', label: 'По ставке' },
    { value: 'overpayment', label: 'По переплате' },
  ] as const;

  hasHousingOptions = [
    { value: null, label: 'Не указано' },
    { value: true, label: 'Да' },
    { value: false, label: 'Нет' },
  ] as const;

  constructor(
    private fb: FormBuilder,
    private mortgageApi: MortgageApiService
  ) {
    this.form = this.fb.nonNullable.group({
      price: [50000000, [Validators.required, Validators.min(1)]],
      down_payment: [10000000, [Validators.required, Validators.min(0)]],
      income: [500000, [Validators.required, Validators.min(0)]],
      expenses: [150000, [Validators.required, Validators.min(0)]],
      term_years: [20, [Validators.required, Validators.min(1), Validators.max(30)]],
      housing_type: ['primary' as const, Validators.required],
      tagsStr: ['семейная, господдержка'],
      require_income_confirmation: [true],
      children_under_18: [0, [Validators.min(0)]],
      has_housing: [null as boolean | null],
      sort_by: ['score' as const],
    });
  }

  get tagsStr(): string {
    return this.form.get('tagsStr')?.value ?? '';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error = null;
    this.loading = true;
    this.submitted = true;
    const raw = this.form.getRawValue();
    const tags = raw.tagsStr
      ? raw.tagsStr.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];
    const params: MortgageMatchRequest = {
      price: raw.price,
      down_payment: raw.down_payment,
      income: raw.income,
      expenses: raw.expenses,
      term_years: raw.term_years,
      housing_type: raw.housing_type,
      tags,
      require_income_confirmation: raw.require_income_confirmation,
      children_under_18: raw.children_under_18,
      has_housing: raw.has_housing ?? undefined,
      sort_by: raw.sort_by,
    };
    this.mortgageApi.match(params).subscribe({
      next: (res) => {
        this.programs = res.programs;
        this.totalCount = res.total_count;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.detail ?? err?.message ?? 'Ошибка подбора программ';
      },
    });
  }

  formatMoney(value: string): string {
    const num = parseFloat(value);
    if (Number.isNaN(num)) return value;
    return new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  }
}
