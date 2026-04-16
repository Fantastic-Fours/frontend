import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MortgageApiService } from '../../core/services/mortgage-api.service';
import { MarkdownPipe } from '../../core/pipes/markdown.pipe';
import { AuthTokenService } from '../../core/services/auth-token.service';
import { UserApiService } from '../../core/services/user-api.service';
import { getBankLogoPath } from '../../core/utils/bank-logo';
import type { CalculationHistoryCreateRequest } from '../../core/interfaces/user.types';
import type {
  MortgageProgramItem,
  MortgageMatchRequest,
  MortgagePlanPdfRequest,
  AIMortgageAdvisorProgram,
  AIMortgageAdvisorRequest,
} from '../../core/interfaces/mortgage.types';

@Component({
  selector: 'app-mortgage-match-page',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, RouterLink, TranslatePipe, MarkdownPipe],
  templateUrl: './mortgage-match.page.html',
  styleUrl: './mortgage-match.page.scss',
})
export class MortgageMatchPage implements OnDestroy, OnInit {
  private readonly translate = inject(TranslateService);

  readonly PRICE_MIN = 5_000_000;
  readonly PRICE_MAX = 100_000_000;
  readonly PRICE_STEP = 1_000_000;
  readonly INCOME_MIN = 150_000;
  readonly INCOME_MAX = 2_000_000;
  readonly INCOME_STEP = 50_000;
  readonly EXPENSES_MIN = 50_000;
  readonly EXPENSES_STEP = 10_000;
  readonly DOWN_STEP = 100_000;

  housingOptions: { value: 'primary' | 'secondary'; label: string }[] = [];

  privilegeOptionsFull: { value: string; label: string }[] = [];

  sortByOptions: { value: 'score' | 'monthly_payment' | 'total_overpayment'; label: string }[] =
    [];

  hasHousingSelectOptions: { value: string; label: string }[] = [];

  form: FormGroup;

  programs: MortgageProgramItem[] = [];
  advisorAnswer: string | null = null;
  advisorPrograms: AIMortgageAdvisorProgram[] = [];
  totalCount = 0;
  loading = false;
  pdfLoading = false;
  error: string | null = null;
  submitted = false;
  lastMode: 'rules' | 'ai' = 'rules';
  savingAiHistory = false;
  aiHistorySavedOk = false;
  aiHistorySaveError: string | null = null;

  private subs = new Subscription();

