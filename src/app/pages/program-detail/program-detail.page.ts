import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MortgageApiService } from '../../core/services/mortgage-api.service';
import { resolveBankLogo } from '../../core/utils/bank-logo';
import type { ProgramListItem } from '../../core/interfaces/mortgage.types';
import {
  calcAnnuity,
  calcDifferentiated,
  type CalculatorResult,
  type ScheduleRow,
} from './calculator.utils';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-program-detail-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './program-detail.page.html',
  styleUrl: './program-detail.page.scss',
})
export class ProgramDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly mortgageApi = inject(MortgageApiService);
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);

  program = signal<ProgramListItem | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  calcForm!: FormGroup;
  calcResult = signal<CalculatorResult | null>(null);
  calcError = signal<string | null>(null);

  programId = computed(() => {
    const id = this.route.snapshot.paramMap.get('id');
    return id ? parseInt(id, 10) : null;
  });

  getMinDownPayment(): number {
    const p = this.program();
    const price = this.calcForm?.get('price')?.value;
    if (!p || price == null || !price) return 0;
    const percent = parseFloat(p.min_down_payment_percent) || 0;
    return (price * percent) / 100;
  }

  getDownPaymentCouldBeLess(): number {
    const down = this.calcForm?.get('down_payment')?.value;
    const min = this.getMinDownPayment();
    if (down == null || min == null) return 0;
    return Math.max(0, down - min);
  }

  ngOnInit(): void {
    this.calcForm = this.fb.nonNullable.group({
      price: [25_000_000, [Validators.required, Validators.min(1)]],
      down_payment: [5_000_000, [Validators.required, Validators.min(0)]],
      payment_type: ['annuity' as const],
      without_income_confirmation: [false],
    });

    const id = this.programId();
    if (id == null || Number.isNaN(id)) {
      this.error.set(this.translate.instant('programDetail.errId'));
      this.loading.set(false);
      return;
    }
    this.mortgageApi.getProgram(id).subscribe({
      next: (data) => {
        this.program.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.detail ?? err?.message ?? this.translate.instant('programDetail.errLoad'));
      },
    });
  }

  calculate(): void {
    const p = this.program();
    if (!p || this.calcForm.invalid) {
      this.calcForm.markAllAsTouched();
      this.calcError.set(
        this.calcForm.invalid ? this.translate.instant('programDetail.fillCorrect') : null
      );
      return;
    }
    this.calcError.set(null);
    const { price, down_payment, payment_type } = this.calcForm.getRawValue();
    const loanAmount = price - down_payment;
    if (loanAmount <= 0) {
      this.calcError.set(this.translate.instant('programDetail.downTooBig'));
      this.calcResult.set(null);
      return;
    }
    const maxLoan = parseFloat(p.max_loan_amount) || Infinity;
    if (loanAmount > maxLoan) {
      this.calcError.set(
        this.translate.instant('programDetail.loanExceedsMax', {
          max: this.formatMoney(String(maxLoan)),
        })
      );
      this.calcResult.set(null);
      return;
    }
    const minPercent = parseFloat(p.min_down_payment_percent) || 0;
    const minDown = (price * minPercent) / 100;
    if (down_payment < minDown) {
      this.calcError.set(
        this.translate.instant('programDetail.minDownError', {
          amount: this.formatMoney(String(minDown)),
          pct: minPercent,
        })
      );
      this.calcResult.set(null);
      return;
    }
    const termYears = Math.min(p.max_term_years ?? 20, 30);
    const rate = parseFloat(p.interest_rate) || 0;
    const result =
      payment_type === 'annuity'
        ? calcAnnuity(loanAmount, rate, termYears)
        : calcDifferentiated(loanAmount, rate, termYears);
    this.calcResult.set(result);
  }

  formatMoney(value: string | number | null | undefined): string {
    if (value == null || value === '') {
      return this.translate.instant('mortgage.dash');
    }
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    if (Number.isNaN(num)) {
      return this.translate.instant('mortgage.dash');
    }
    const locale =
      this.translate.currentLang === 'en' ? 'en-US' : this.translate.currentLang === 'kk' ? 'kk-KZ' : 'ru-RU';
    return new Intl.NumberFormat(locale, {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  }

  regionLoanLines(p: ProgramListItem): { label: string; amount: string }[] {
    const raw = p.max_loan_by_region;
    if (!raw || typeof raw !== 'object') {
      return [];
    }
    const labelKey: Record<string, string> = {
      astana_almaty: 'programDetail.regionAstanaAlmaty',
      other_regions: 'programDetail.regionOther',
    };
    return Object.entries(raw)
      .filter(([, v]) => v != null && String(v).trim() !== '')
      .map(([key, v]) => ({
        label: labelKey[key] ? this.translate.instant(labelKey[key]) : key,
        amount: `${this.formatMoney(String(v))} ${this.translate.instant('mortgage.currency')}`,
      }));
  }

  housingTypeLabel(type: string): string {
    if (type === 'primary') return this.translate.instant('programDetail.housingPrimaryFull');
    if (type === 'secondary') return this.translate.instant('programDetail.housingSecondaryFull');
    return type;
  }

  housingTypesSummary(p: ProgramListItem): string {
    const values = (p.housing_types && p.housing_types.length ? p.housing_types : [p.housing_type]).filter(Boolean);
    return Array.from(new Set(values)).map((v) => this.housingTypeLabel(v)).join(', ');
  }

  bankSectionText(value: string | null | undefined): boolean {
    return Boolean(value && String(value).trim());
  }

  programHeaderLogo(p: ProgramListItem): string | null {
    return resolveBankLogo(p.bank_logo ?? p.bank_public?.logo, p.bank_name);
  }

  getScheduleRows(): ScheduleRow[] {
    return this.calcResult()?.schedule ?? [];
  }
}
