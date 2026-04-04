import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WheelPaginationComponent } from '../../components/ui';
import { UserApiService } from '../../core/services/user-api.service';
import type { CalculationHistoryItem } from '../../core/interfaces/user.types';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-calculation-history-page',
  standalone: true,
  imports: [RouterLink, JsonPipe, WheelPaginationComponent],
  templateUrl: './calculation-history.page.html',
  styleUrl: './calculation-history.page.scss',
})
export class CalculationHistoryPage implements OnInit {
  private readonly userApi = inject(UserApiService);

  items = signal<CalculationHistoryItem[]>([]);
  totalCount = signal(0);
  currentPage = signal(1);
  loading = signal(true);
  error = signal<string | null>(null);

  totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / PAGE_SIZE)));

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
        this.error.set(err?.error?.detail ?? err?.message ?? 'Ошибка загрузки');
      },
    });
  }

  formatDate(iso: string | undefined): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('ru-RU', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
    } catch {
      return iso;
    }
  }

  formatMoney(value: unknown): string {
    if (value == null) return '—';
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    if (Number.isNaN(num)) return String(value);
    return new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num) + ' ₸';
  }

  /** Whether result_snapshot has keys to display. */
  hasResultSnapshot(item: CalculationHistoryItem): boolean {
    const r = item.result_snapshot;
    return !!r && typeof r === 'object' && Object.keys(r).length > 0;
  }

  /** Get short summary from request_snapshot for display. */
  requestSummary(req: Record<string, unknown>): string {
    const parts: string[] = [];
    if (req['income'] != null) parts.push(`Доход: ${this.formatMoney(req['income'])}`);
    if (req['down_payment'] != null) parts.push(`Взнос: ${this.formatMoney(req['down_payment'])}`);
    if (req['term_years'] != null) parts.push(`Срок: ${req['term_years']} лет`);
    if (req['housing_type']) parts.push(String(req['housing_type']));
    return parts.length ? parts.join(' · ') : '—';
  }
}
