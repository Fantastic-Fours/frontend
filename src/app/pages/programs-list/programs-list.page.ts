import { Component, OnInit, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MortgageApiService } from '../../core/services/mortgage-api.service';
import type { ProgramListItem } from '../../core/interfaces/mortgage.types';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-programs-list-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './programs-list.page.html',
  styleUrl: './programs-list.page.scss',
})
export class ProgramsListPage implements OnInit {
  private readonly mortgageApi = inject(MortgageApiService);
  private readonly platformId = inject(PLATFORM_ID);

  programs = signal<ProgramListItem[]>([]);
  totalCount = signal(0);
  currentPage = signal(1);
  loading = signal(false);
  error = signal<string | null>(null);

  totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / PAGE_SIZE)));
  hasNext = computed(() => this.currentPage() < this.totalPages());
  hasPrev = computed(() => this.currentPage() > 1);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadPage(1);
    }
  }

  loadPage(page: number): void {
    this.error.set(null);
    this.loading.set(true);
    this.mortgageApi.getPrograms(page, PAGE_SIZE).subscribe({
      next: (res) => {
        this.programs.set(res.results ?? []);
        this.totalCount.set(res.count ?? res.results?.length ?? 0);
        this.currentPage.set(page);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.detail ?? err?.message ?? 'Ошибка загрузки списка';
        this.error.set(msg);
      },
    });
  }

  nextPage(): void {
    if (this.hasNext()) this.loadPage(this.currentPage() + 1);
  }

  prevPage(): void {
    if (this.hasPrev()) this.loadPage(this.currentPage() - 1);
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

  housingTypeLabel(type: string): string {
    return type === 'primary' ? 'Первичка' : type === 'secondary' ? 'Вторичка' : type;
  }
}