  constructor(
    private fb: FormBuilder,
    private mortgageApi: MortgageApiService,
    private authTokens: AuthTokenService,
    private userApi: UserApiService,
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
      advisor_question: [''],
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

  ngOnInit(): void {
    this.refreshI18n(false);
    this.subs.add(this.translate.onLangChange.subscribe(() => this.refreshI18n(true)));
  }

  private refreshI18n(langChangeOnly: boolean): void {
    const t = (k: string) => this.translate.instant(k);
    if (!langChangeOnly) {
      this.form.patchValue(
        { advisor_question: t('matchPage.aiQuestionDefault') },
        { emitEvent: false },
      );
    }

    this.housingOptions = [
      { value: 'primary', label: t('matchPage.housingPrimary') },
      { value: 'secondary', label: t('matchPage.housingSecondary') },
    ];

    this.privilegeOptionsFull = [
      { value: 'veteran_ww2', label: t('matchPage.privVeteranWw2') },
      { value: 'veteran_equivalent', label: t('matchPage.privVeteranEq') },
      { value: 'combat_veteran', label: t('matchPage.privCombatVet') },
      { value: 'disabled_group_1', label: t('matchPage.privDis1') },
      { value: 'disabled_group_2', label: t('matchPage.privDis2') },
      { value: 'family_with_disabled_child', label: t('matchPage.privFamDisChild') },
      { value: 'widow', label: t('matchPage.privWidow') },
      { value: 'large_family', label: t('matchPage.privLargeFam') },
      { value: 'orphan', label: t('matchPage.privOrphan') },
    ];

    this.sortByOptions = [
      { value: 'score', label: t('matchPage.sortScore') },
      { value: 'monthly_payment', label: t('matchPage.sortMonthly') },
      { value: 'total_overpayment', label: t('matchPage.sortOverpay') },
    ];

    this.hasHousingSelectOptions = [
      { value: '', label: t('matchPage.hasHousingUnset') },
      { value: 'true', label: t('matchPage.hasHousingYes') },
      { value: 'false', label: t('matchPage.hasHousingNo') },
    ];
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

  private numberLocale(): string {
    const lang = this.translate.getCurrentLang() || 'ru';
    if (lang === 'en') return 'en-US';
    if (lang === 'kk') return 'kk-KZ';
    return 'ru-KZ';
  }

  formatSum(n: number): string {
    return new Intl.NumberFormat(this.numberLocale(), {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(Math.round(n));
  }

  formatMillionLabel(n: number): string {
    if (n >= 1_000_000) {
      const m = n / 1_000_000;
      const label = Number.isInteger(m) ? String(m) : String(Math.round(m * 10) / 10);
      return this.translate.instant('matchPage.formatMillion', { v: label });
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
  } {
    return {
      privileges: [...this.privilegesExtra],
      tags: [],
    };
  }

  submitRegular(event?: Event): void {
    event?.preventDefault();
    this.submit('rules');
  }

  submitAi(event?: Event): void {
    event?.preventDefault();
    this.submit('ai');
  }

  downloadPlanPdf(event?: Event): void {
    event?.preventDefault();
    const params = this.buildPlanPdfParams();
    if (!params) return;
    this.pdfLoading = true;
    this.error = null;
    this.subs.add(
      this.mortgageApi.downloadMortgagePlan(params).subscribe({
        next: (blob) => {
          this.pdfLoading = false;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'my-mortgage-plan.pdf';
          a.rel = 'noopener';
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        },
        error: (err: Error) => {
          this.pdfLoading = false;
          this.error = err?.message ?? this.translate.instant('mortgage.errPdf');
        },
      }),
    );
  }

  /** Параметры для GET /mortgage/plan/pdf/ (как у подбора, без тегов — топ-3 по правилам). */
  private buildPlanPdfParams(): MortgagePlanPdfRequest | null {
    this.clampDownPayment();
    this.clampExpenses();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return null;
    }
    const raw = this.form.getRawValue();
    const { privileges: privFromBenefits } = this.collectPrivilegesAndTags();
    const privileges = [...new Set([...privFromBenefits, ...(raw.privileges_extra ?? [])])];

    let hasHousing: boolean | null | undefined;
    if (raw.has_housing === 'true') hasHousing = true;
    else if (raw.has_housing === 'false') hasHousing = false;
    else hasHousing = undefined;
    const termYears = Number(raw.term_years);
    const termForPdf =
      Number.isFinite(termYears) && termYears > 0 ? Math.min(35, Math.max(1, termYears)) : 20;
    const childrenN = Number(raw.children_under_18);

    return {
      price: raw.price,
      down_payment: raw.down_payment,
      income: raw.income,
      expenses: raw.expenses,
      term_years: termForPdf,
      housing_type: raw.housing_type,
      sort_by: raw.sort_by,
      require_income_confirmation: raw.require_income_confirmation,
      children_under_18: Number.isFinite(childrenN) ? Math.max(0, childrenN) : 0,
      has_housing: hasHousing ?? undefined,
      has_deposit: raw.has_deposit,
      privileges,
    };
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
    const { privileges, tags } = this.collectPrivilegesAndTags();

    let hasHousing: boolean | null | undefined;
    if (raw.has_housing === 'true') hasHousing = true;
    else if (raw.has_housing === 'false') hasHousing = false;
    else hasHousing = undefined;

    this.programs = [];
    this.advisorAnswer = null;
    this.advisorPrograms = [];

    if (mode === 'ai') {
      this.aiHistorySavedOk = false;
      this.aiHistorySaveError = null;
      if (!this.authTokens.hasTokens()) {
        this.loading = false;
        this.error = this.translate.instant('matchPage.errAiNeedLogin');
        return;
      }
      const downPaymentPercent =
        raw.price > 0
          ? Math.max(0, Math.min(100, (raw.down_payment / raw.price) * 100))
          : 0;
      const q =
        typeof raw.advisor_question === 'string' && raw.advisor_question.trim()
          ? raw.advisor_question.trim()
          : this.translate.instant('matchPage.aiQuestionDefault');
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
          const d = err?.error?.detail;
          this.error =
            typeof d === 'string'
              ? d
              : Array.isArray(d)
                ? d.map((x: { string?: string }) => x?.string ?? '').filter(Boolean).join(' ')
                : err?.message ?? this.translate.instant('matchPage.errAi');
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
        this.error =
          err?.error?.detail ?? err?.message ?? this.translate.instant('matchPage.errMatch');
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
    return new Intl.NumberFormat(this.numberLocale(), {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  }

  formatLoansTypes(values: string[] | null | undefined): string {
    if (!values?.length) return this.translate.instant('matchPage.dash');
    return values.join(', ');
  }

  saveAiTop3ToHistory(event?: Event): void {
    event?.preventDefault();
    if (!this.authTokens.hasTokens()) {
      this.aiHistorySaveError = this.translate.instant('matchPage.errAiNeedLogin');
      return;
    }
    const payload = this.buildAiHistoryPayload();
    if (!payload) return;
    this.savingAiHistory = true;
    this.aiHistorySaveError = null;
    this.aiHistorySavedOk = false;
    this.subs.add(
      this.userApi.createCalculationHistory(payload).subscribe({
        next: () => {
          this.savingAiHistory = false;
          this.aiHistorySavedOk = true;
        },
        error: (err: { error?: { detail?: unknown }; message?: string }) => {
          this.savingAiHistory = false;
          const d = err?.error?.detail;
          this.aiHistorySaveError =
            typeof d === 'string'
              ? d
              : err?.message ?? this.translate.instant('matchPage.saveAiHistoryErr');
        },
      }),
    );
  }

  private buildAiHistoryPayload(): CalculationHistoryCreateRequest | null {
    if (this.lastMode !== 'ai' || this.loading || this.advisorPrograms.length === 0) {
      return null;
    }
    const raw = this.form.getRawValue();
    const { privileges } = this.collectPrivilegesAndTags();
    const downPaymentPercent =
      raw.price > 0 ? Math.max(0, Math.min(100, (raw.down_payment / raw.price) * 100)) : 0;
    const q =
      typeof raw.advisor_question === 'string' && raw.advisor_question.trim()
        ? raw.advisor_question.trim()
        : this.translate.instant('matchPage.aiQuestionDefault');
    const termYears = Number(raw.term_years);
    const ageN = Number(raw.age);

    return {
      request_snapshot: {
        source: 'ai_advisor',
        income: String(raw.income),
        down_payment: String(raw.down_payment),
        expenses: String(raw.expenses),
        property_price: raw.price,
        term_years:
          Number.isFinite(termYears) && termYears > 0 ? Math.min(35, Math.max(1, termYears)) : undefined,
        housing_type: raw.housing_type,
        privileges,
        question: q,
        age: Number.isFinite(ageN) ? ageN : raw.age,
        family_status: raw.family_status,
        has_deposit: raw.has_deposit,
        down_payment_percent: Math.round(downPaymentPercent * 100) / 100,
      },
      result_snapshot: {
        source: 'ai_advisor',
        total_count: this.advisorPrograms.length,
        program_ids: this.advisorPrograms.map((p) => p.program_id),
        recommended_programs: this.advisorPrograms.map((p) => ({
          program_id: p.program_id,
          program_name: p.program_name,
          bank_name: p.bank_name,
          score: p.score,
        })),
        has_explanation: !!this.advisorAnswer,
        ...(this.advisorAnswer && this.advisorAnswer.length > 0
          ? { answer_excerpt: this.advisorAnswer.slice(0, 2000) }
          : {}),
      },
    };
  }
}
