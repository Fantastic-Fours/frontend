import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UserApiService } from '../../core/services/user-api.service';
import { MarkdownPipe } from '../../core/pipes/markdown.pipe';
import type { CalculationHistoryItem } from '../../core/interfaces/user.types';

const PAGE_SIZE = 10;

interface HistorySnapshotProgram {
  program_id: number;
  program_name?: string;
  bank_name?: string;
  score?: number;
}

@Component({
  selector: 'app-calculation-history-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe, MarkdownPipe],
  templateUrl: './calculation-history.page.html',
  styleUrl: './calculation-history.page.scss',
})
export class CalculationHistoryPage implements OnInit {
  private readonly userApi = inject(UserApiService);
  private readonly translate = inject(TranslateService);

  items = signal<CalculationHistoryItem[]>([]);
  totalCount = signal(0);
  currentPage = signal(1);
  loading = signal(true);
  error = signal<string | null>(null);

  totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / PAGE_SIZE)));
  hasNext = computed(() => this.currentPage() < this.totalPages());
  hasPrev = computed(() => this.currentPage() > 1);

  ngOnInit(): void {
    this.loadPage(1);
  }

  loadPage(page: number): void {
    this.error.set(null);
    this.loading.set(true);
    this.userApi.getCalculationHistory(page, PAGE_SIZE).subscribe({
      next: (res) => {
        this.items.set(res.results ?? []);
        this.totalCount.set(res.count ?? res.results?.length ?? 0);
        this.currentPage.set(page);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.detail ?? err?.message ?? this.translate.instant('calcHistory.errLoad'));
      },
    });
  }

  nextPage(): void {
    if (this.hasNext()) this.loadPage(this.currentPage() + 1);
  }

  prevPage(): void {
    if (this.hasPrev()) this.loadPage(this.currentPage() - 1);
  }

  formatDate(iso: string | undefined): string {
    if (!iso) return this.translate.instant('mortgage.dash');
    try {
      return new Date(iso).toLocaleString(this.numberLocale(), {
        dateStyle: 'short',
        timeStyle: 'short',
      });
    } catch {
      return iso;
    }
  }

  private numberLocale(): string {
    const lang = this.translate.currentLang || 'ru';
    if (lang === 'en') return 'en-US';
    if (lang === 'kk') return 'kk-KZ';
    return 'ru-RU';
  }

  formatMoney(value: unknown): string {
    if (value == null) return this.translate.instant('mortgage.dash');
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    if (Number.isNaN(num)) return String(value);
    return (
      new Intl.NumberFormat(this.numberLocale(), {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(num) +
      ' ' +
      this.translate.instant('mortgage.currency')
    );
  }

  formatScore(value: number): string {
    return new Intl.NumberFormat(this.numberLocale(), {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  /** Whether result_snapshot has keys to display. */
  hasResultSnapshot(item: CalculationHistoryItem): boolean {
    const r = item.result_snapshot;
    return !!r && typeof r === 'object' && Object.keys(r).length > 0;
  }

  snapshotRecord(item: CalculationHistoryItem): Record<string, unknown> {
    const r = item.result_snapshot;
    return r && typeof r === 'object' ? (r as Record<string, unknown>) : {};
  }

  isAiAdvisorSnapshot(r: Record<string, unknown>): boolean {
    return (
      r['source'] === 'ai_advisor' ||
      (Array.isArray(r['recommended_programs']) && r['recommended_programs'].length > 0)
    );
  }

  getAnswerExcerpt(r: Record<string, unknown>): string | null {
    const ex = r['answer_excerpt'];
    return typeof ex === 'string' && ex.trim() ? ex.trim() : null;
  }

  getRecommendedPrograms(r: Record<string, unknown>): HistorySnapshotProgram[] {
    const raw = r['recommended_programs'];
    if (!Array.isArray(raw)) return [];
    const out: HistorySnapshotProgram[] = [];
    for (const x of raw) {
      if (!x || typeof x !== 'object') continue;
      const o = x as Record<string, unknown>;
      const id = Number(o['program_id']);
      if (!Number.isFinite(id)) continue;
      out.push({
        program_id: id,
        program_name: typeof o['program_name'] === 'string' ? o['program_name'] : undefined,
        bank_name: typeof o['bank_name'] === 'string' ? o['bank_name'] : undefined,
        score: typeof o['score'] === 'number' ? o['score'] : undefined,
      });
    }
    return out;
  }

  getProgramIds(r: Record<string, unknown>): number[] {
    const raw = r['program_ids'];
    if (!Array.isArray(raw)) return [];
    return raw.map((x) => Number(x)).filter((n) => Number.isFinite(n));
  }

  getApartmentIdsCount(r: Record<string, unknown>): number {
    const raw = r['apartment_ids'];
    return Array.isArray(raw) ? raw.length : 0;
  }

  /** Human-readable line for calculator-style snapshots (programs + apartments). */
  calculatorResultSummary(r: Record<string, unknown>): string {
    const parts: string[] = [];
    const n = Number(r['total_count']);
    if (Number.isFinite(n) && n > 0) {
      parts.push(this.translate.instant('calcHistory.resultProgramsCount', { n }));
    }
    const aptN = this.getApartmentIdsCount(r);
    if (aptN > 0) {
      parts.push(this.translate.instant('calcHistory.resultApartmentsCount', { n: aptN }));
    }
    return parts.length ? parts.join(' · ') : this.translate.instant('calcHistory.resultSaved');
  }

  programLinkLabel(p: HistorySnapshotProgram): string {
    const bank = p.bank_name?.trim();
    const name = p.program_name?.trim();
    if (bank && name) return `${bank} — ${name}`;
    if (name) return name;
    if (bank) return bank;
    return this.translate.instant('calcHistory.openProgram', { id: p.program_id });
  }

  /** Get short summary from request_snapshot for display. */
  requestSummary(req: Record<string, unknown>): string {
    const parts: string[] = [];
    if (req['source'] === 'ai_advisor') {
      parts.push(this.translate.instant('calcHistory.summaryAi'));
    }
    if (req['property_price'] != null) {
      parts.push(
        this.translate.instant('calcHistory.summaryPrice', { v: this.formatMoney(req['property_price']) }),
      );
    }
    if (req['income'] != null) {
      parts.push(this.translate.instant('calcHistory.summaryIncome', { v: this.formatMoney(req['income']) }));
    }
    if (req['down_payment'] != null) {
      parts.push(this.translate.instant('calcHistory.summaryDown', { v: this.formatMoney(req['down_payment']) }));
    }
    if (req['term_years'] != null) {
      const y = Number(req['term_years']);
      if (!Number.isNaN(y)) {
        parts.push(this.translate.instant('calcHistory.summaryTerm', { y }));
      }
    }
    const ht = req['housing_type'];
    if (ht != null && String(ht).trim()) {
      const s = String(ht).toLowerCase();
      if (s === 'primary') parts.push(this.translate.instant('submitAd.housingPrimary'));
      else if (s === 'secondary') parts.push(this.translate.instant('submitAd.housingSecondary'));
      else parts.push(String(ht));
    }
    return parts.length ? parts.join(' · ') : this.translate.instant('mortgage.dash');
  }
}
