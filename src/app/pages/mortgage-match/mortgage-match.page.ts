import { Component } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MortgageApiService } from '../../core/services/mortgage-api.service';
import { getBankLogoPath } from '../../core/utils/bank-logo';
import type {
  MortgageProgramItem,
  MortgageMatchRequest,
  MortgageNNPredictItem,
  MortgageNNPredictRequest,
} from '../../core/interfaces/mortgage.types';
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
  aiTop3: MortgageNNPredictItem[] = [];
  totalCount = 0;
  loading = false;
  error: string | null = null;
  submitted = false;

  privilegeOptions = [
    { value: 'veteran_ww2', label: 'Ветеран ВОВ' },
    { value: 'veteran_equivalent', label: 'Приравненный к ветерану ВОВ' },
    { value: 'combat_veteran', label: 'Ветеран боевых действий' },
    { value: 'disabled_group_1', label: 'Инвалид I группы' },
    { value: 'disabled_group_2', label: 'Инвалид II группы' },
    { value: 'family_with_disabled_child', label: 'Семья с ребенком-инвалидом' },
    { value: 'widow', label: 'Вдова' },
    { value: 'large_family', label: 'Многодетная семья' },
    { value: 'orphan', label: 'Сирота' },
  ] as const;

  housingTypes = [
    { value: 'primary', label: 'Основное жильё' },
    { value: 'secondary', label: 'Вторичное жильё' },
  ] as const;

  sortByOptions = [
    { value: 'score', label: 'По совпадению' },
    { value: 'monthly_payment', label: 'По ежемесячному платежу' },
    { value: 'total_overpayment', label: 'По переплате' },
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
      mode: ['rules' as const],
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
      privileges: [[] as string[]],
      sort_by: ['score' as const],
    });
  }

  get mode(): 'rules' | 'ai' {
    return (this.form.get('mode')?.value as 'rules' | 'ai') ?? 'rules';
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
      privileges: raw.privileges ?? [],
      sort_by: raw.sort_by,
    };
    this.programs = [];
    this.aiTop3 = [];

    if (this.mode === 'ai') {
      const aiParams: MortgageNNPredictRequest = {
        price: params.price,
        down_payment: params.down_payment,
        income: params.income,
        expenses: params.expenses,
        term_years: params.term_years,
        housing_type: params.housing_type,
        tags: params.tags,
        require_income_confirmation: params.require_income_confirmation,
        children_under_18: params.children_under_18,
        has_housing: raw.has_housing ?? null,
        privileges: raw.privileges ?? [],
      };
      this.mortgageApi.predict(aiParams).subscribe({
        next: (res) => {
          this.aiTop3 = res.top3 ?? [];
          this.totalCount = this.aiTop3.length;
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.detail ?? err?.message ?? 'Ошибка AI рекомендаций';
        },
      });
      return;
    }

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

  getBankLogo(bankName: string): string | null {
    return getBankLogoPath(bankName);
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
