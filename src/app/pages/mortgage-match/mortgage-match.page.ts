import { Component } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MortgageApiService } from '../../core/services/mortgage-api.service';
import { getBankLogoPath } from '../../core/utils/bank-logo';
import type {
  MortgageProgramItem,
  MortgageMatchRequest,
  AIMortgageAdvisorProgram,
  AIMortgageAdvisorRequest,
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
  advisorAnswer: string | null = null;
  advisorPrograms: AIMortgageAdvisorProgram[] = [];
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
      housing_type: ['primary' as const, Validators.required],
      require_income_confirmation: [true],
      children_under_18: [0, [Validators.min(0)]],
      has_housing: [null as boolean | null],
      privileges: [[] as string[]],
      has_deposit: [false],
      age: [30, [Validators.required, Validators.min(18), Validators.max(100)]],
      family_status: ['single' as const, Validators.required],
      advisor_question: ['Какая ипотека лучше для меня и почему?', [Validators.required, Validators.maxLength(2000)]],
      sort_by: ['score' as const],
    });
  }

  get mode(): 'rules' | 'ai' {
    return (this.form.get('mode')?.value as 'rules' | 'ai') ?? 'rules';
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
    const params: MortgageMatchRequest = {
      price: raw.price,
      down_payment: raw.down_payment,
      income: raw.income,
      expenses: raw.expenses,
      housing_type: raw.housing_type,
      require_income_confirmation: raw.require_income_confirmation,
      children_under_18: raw.children_under_18,
      has_housing: raw.has_housing ?? undefined,
      privileges: raw.privileges ?? [],
      sort_by: raw.sort_by,
    };
    this.programs = [];
    this.advisorAnswer = null;
    this.advisorPrograms = [];

    if (this.mode === 'ai') {
      const downPaymentPercent =
        raw.price > 0 ? Math.max(0, Math.min(100, (raw.down_payment / raw.price) * 100)) : 0;
      const aiAdvisorParams: AIMortgageAdvisorRequest = {
        user_data: {
          property_price: raw.price,
          salary: raw.income,
          monthly_expenses: raw.expenses,
          down_payment_percent: downPaymentPercent,
          age: raw.age,
          family_status: raw.family_status,
          privileges: raw.privileges ?? [],
          has_deposit: !!raw.has_deposit,
          housing_type: raw.housing_type,
        },
        question: raw.advisor_question,
      };
      this.mortgageApi.aiMortgageAdvisor(aiAdvisorParams).subscribe({
        next: (res) => {
          this.advisorAnswer = res.answer ?? null;
          this.advisorPrograms = res.recommended_programs ?? [];
          this.totalCount = this.advisorPrograms.length;
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

  formatLoansTypes(values: string[] | null | undefined): string {
    if (!values?.length) return '—';
    return values.join(', ');
  }
}
