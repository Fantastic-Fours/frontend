import { Component, OnDestroy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { MortgageApiService } from '../../core/services/mortgage-api.service';
import { getBankLogoPath } from '../../core/utils/bank-logo';
import type {
  MortgageProgramItem,
  MortgageMatchRequest,
  AIMortgageAdvisorProgram,
  AIMortgageAdvisorRequest,
} from '../../core/interfaces/mortgage.types';

type BenefitId = '7-20-20' | 'first-home' | 'large-family' | 'young-family';

@Component({
  selector: 'app-mortgage-match-page',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './mortgage-match.page.html',
  styleUrl: './mortgage-match.page.scss',
})
export class MortgageMatchPage implements OnDestroy {
  readonly PRICE_MIN = 5_000_000;
  readonly PRICE_MAX = 100_000_000;
  readonly PRICE_STEP = 1_000_000;
  readonly INCOME_MIN = 150_000;
  readonly INCOME_MAX = 2_000_000;
  readonly INCOME_STEP = 50_000;
  readonly EXPENSES_MIN = 50_000;
  readonly EXPENSES_STEP = 10_000;
  readonly DOWN_STEP = 100_000;

  readonly benefitOptions: {
    id: BenefitId;
    label: string;
    tags?: string[];
    privileges?: string[];
    hasHousing?: boolean | null;
  }[] = [
    { id: '7-20-20', label: '7-20-20 (Баспана хит)', tags: ['s-nakopleniem-15-20'] },
    { id: 'first-home', label: 'Первое жильё', hasHousing: false },
    {
      id: 'large-family',
      label: 'Многодетная семья',
      privileges: ['large_family'],
      tags: ['mnogodetnaya-semya'],
    },
    { id: 'young-family', label: 'Молодая семья', tags: ['molodaya-semya'] },
  ];

  readonly housingOptions = [
    { value: 'primary' as const, label: 'Новостройка (первичный рынок)' },
    { value: 'secondary' as const, label: 'Вторичный рынок' },
  ];

  /** Полный список льгот API (как в старой форме подбора) */
  readonly privilegeOptionsFull: { value: string; label: string }[] = [
    { value: 'veteran_ww2', label: 'Ветеран ВОВ' },
    { value: 'veteran_equivalent', label: 'Приравненный к ветерану ВОВ' },
    { value: 'combat_veteran', label: 'Ветеран боевых действий' },
    { value: 'disabled_group_1', label: 'Инвалид I группы' },
    { value: 'disabled_group_2', label: 'Инвалид II группы' },
    { value: 'family_with_disabled_child', label: 'Семья с ребёнком-инвалидом' },
    { value: 'widow', label: 'Вдова' },
    { value: 'large_family', label: 'Многодетная семья' },
    { value: 'orphan', label: 'Сирота' },
  ];

  readonly sortByOptions: { value: 'score' | 'monthly_payment' | 'total_overpayment'; label: string }[] = [
    { value: 'score', label: 'По релевантности (score)' },
    { value: 'monthly_payment', label: 'По ежемесячному платежу' },
    { value: 'total_overpayment', label: 'По сумме переплаты' },
  ];

  readonly hasHousingSelectOptions: { value: string; label: string }[] = [
    { value: '', label: 'Не указано' },
    { value: 'true', label: 'Есть жильё' },
    { value: 'false', label: 'Нет жильё' },
  ];

  form: FormGroup;
  selectedBenefits = new Set<BenefitId>();

  programs: MortgageProgramItem[] = [];
  advisorAnswer: string | null = null;
  advisorPrograms: AIMortgageAdvisorProgram[] = [];
  totalCount = 0;
  loading = false;
  error: string | null = null;
  submitted = false;
  lastMode: 'rules' | 'ai' = 'rules';

  private subs = new Subscription();

  constructor(
    private fb: FormBuilder,
    private mortgageApi: MortgageApiService,
  ) {
    this.form = this.fb.nonNullable.group({
      price: [30_000_000, [Validators.required, Validators.min(this.PRICE_MIN)]],
      down_payment: [6_000_000, [Validators.required, Validators.min(0)]],
      income: [500_000, [Validators.required, Validators.min(this.INCOME_MIN)]],
      expenses: [150_000, [Validators.required, Validators.min(this.EXPENSES_MIN)]],
      housing_type: ['primary' as const, Validators.required],
      term_years: [20, [Validators.min(5), Validators.max(35)]],
      sort_by: ['score' as const],
      children_under_18: [0, [Validators.min(0), Validators.max(20)]],
      has_housing: [''],
      require_income_confirmation: [true],
      privileges_extra: [[] as string[]],
      age: [30, [Validators.min(18), Validators.max(100)]],
      family_status: ['single'],
      advisor_question: [
        'Подберите Top-3 ипотечные программы под мои параметры и кратко объясните, почему они мне подходят.',
      ],
      has_deposit: [false],
    });

    this.subs.add(
      this.form.get('price')!.valueChanges.subscribe(() => {
        this.clampDownPayment();
      }),
    );
    this.subs.add(
      this.form.get('income')!.valueChanges.subscribe(() => {
        this.clampExpenses();
      }),
    );
    this.subs.add(
      this.form.get('down_payment')!.valueChanges.subscribe(() => {
        this.clampDownPayment();
      }),
    );
    this.subs.add(
      this.form.get('expenses')!.valueChanges.subscribe(() => {
        this.clampExpenses();
      }),
    );
    this.clampDownPayment();
    this.clampExpenses();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  get priceVal(): number {
    return Number(this.form.get('price')?.value) || 0;
  }

  get incomeVal(): number {
    return Number(this.form.get('income')?.value) || 0;
  }

  get downPayMin(): number {
    const p = this.priceVal;
    if (p <= 0) return this.DOWN_STEP;
    return Math.max(Math.round(p * 0.1), this.DOWN_STEP);
  }

  get downPayMax(): number {
    const p = this.priceVal;
    if (p <= 0) return this.PRICE_MAX;
    return Math.max(this.downPayMin, Math.round(p * 0.5));
  }

  get expensesMax(): number {
    const inc = this.incomeVal;
    if (inc <= 0) return this.EXPENSES_MIN;
    return Math.max(this.EXPENSES_MIN, Math.floor(inc * 0.7));
  }

  get loanAmount(): number {
    return Math.max(0, this.priceVal - (Number(this.form.get('down_payment')?.value) || 0));
  }

  get downPaymentPercent(): string {
    const p = this.priceVal;
    if (p <= 0) return '0';
    const d = Number(this.form.get('down_payment')?.value) || 0;
    return Math.round((d / p) * 100).toString();
  }

  get paymentCapacity(): number {
    return Math.max(0, this.incomeVal - (Number(this.form.get('expenses')?.value) || 0));
  }

  get expensePercentOfIncome(): string {
    const inc = this.incomeVal;
    if (inc <= 0) return '0';
    const exp = Number(this.form.get('expenses')?.value) || 0;
    return Math.min(100, Math.round((exp / inc) * 100)).toString();
  }

  formatSum(n: number): string {
    return new Intl.NumberFormat('ru-KZ', {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(Math.round(n));
  }

  formatMillionLabel(n: number): string {
    if (n >= 1_000_000) {
      const m = n / 1_000_000;
      const label = Number.isInteger(m) ? String(m) : String(Math.round(m * 10) / 10);
      return `${label} млн \u20B8`;
    }
    return `${this.formatSum(n)} \u20B8`;
  }

  patchPriceFromRange(v: number): void {
    this.form.patchValue({ price: v });
  }

  patchDownFromRange(v: number): void {
    this.form.patchValue({ down_payment: v });
  }

  patchIncomeFromRange(v: number): void {
    this.form.patchValue({ income: v });
  }

  patchExpensesFromRange(v: number): void {
    this.form.patchValue({ expenses: v });
  }

  isBenefitChecked(id: BenefitId): boolean {
    return this.selectedBenefits.has(id);
  }

  toggleBenefit(id: BenefitId, checked: boolean): void {
    const next = new Set(this.selectedBenefits);
    if (checked) next.add(id);
    else next.delete(id);
    this.selectedBenefits = next;
  }

  benefitLabel(id: BenefitId): string {
    return this.benefitOptions.find((b) => b.id === id)?.label ?? id;
  }

  get selectedBenefitList(): BenefitId[] {
    return Array.from(this.selectedBenefits);
  }

  get privilegesExtra(): string[] {
    return this.form.get('privileges_extra')?.value ?? [];
  }

  isExtraPrivilegeChecked(code: string): boolean {
    return this.privilegesExtra.includes(code);
  }

  toggleExtraPrivilege(code: string, checked: boolean): void {
    const cur = [...this.privilegesExtra];
    if (checked) {
      if (!cur.includes(code)) cur.push(code);
    } else {
      const i = cur.indexOf(code);
      if (i >= 0) cur.splice(i, 1);
    }
    this.form.patchValue({ privileges_extra: cur });
  }

  clampDownPayment(): void {
    const price = this.priceVal;
    if (price < this.PRICE_MIN) return;
    let d = Number(this.form.get('down_payment')?.value) || 0;
    const min = this.downPayMin;
    const max = this.downPayMax;
    d = Math.min(max, Math.max(min, d));
    const stepped = Math.round(d / this.DOWN_STEP) * this.DOWN_STEP;
    const final = Math.min(max, Math.max(min, stepped));
    if (final !== Number(this.form.get('down_payment')?.value)) {
      this.form.patchValue({ down_payment: final }, { emitEvent: false });
    }
  }

  clampExpenses(): void {
    let exp = Number(this.form.get('expenses')?.value) || 0;
    const max = this.expensesMax;
    const min = this.EXPENSES_MIN;
    exp = Math.min(max, Math.max(min, exp));
    const stepped = Math.round(exp / this.EXPENSES_STEP) * this.EXPENSES_STEP;
    const final = Math.min(max, Math.max(min, stepped));
    if (final !== Number(this.form.get('expenses')?.value)) {
      this.form.patchValue({ expenses: final }, { emitEvent: false });
    }
  }

  private collectPrivilegesAndTags(): {
    privileges: string[];
    tags: string[];
    hasHousing: boolean | null | undefined;
  } {
    const privileges: string[] = [];
    const tags: string[] = [];
    let hasHousing: boolean | null | undefined = undefined;

    for (const id of this.selectedBenefits) {
      const def = this.benefitOptions.find((b) => b.id === id);
      if (!def) continue;
      def.privileges?.forEach((p) => {
        if (!privileges.includes(p)) privileges.push(p);
      });
      def.tags?.forEach((t) => {
        if (!tags.includes(t)) tags.push(t);
      });
      if (def.hasHousing !== undefined) {
        hasHousing = def.hasHousing;
      }
    }
    return { privileges, tags, hasHousing };
  }

  submitRegular(event?: Event): void {
    event?.preventDefault();
    this.submit('rules');
  }

  submitAi(event?: Event): void {
    event?.preventDefault();
    this.submit('ai');
  }

  private submit(mode: 'rules' | 'ai'): void {
    this.clampDownPayment();
    this.clampExpenses();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error = null;
    this.loading = true;
    this.submitted = true;
    this.lastMode = mode;

    const raw = this.form.getRawValue();
    const { privileges: privFromBenefits, tags, hasHousing: hasHousingFromBenefits } =
      this.collectPrivilegesAndTags();
    const privileges = [...new Set([...privFromBenefits, ...(raw.privileges_extra ?? [])])];

    let hasHousing: boolean | null | undefined;
    if (raw.has_housing === 'true') hasHousing = true;
    else if (raw.has_housing === 'false') hasHousing = false;
    else hasHousing = undefined;
    if (hasHousing === undefined && hasHousingFromBenefits !== undefined) {
      hasHousing = hasHousingFromBenefits ?? undefined;
    }

    this.programs = [];
    this.advisorAnswer = null;
    this.advisorPrograms = [];

    if (mode === 'ai') {
      const downPaymentPercent =
        raw.price > 0
          ? Math.max(0, Math.min(100, (raw.down_payment / raw.price) * 100))
          : 0;
      const q =
        typeof raw.advisor_question === 'string' && raw.advisor_question.trim()
          ? raw.advisor_question.trim()
          : 'Подберите Top-3 ипотечные программы под мои параметры и кратко объясните, почему они мне подходят.';
      const ageN = Number(raw.age);
      const aiAdvisorParams: AIMortgageAdvisorRequest = {
        user_data: {
          property_price: raw.price,
          salary: raw.income,
          monthly_expenses: raw.expenses,
          down_payment_percent: downPaymentPercent,
          age: Number.isFinite(ageN) ? ageN : 30,
          family_status: raw.family_status,
          privileges,
          has_deposit: raw.has_deposit,
          housing_type: raw.housing_type,
        },
        question: q,
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

    const termYears = Number(raw.term_years);
    const childrenN = Number(raw.children_under_18);
    const params: MortgageMatchRequest = {
      price: raw.price,
      down_payment: raw.down_payment,
      income: raw.income,
      expenses: raw.expenses,
      housing_type: raw.housing_type,
      term_years: Number.isFinite(termYears) && termYears > 0 ? termYears : undefined,
      require_income_confirmation: raw.require_income_confirmation,
      children_under_18: Number.isFinite(childrenN) ? Math.max(0, childrenN) : 0,
      has_housing: hasHousing ?? undefined,
      privileges,
      has_deposit: raw.has_deposit,
      tags: tags.length ? tags : undefined,
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

  get mode(): 'rules' | 'ai' {
    return this.lastMode;
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
